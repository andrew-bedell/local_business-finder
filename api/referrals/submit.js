// Vercel serverless function: Submit a referral (public, no auth)
// POST — captures referred business info, creates referral + marketing lead

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

  const { referralCode, businessName, phone, email, city } = req.body || {};

  if (!referralCode || !businessName || !phone) {
    return res.status(400).json({ error: 'Campos requeridos: codigo de referido, nombre del negocio, WhatsApp' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Service unavailable' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Validate referral code
    const code = referralCode.trim().toUpperCase();
    const codeRes = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=id,customer_id`,
      { headers }
    );
    const codes = await codeRes.json();

    if (!codes || codes.length === 0) {
      return res.status(400).json({ error: 'Codigo de referido invalido' });
    }

    const referralCodeId = codes[0].id;
    const referrerCustomerId = codes[0].customer_id;
    const normalizedPhone = toE164(phone.trim()) || phone.trim();

    // Check for existing referral with same code + phone/email to avoid duplicates
    let existQuery = `${supabaseUrl}/rest/v1/referrals?referral_code_id=eq.${referralCodeId}&select=id`;
    if (email) {
      existQuery += `&or=(referred_phone.eq.${encodeURIComponent(normalizedPhone)},referred_email.eq.${encodeURIComponent(email.trim())})`;
    } else {
      existQuery += `&referred_phone=eq.${encodeURIComponent(normalizedPhone)}`;
    }
    const existRes = await fetch(existQuery, { headers });
    const existData = existRes.ok ? await existRes.json() : [];
    if (existData && existData.length > 0) {
      // Already submitted — return success without creating duplicate
      return res.status(200).json({ success: true, referralId: existData[0].id, duplicate: true });
    }

    // Create referral record
    const referralRes = await fetch(
      `${supabaseUrl}/rest/v1/referrals`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          referral_code_id: referralCodeId,
          referrer_customer_id: referrerCustomerId,
          referred_business_name: businessName.trim(),
          referred_phone: normalizedPhone,
          referred_email: email ? email.trim() : null,
          referred_city: city ? city.trim() : null,
          status: 'pending',
          source: 'whatsapp',
        }),
      }
    );

    if (!referralRes.ok) {
      console.error('Referral insert error:', await referralRes.text().catch(() => ''));
      return res.status(500).json({ error: 'Error al crear referido' });
    }

    const referralData = await referralRes.json();
    const referralId = referralData[0]?.id;

    // Create marketing lead with referral tracking
    await fetch(
      `${supabaseUrl}/rest/v1/marketing_leads`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          business_name: businessName.trim(),
          phone: normalizedPhone,
          email: email ? email.trim() : null,
          city: city ? city.trim() : null,
          source: 'referral',
          referral_code: code,
          referral_id: referralId,
        }),
      }
    );

    // Increment total_referrals counter
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?id=eq.${referralCodeId}&select=total_referrals`,
      { headers }
    );
    const countData = await countRes.json();
    const currentCount = countData?.[0]?.total_referrals || 0;

    await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?id=eq.${referralCodeId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ total_referrals: currentCount + 1 }),
      }
    );

    // Auto-send WhatsApp welcome if configured
    try {
      await sendReferralWhatsApp(normalizedPhone, businessName.trim());
    } catch (waErr) {
      console.warn('Referral WhatsApp auto-send failed (non-blocking):', waErr.message);
    }

    return res.status(200).json({ success: true, referralId });
  } catch (err) {
    console.error('Submit referral error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendReferralWhatsApp(phone, businessName) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) return;

  const message = `Hola! Gracias por tu interes en AhoraTengoPagina. 🎉\n\n` +
    `Recibimos la informacion de *${businessName}* a traves de una recomendacion.\n\n` +
    `Tienes 50% de descuento en tus primeros 2 meses! Pronto te contactaremos para mostrarte como quedaria tu pagina web.`;

  await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    }
  );
}
