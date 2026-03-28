// WhatsApp Local Bridge — connects to WhatsApp Web via whatsapp-web.js
// Replaces OpenClaw with internal Claude-powered responder
//
// Usage:
//   1. Copy .env.example to .env and fill in credentials
//   2. npm install
//   3. npm start
//   4. Scan QR code with WhatsApp (Link Device)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { matchContact, buildPhoneVariants, getCanonicalPhone, extractDigits } = require('./match-contact');
const { generateResponse } = require('./respond');
const express = require('express');
const { findConversationByPhone, upsertConversation, logMessage, getConversationHistory } = require('./db');
const onboarding = require('./onboarding');
const { resolveLeadByPhone } = require('./lead-resolver');

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
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
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

  // Skip status broadcasts
  if (msg.from === 'status@broadcast') return;

  // Accept text and image messages (images only during onboarding photo collection)
  const isText = msg.type === 'chat';
  const isImage = msg.type === 'image';
  if (!isText && !isImage) return;

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
  console.log(`[${new Date().toLocaleTimeString()}] Inbound ${isImage ? '(image) ' : ''}from ${canonicalPhone}${lidNote}: ${messageBody.substring(0, 80)}${messageBody.length > 80 ? '...' : ''}`);

  try {
    // Step 0: Resolve phone against all DB tables
    const resolvedContext = await resolveLeadByPhone(canonicalPhone, phoneVariants);

    // Step 1: Handle active onboarding flow
    if (resolvedContext.activeFlowId) {
      console.log(`  → Active onboarding flow: ${resolvedContext.activeFlowId} (step: ${resolvedContext.activeFlowStep})`);

      // Ensure conversation exists for logging
      let existingConversation = resolvedContext.existingConversation || await findConversationByPhone(phoneVariants);
      const conversationId = await upsertConversation({
        businessId: resolvedContext.businessId || existingConversation?.business_id || null,
        phone: canonicalPhone,
        messagePreview: messageBody.substring(0, 200),
        direction: 'inbound',
        existingConversation,
      });

      if (conversationId && isText) {
        await logMessage({ conversationId, businessId: resolvedContext.businessId || null, direction: 'inbound', body: messageBody });
      }

      // Build extras for onboarding handler
      const extras = { client };
      if (isImage) {
        extras.msgType = 'image';
        try {
          const media = await msg.downloadMedia();
          extras.mediaData = media ? { data: media.data, mimetype: media.mimetype } : null;
        } catch (dlErr) {
          console.warn('  → Failed to download image:', dlErr.message);
          extras.mediaData = null;
        }
      }

      const reply = await onboarding.handleOnboardingMessage(
        resolvedContext.activeFlowId, messageBody, conversationId, canonicalPhone, extras
      );

      if (reply) {
        await msg.reply(reply);
        console.log(`  → Onboarding reply: ${reply.substring(0, 80)}${reply.length > 80 ? '...' : ''}`);

        if (conversationId) {
          await logMessage({ conversationId, businessId: resolvedContext.businessId || null, direction: 'outbound', body: reply });
        }
      }
      return;
    }

    // Images outside of onboarding flow are ignored
    if (isImage) return;

    // Step 2: Check if we should start onboarding
    if (resolvedContext.shouldStartOnboarding) {
      console.log(`  → Starting onboarding for ${canonicalPhone} (type: ${resolvedContext.contactType}, sources: ${resolvedContext.sources.join(',')})`);

      // Ensure conversation exists
      let existingConversation = resolvedContext.existingConversation || await findConversationByPhone(phoneVariants);
      const conversationId = await upsertConversation({
        businessId: resolvedContext.businessId || null,
        phone: canonicalPhone,
        messagePreview: messageBody.substring(0, 200),
        direction: 'inbound',
        existingConversation,
      });

      if (conversationId) {
        await logMessage({ conversationId, businessId: resolvedContext.businessId || null, direction: 'inbound', body: messageBody });
      }

      const chatId = msg.from;
      const onboardingReply = await onboarding.startOnboardingFlow(
        conversationId, canonicalPhone, chatId, resolvedContext
      );

      if (onboardingReply) {
        await msg.reply(onboardingReply);
        console.log(`  → Onboarding started: ${onboardingReply.substring(0, 80)}${onboardingReply.length > 80 ? '...' : ''}`);

        if (conversationId) {
          await logMessage({ conversationId, businessId: resolvedContext.businessId || null, direction: 'outbound', body: onboardingReply });
        }
      }
      return;
    }

    // Step 3: Normal flow — existing customers/demos/etc.
    // Use matchContact for full context (includes website URLs, subscription info)
    const context = await matchContact(rawPhone);

    if (context) {
      console.log(`  → Matched: ${context.businessName} (${context.contactType})`);
    } else {
      console.log('  → No match found (unknown contact)');
    }

    // Step 4: Find or create conversation
    let existingConversation = resolvedContext.existingConversation || await findConversationByPhone(phoneVariants);
    const businessId = context?.businessId || existingConversation?.business_id || null;

    const conversationId = await upsertConversation({
      businessId,
      phone: canonicalPhone,
      messagePreview: messageBody.substring(0, 200),
      direction: 'inbound',
      existingConversation,
    });

    // Step 5: Log inbound message
    if (conversationId) {
      await logMessage({
        conversationId,
        businessId,
        direction: 'inbound',
        body: messageBody,
      });
    }

    // Step 6: Get conversation history for context
    let history = [];
    if (conversationId) {
      history = await getConversationHistory(conversationId);
    }

    // Step 7: Generate response via Claude
    const reply = await generateResponse(context, messageBody, history);

    if (!reply) {
      console.log('  → No reply generated (skipped)');
      return;
    }

    // Step 8: Send reply
    await msg.reply(reply);
    console.log(`  → Replied: ${reply.substring(0, 80)}${reply.length > 80 ? '...' : ''}`);

    // Step 9: Log outbound message
    if (conversationId) {
      await logMessage({
        conversationId,
        businessId,
        direction: 'outbound',
        body: reply,
      });

      // Update conversation with outbound info
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

// ── Abandonment check — mark stale onboarding flows ──

const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

setInterval(async () => {
  try {
    const sb = createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
    const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Mark flows inactive for 72h as abandoned
    const { data: abandoned } = await sb
      .from('onboarding_flows')
      .update({ step: 'abandoned' })
      .lt('last_activity_at', cutoff72h)
      .not('step', 'in', '("complete","abandoned","error","human_review")')
      .select('id, phone, flow_data');

    if (abandoned && abandoned.length > 0) {
      console.log(`[Abandonment] Marked ${abandoned.length} flows as abandoned`);
    }

    // Send reminder for flows inactive for 24h (but not yet 72h)
    const { data: stale } = await sb
      .from('onboarding_flows')
      .select('id, phone, flow_data')
      .lt('last_activity_at', cutoff24h)
      .gte('last_activity_at', cutoff72h)
      .not('step', 'in', '("complete","abandoned","error","generate","human_review")');

    if (stale && stale.length > 0) {
      for (const flow of stale) {
        const chatId = flow.flow_data?.chatId;
        if (chatId && !flow.flow_data?.reminderSent) {
          try {
            await client.sendMessage(chatId, '¡Hola! 👋 Vimos que comenzaste a crear tu página web. ¿Quieres continuar? Estamos aquí para ayudarte.');
            // Mark reminder as sent
            await sb.from('onboarding_flows').update({
              flow_data: { ...flow.flow_data, reminderSent: true },
              last_activity_at: new Date().toISOString(),
            }).eq('id', flow.id);
            console.log(`[Abandonment] Sent reminder to ${flow.phone}`);
          } catch (err) {
            console.warn(`[Abandonment] Failed to send reminder to ${flow.phone}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Abandonment] Check failed:', err.message);
  }
}, 30 * 60 * 1000); // Every 30 minutes

// ── HTTP API Server ──

const httpApp = express();
httpApp.use(express.json());

httpApp.post('/send', async (req, res) => {
  const { phone, message, secret } = req.body || {};

  // Validate shared secret
  const expectedSecret = process.env.BRIDGE_API_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!phone || !message) {
    return res.status(400).json({ error: 'Missing required fields: phone, message' });
  }

  // Check WhatsApp client readiness
  const info = client.info;
  if (!info) {
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }

  try {
    // Normalize phone to WhatsApp chatId format: digits@c.us
    let digits = phone.replace(/[^\d]/g, '');

    // Mexican numbers: WhatsApp requires 521 prefix for mobile numbers
    // If we have a 52 + 10-digit number, insert the 1
    if (digits.startsWith('52') && digits.length === 12) {
      digits = '521' + digits.slice(2);
    }

    const chatId = digits + '@c.us';
    await client.sendMessage(chatId, message);

    console.log(`[HTTP API] Message sent to ${chatId}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[HTTP API] Send failed:', err.message);
    return res.status(500).json({ error: 'Failed to send message', detail: err.message });
  }
});

const BRIDGE_PORT = process.env.BRIDGE_PORT || 3100;
httpApp.listen(BRIDGE_PORT, () => {
  console.log(`Bridge HTTP API on port ${BRIDGE_PORT}`);
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
