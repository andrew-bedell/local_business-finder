export const config = { api: { bodyParser: false }, maxDuration: 60 };

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const DEFAULT_AZURE_MODEL = 'mai-transcribe-1';
const DEFAULT_AZURE_API_VERSION = '2025-10-15';

function firstEnv(names) {
  for (var i = 0; i < names.length; i += 1) {
    var value = process.env[names[i]];
    if (value) return String(value).trim();
  }
  return '';
}

function getProvider() {
  var requested = String(process.env.VOICE_TRANSCRIPTION_PROVIDER || '').trim().toLowerCase();
  if (requested) return requested;

  var hasAzure = firstEnv(['AZURE_SPEECH_API_KEY', 'AZURE_AI_SPEECH_API_KEY', 'MICROSOFT_SPEECH_API_KEY']);
  var hasOpenAI = process.env.OPENAI_API_KEY;
  if (hasAzure) return 'azure';
  if (hasOpenAI) return 'openai';
  return 'azure';
}

function getAzureEndpoint() {
  var endpoint = firstEnv(['AZURE_SPEECH_ENDPOINT', 'AZURE_AI_SPEECH_ENDPOINT', 'MICROSOFT_SPEECH_ENDPOINT']);
  if (endpoint) return endpoint.replace(/\/+$/, '');

  var region = firstEnv(['AZURE_SPEECH_REGION', 'AZURE_AI_SPEECH_REGION', 'MICROSOFT_SPEECH_REGION']);
  if (region) return 'https://' + region + '.api.cognitive.microsoft.com';

  return '';
}

function getAudioFilename(contentType) {
  if (contentType.indexOf('mpeg') !== -1 || contentType.indexOf('mp3') !== -1) return 'answer.mp3';
  if (contentType.indexOf('flac') !== -1) return 'answer.flac';
  return 'answer.wav';
}

function extractTranscript(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (Array.isArray(payload.combinedPhrases)) {
    return payload.combinedPhrases
      .map(function (phrase) { return phrase && phrase.text ? String(phrase.text).trim() : ''; })
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  if (typeof payload.text === 'string') return payload.text.trim();
  if (typeof payload.transcript === 'string') return payload.transcript.trim();
  if (typeof payload.displayText === 'string') return payload.displayText.trim();
  return '';
}

async function readRequestBody(req) {
  var chunks = [];
  for await (var chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function transcribeWithAzure(audioBuffer, contentType, locale) {
  var apiKey = firstEnv(['AZURE_SPEECH_API_KEY', 'AZURE_AI_SPEECH_API_KEY', 'MICROSOFT_SPEECH_API_KEY']);
  var endpoint = getAzureEndpoint();
  if (!apiKey || !endpoint) {
    var missing = !apiKey ? 'Azure Speech API key' : 'Azure Speech endpoint or region';
    var err = new Error(missing + ' not configured');
    err.statusCode = 503;
    throw err;
  }

  var form = new FormData();
  form.append('audio', new Blob([audioBuffer], { type: contentType || 'audio/wav' }), getAudioFilename(contentType || 'audio/wav'));

  var definition = {
    enhancedMode: {
      enabled: true,
      task: 'transcribe',
      model: process.env.AZURE_SPEECH_TRANSCRIPTION_MODEL || DEFAULT_AZURE_MODEL
    }
  };

  if (locale) {
    definition.locales = [locale];
  }

  form.append('definition', JSON.stringify(definition));

  var apiVersion = process.env.AZURE_SPEECH_API_VERSION || DEFAULT_AZURE_API_VERSION;
  var azureRes = await fetch(endpoint + '/speechtotext/transcriptions:transcribe?api-version=' + encodeURIComponent(apiVersion), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey
    },
    body: form
  });

  var raw = await azureRes.text();
  var payload = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch (_) { payload = {}; }

  if (!azureRes.ok) {
    var message = payload.error && (payload.error.message || payload.error.code)
      ? payload.error.message || payload.error.code
      : raw;
    var err = new Error('Azure Speech transcription failed: ' + String(message || '').substring(0, 300));
    err.statusCode = azureRes.status === 401 || azureRes.status === 403 ? 503 : 502;
    throw err;
  }

  return {
    provider: 'azure',
    model: definition.enhancedMode.model,
    text: extractTranscript(payload),
    raw: payload
  };
}

async function transcribeWithOpenAI(audioBuffer, contentType, locale) {
  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    var err = new Error('OpenAI API key not configured');
    err.statusCode = 503;
    throw err;
  }

  var model = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe';
  var form = new FormData();
  form.append('model', model);
  if (locale) form.append('language', locale.split('-')[0]);
  form.append('file', new Blob([audioBuffer], { type: contentType || 'audio/wav' }), getAudioFilename(contentType || 'audio/wav'));

  var openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    body: form
  });

  var raw = await openaiRes.text();
  var payload = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch (_) { payload = {}; }

  if (!openaiRes.ok) {
    var message = payload.error && payload.error.message ? payload.error.message : raw;
    var err = new Error('OpenAI transcription failed: ' + String(message || '').substring(0, 300));
    err.statusCode = openaiRes.status === 401 || openaiRes.status === 403 ? 503 : 502;
    throw err;
  }

  return {
    provider: 'openai',
    model: model,
    text: extractTranscript(payload),
    raw: payload
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  var allowedTypes = ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mpeg', 'audio/mp3', 'audio/flac'];
  if (allowedTypes.indexOf(contentType) === -1) {
    return res.status(400).json({ error: 'Content-Type must be WAV, MP3, or FLAC audio' });
  }

  try {
    var body = await readRequestBody(req);
    if (!body.length) return res.status(400).json({ error: 'Empty audio body' });
    if (body.length > MAX_AUDIO_BYTES) {
      return res.status(413).json({ error: 'Audio too large. Maximum 12MB.' });
    }

    var locale = String(req.query.locale || process.env.VOICE_TRANSCRIPTION_LOCALE || '').trim();
    var provider = getProvider();
    var result = provider === 'openai'
      ? await transcribeWithOpenAI(body, contentType, locale)
      : await transcribeWithAzure(body, contentType, locale);

    var text = String(result.text || '').trim();
    if (!text) {
      return res.status(422).json({ error: 'No speech detected. Try recording again closer to the microphone.' });
    }

    return res.status(200).json({
      text: text,
      provider: result.provider,
      model: result.model,
      sizeBytes: body.length
    });
  } catch (err) {
    console.error('public-builder/transcribe-voice error:', err);
    return res.status(err.statusCode || 500).json({
      error: err.statusCode === 503 ? err.message : 'Voice transcription failed'
    });
  }
}
