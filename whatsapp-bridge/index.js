// WhatsApp Local Bridge — connects to WhatsApp Web via whatsapp-web.js
// Replaces OpenClaw with internal Claude-powered responder
//
// Usage:
//   1. Copy .env.example to .env and fill in credentials
//   2. npm install
//   3. npm start
//   4. Scan QR code with WhatsApp (Link Device)

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { matchContact, buildPhoneVariants, getCanonicalPhone, extractDigits } = require('./match-contact');
const { generateResponse } = require('./respond');
const { findConversationByPhone, upsertConversation, logMessage, getConversationHistory } = require('./db');

// ── Validate environment ──

const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'ANTHROPIC_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    console.error('Copy .env.example to .env and fill in your credentials.');
    process.exit(1);
  }
}

// ── Initialize WhatsApp client ──

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\nScan this QR code with WhatsApp (Link Device):\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\nWhatsApp bridge connected and ready!');
  console.log('Listening for incoming messages...\n');
});

client.on('authenticated', () => {
  console.log('Session authenticated.');
});

client.on('auth_failure', (msg) => {
  console.error('Authentication failed:', msg);
  console.error('Delete .wwebjs_auth/ and restart to re-scan QR code.');
});

client.on('disconnected', (reason) => {
  console.warn('Client disconnected:', reason);
  console.log('Attempting to reconnect...');
  client.initialize().catch(err => {
    console.error('Reconnection failed:', err);
    process.exit(1);
  });
});

// ── Message handler ──

// Track messages being processed to avoid double-replies
const processing = new Set();

// Cache LID → real phone to avoid repeated async lookups
const lidCache = new Map();

function isLikelyLid(msgFrom) {
  if (msgFrom.endsWith('@lid')) return true;
  const digits = msgFrom.replace(/\D/g, '');
  return digits.length > 13;
}

async function resolvePhone(msgFrom, msg) {
  const lidKey = msgFrom.replace(/@(c\.us|lid)$/, '');

  if (lidCache.has(lidKey)) return lidCache.get(lidKey);

  let resolved = null;

  // Strategy 1: purpose-built LID resolver
  try {
    const results = await client.getContactLidAndPhone([msgFrom]);
    if (results?.[0]?.pn) {
      resolved = results[0].pn.replace(/@c\.us$/, '');
      console.log(`  → LID resolved via API: ${lidKey} → ${resolved}`);
    }
  } catch (err) {
    console.warn(`  → getContactLidAndPhone failed:`, err.message);
  }

  // Strategy 2: fallback to contact object
  if (!resolved) {
    try {
      const contact = await msg.getContact();
      if (contact?.number) {
        resolved = String(contact.number).replace(/\D/g, '');
        console.log(`  → LID resolved via getContact: ${lidKey} → ${resolved}`);
      }
    } catch (err) {
      console.warn(`  → getContact fallback failed:`, err.message);
    }
  }

  if (resolved) {
    if (lidCache.size >= 1000) lidCache.delete(lidCache.keys().next().value);
    lidCache.set(lidKey, resolved);
    return resolved;
  }

  console.warn(`  → LID resolution failed for ${lidKey}, using as-is`);
  return lidKey;
}

client.on('message', async (msg) => {
  // Skip group messages — only handle direct (1:1) messages
  if (msg.from.endsWith('@g.us')) return;

  // Skip non-text messages
  if (msg.type !== 'chat') return;

  // Skip status broadcasts
  if (msg.from === 'status@broadcast') return;

  // Deduplicate: skip if already processing this message
  const msgKey = `${msg.from}:${msg.timestamp}`;
  if (processing.has(msgKey)) return;
  processing.add(msgKey);

  // Clean up after 60 seconds
  setTimeout(() => processing.delete(msgKey), 60_000);

  // Extract phone number (strip @c.us or @lid suffix, resolve LIDs)
  let rawPhone = msg.from.replace(/@(c\.us|lid)$/, '');

  if (isLikelyLid(msg.from)) {
    console.log(`[${new Date().toLocaleTimeString()}] LID detected: ${msg.from}`);
    rawPhone = await resolvePhone(msg.from, msg);
  }

  const digits = extractDigits(rawPhone);
  const canonicalPhone = getCanonicalPhone(digits);
  const phoneVariants = buildPhoneVariants(rawPhone);

  const messageBody = msg.body || '';

  const lidNote = isLikelyLid(msg.from) && rawPhone !== msg.from.replace(/@(c\.us|lid)$/, '')
    ? ` (resolved from LID)` : '';
  console.log(`[${new Date().toLocaleTimeString()}] Inbound from ${canonicalPhone}${lidNote}: ${messageBody.substring(0, 80)}${messageBody.length > 80 ? '...' : ''}`);

  try {
    // Step 1: Match contact to business
    const context = await matchContact(rawPhone);

    if (context) {
      console.log(`  → Matched: ${context.businessName} (${context.contactType})`);
    } else {
      console.log('  → No match found (unknown contact)');
    }

    // Step 2: Find or create conversation
    let existingConversation = await findConversationByPhone(phoneVariants);
    const businessId = context?.businessId || existingConversation?.business_id || null;

    const conversationId = await upsertConversation({
      businessId,
      phone: canonicalPhone,
      messagePreview: messageBody.substring(0, 200),
      direction: 'inbound',
      existingConversation,
    });

    // Step 3: Log inbound message
    if (conversationId) {
      await logMessage({
        conversationId,
        businessId,
        direction: 'inbound',
        body: messageBody,
      });
    }

    // Step 4: Get conversation history for context
    let history = [];
    if (conversationId) {
      history = await getConversationHistory(conversationId);
    }

    // Step 5: Generate response via Claude
    const reply = await generateResponse(context, messageBody, history);

    if (!reply) {
      console.log('  → No reply generated (skipped)');
      return;
    }

    // Step 6: Send reply
    await msg.reply(reply);
    console.log(`  → Replied: ${reply.substring(0, 80)}${reply.length > 80 ? '...' : ''}`);

    // Step 7: Log outbound message
    if (conversationId) {
      await logMessage({
        conversationId,
        businessId,
        direction: 'outbound',
        body: reply,
      });

      // Update conversation with outbound info
      // (re-fetch conversation since upsertConversation was for inbound)
      const refreshedConv = await findConversationByPhone(phoneVariants);
      if (refreshedConv) {
        await upsertConversation({
          businessId,
          phone: canonicalPhone,
          messagePreview: reply.substring(0, 200),
          direction: 'outbound',
          existingConversation: refreshedConv,
        });
      }
    }

  } catch (err) {
    console.error(`  → Error processing message from ${canonicalPhone}:`, err);

    // Try to send a fallback reply so the user isn't left hanging
    try {
      await msg.reply('¡Hola! Gracias por escribirnos. Un asesor se comunicará contigo pronto.');
    } catch {
      // If even the fallback fails, just log it
      console.error('  → Failed to send fallback reply');
    }
  }
});

// ── Start ──

console.log('Starting WhatsApp bridge...');
client.initialize().catch(err => {
  console.error('Failed to initialize WhatsApp client:', err);
  process.exit(1);
});

// ── Graceful shutdown ──

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  try {
    await client.destroy();
  } catch {
    // ignore
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  try {
    await client.destroy();
  } catch {
    // ignore
  }
  process.exit(0);
});
