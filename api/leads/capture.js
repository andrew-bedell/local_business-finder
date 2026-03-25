// Vercel serverless function: Marketing lead capture
// Saves lead to Supabase and auto-sends a WhatsApp welcome template message.

import { toE164 } from '../_lib/phone-utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { business_name, business_address, business_type, whatsapp_number, email, name, address, referral_code } = req.body || {};

  if (!business_name) {
    return res.status(400).json({ error: 'Missing required field: business_name' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Save lead to database
    const row = {
      business_name: business_name.trim(),
      city: business_address ? business_address.trim() : null,
      address: address ? address.trim() : null,
      phone: whatsapp_number ? whatsapp_number.trim() : null,
      email: email ? email.trim() : null,
      name: name ? name.trim() : null,
      source: referral_code ? 'referral' : 'website',
      referral_code: referral_code ? referral_code.trim().toUpperCase() : null,
      notes: business_type ? ('Tipo: ' + business_type.trim()) : null,
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/marketing_leads`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(row),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    // Auto-send WhatsApp template message if phone number provided
    let whatsappSent = false;
    if (whatsapp_number) {
      try {
        whatsappSent = await sendWelcomeWhatsApp(whatsapp_number.trim(), business_name.trim());
      } catch (waErr) {
        console.warn('WhatsApp auto-send failed (non-blocking):', waErr.message);
      }
    }

    return res.status(200).json({ success: true, whatsapp_sent: whatsappSent });
  } catch (err) {
    console.error('Lead capture error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendWelcomeWhatsApp(phone, businessName) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_WELCOME_TEMPLATE || 'website_welcome';
  const templateLang = process.env.WHATSAPP_WELCOME_TEMPLATE_LANG || 'es';

  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp credentials not configured, skipping auto-send');
    return false;
  }

  // Normalize phone to E.164
  const normalizedPhone = toE164(phone) || phone.replace(/[\s\-()]/g, '').replace(/^(?!\+)/, '+');

  const components = [{
    type: 'body',
    parameters: [{ type: 'text', text: businessName }],
  }];

  const metaPayload = {
    messaging_product: 'whatsapp',
    to: normalizedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLang },
      components,
    },
  };

  const metaResp = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaPayload),
    }
  );

  const metaData = await metaResp.json();

  if (!metaResp.ok) {
    console.error('WhatsApp welcome send error:', metaData);
    return false;
  }

  console.log('WhatsApp welcome sent to', normalizedPhone, 'wamid:', metaData.messages?.[0]?.id);
  return true;
}
