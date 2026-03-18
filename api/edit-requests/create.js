// Vercel serverless function: Create edit request + send confirmation email
// POST — wraps edit_request insert with email notification to customer

import { sendEmail } from '../_lib/sendgrid.js';
import { editRequestReceivedEmail } from '../_lib/email-templates.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { business_id, customer_id, website_id, request_type, description, priority } = req.body || {};

  if (!business_id || !customer_id || !request_type || !description) {
    return res.status(400).json({ error: 'Missing required fields: business_id, customer_id, request_type, description' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Insert edit request
    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/edit_requests`,
      {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          business_id,
          customer_id,
          website_id: website_id || null,
          request_type,
          description,
          priority: priority || 'normal',
          status: 'submitted',
        }),
      }
    );

    const insertData = await insertRes.json();

    if (!insertRes.ok) {
      console.error('Edit request insert error:', insertData);
      return res.status(502).json({ error: 'Failed to create edit request' });
    }

    const editRequest = insertData[0] || insertData;

    // Send confirmation email (non-blocking)
    try {
      // Look up customer email and business name
      const custRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(customer_id)}&select=email,contact_name`,
        { headers: supabaseHeaders }
      );
      const custs = await custRes.json();

      const bizRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(business_id)}&select=name`,
        { headers: supabaseHeaders }
      );
      const bizData = await bizRes.json();

      if (custs?.[0]?.email) {
        const emailContent = editRequestReceivedEmail({
          contactName: custs[0].contact_name || '',
          businessName: bizData?.[0]?.name || '',
          requestType: request_type,
          description,
        });
        await sendEmail({
          to: custs[0].email,
          ...emailContent,
          from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
          replyTo: 'andres@ahoratengopagina.com',
        });
      }
    } catch (emailErr) {
      console.warn('Edit request confirmation email error (non-blocking):', emailErr);
    }

    return res.status(200).json({ success: true, editRequest });
  } catch (err) {
    console.error('Create edit request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
