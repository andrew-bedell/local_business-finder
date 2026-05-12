export const config = { maxDuration: 60 };

function trimBlock(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Anthropic API key not configured' });
  }

  var body = req.body || {};
  var mode = trimBlock(body.mode, 40) || 'draft';
  var summary = trimBlock(body.summary, 2500);
  var fieldLabel = trimBlock(body.fieldLabel, 180);
  var fieldValue = trimBlock(body.fieldValue, 2500);
  var businessContext = trimBlock(body.businessContext, 5000);
  var formPurpose = trimBlock(body.formPurpose, 1000);
  var formData = '';
  try {
    formData = trimBlock(JSON.stringify(body.formData || {}, null, 2), 12000);
  } catch {
    formData = '';
  }

  if (!fieldLabel) {
    return res.status(400).json({ error: 'Selecciona un campo del formulario primero.' });
  }

  var system = [
    'Eres un asistente de intake para AhoraTengoPagina.',
    'Ayudas a duenos de negocios en Mexico y Colombia a escribir respuestas claras para crear una pagina web.',
    'Este formulario sirve para reunir informacion profunda del negocio y crear una pagina web personalizada, con contexto para marketing, promociones, campanas de Facebook e Instagram y soporte humano posterior.',
    'Usa todo el contexto disponible del formulario actual para que tus respuestas sean mas especificas conforme el usuario avanza.',
    'Responde siempre en espanol de negocio, natural, claro y persuasivo.',
    'No inventes datos especificos como certificaciones, precios, direcciones, resultados medicos, garantias o testimonios.',
    'Si falta informacion, escribe una respuesta util pero deja espacios suaves como "podemos destacar..." solo cuando sea apropiado.',
    'Devuelve solamente el texto final para pegar en el formulario, sin markdown, sin comillas y sin introduccion.'
  ].join('\n');

  var userPrompt = [
    'Campo que se quiere completar:',
    fieldLabel,
    '',
    'Texto actual del campo:',
    fieldValue || '(vacio)',
    '',
    'Resumen escrito por el usuario:',
    summary || '(sin resumen adicional)',
    '',
    'Contexto del resto del formulario:',
    businessContext || '(sin contexto)',
    '',
    'Proposito del formulario:',
    formPurpose || '(formulario personalizado de pagina web)',
    '',
    'Datos completos actuales del formulario en JSON:',
    formData || '(sin datos completos)',
    '',
    mode === 'improve'
      ? 'Mejora el texto actual para que sea mas claro, especifico y persuasivo. Conserva los hechos.'
      : 'Escribe una respuesta util para este campo usando el resumen y el contexto disponible.',
    '',
    'Limite: maximo 180 palabras.'
  ].join('\n');

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        system: system,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      var errText = await response.text().catch(function () { return ''; });
      console.error('intake-assist anthropic error:', response.status, errText.substring(0, 300));
      return res.status(502).json({ error: 'No se pudo conectar con la IA.' });
    }

    var data = await response.json();
    var text = data && data.content && data.content[0] && data.content[0].text
      ? data.content[0].text.trim()
      : '';

    return res.status(200).json({ text: text });
  } catch (err) {
    console.error('intake-assist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
