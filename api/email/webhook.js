// Vercel serverless function: Resend inbound email webhook receiver
// POST — email.received events from Resend

import { createHmac } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  // Verify Resend webhook signature (svix)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('Missing svix headers');
      return res.status(401).send('Missing signature headers');
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;

    // svix secret is base64-encoded after removing the "whsec_" prefix
    const secretBytes = Buffer.from(webhookSecret.replace('whsec_', ''), 'base64');
    const expected = createHmac('sha256', secretBytes).update(toSign).digest('base64');

    // svix-signature may contain multiple signatures separated by spaces
    const signatures = svixSignature.split(' ').map(s => s.replace('v1,', ''));
    const valid = signatures.some(sig => sig === expected);

    if (!valid) {
      console.warn('Webhook signature mismatch');
      return res.status(401).send('Invalid signature');
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not configured for email webhook');
    return res.status(200).send('OK');
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const body = req.body;
    const eventType = body.type;

    if (eventType !== 'email.received') {
      return res.status(200).send('OK');
    }

    const data = body.data || {};
    const emailId = data.email_id;
    const fromRaw = data.from;
    const subject = data.subject || '(no subject)';
    const attachments = data.attachments || [];

    if (!emailId || !fromRaw) {
      console.warn('Missing email_id or from in webhook payload');
      return res.status(200).send('OK');
    }

    // Parse sender: extract email and display name from "Name <email>" format
    const { email: senderEmail, name: senderName } = parseEmailAddress(fromRaw);

    // Fetch full email body from Resend API
    let bodyHtml = '';
    let bodyText = '';
    if (resendApiKey) {
      try {
        const emailResp = await fetch(`https://api.resend.com/emails/${emailId}`, {
          headers: { 'Authorization': `Bearer ${resendApiKey}` },
        });
        if (emailResp.ok) {
          const emailData = await emailResp.json();
          bodyHtml = emailData.html || '';
          bodyText = emailData.text || '';
        } else {
          console.warn('Failed to fetch email body from Resend:', emailResp.status);
        }
      } catch (fetchErr) {
        console.warn('Error fetching email body:', fetchErr.message);
      }
    }

    // Find or create email_conversations by sender_email
    const convResp = await fetch(
      `${supabaseUrl}/rest/v1/email_conversations?sender_email=eq.${encodeURIComponent(senderEmail)}&select=id,unread_count`,
      { headers }
    );
    const convData = await convResp.json();

    let conversationId;

    if (convData && convData.length > 0) {
      // Existing conversation — update
      conversationId = convData[0].id;
      const now = new Date().toISOString();

      await fetch(
        `${supabaseUrl}/rest/v1/email_conversations?id=eq.${conversationId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            unread_count: (convData[0].unread_count || 0) + 1,
            last_message_subject: (subject || '').substring(0, 500),
            last_message_text: (bodyText || bodyHtml || '').substring(0, 200).replace(/<[^>]*>/g, ''),
            last_message_at: now,
          }),
        }
      );
    } else {
      // New conversation — try matching sender to customers.email
      let customerId = null;
      let businessId = null;

      const custResp = await fetch(
        `${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(senderEmail)}&select=id,business_id&limit=1`,
        { headers }
      );
      const custData = await custResp.json();
      if (custData && custData.length > 0) {
        customerId = custData[0].id;
        businessId = custData[0].business_id;
      }

      const now = new Date().toISOString();
      const createResp = await fetch(
        `${supabaseUrl}/rest/v1/email_conversations`,
        {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            sender_email: senderEmail,
            sender_name: senderName || null,
            customer_id: customerId,
            business_id: businessId,
            unread_count: 1,
            last_message_subject: (subject || '').substring(0, 500),
            last_message_text: (bodyText || bodyHtml || '').substring(0, 200).replace(/<[^>]*>/g, ''),
            last_message_at: now,
            status: 'active',
          }),
        }
      );
      const newConv = await createResp.json();
      conversationId = newConv[0]?.id;
    }

    if (!conversationId) {
      console.error('Failed to get/create conversation for:', senderEmail);
      return res.status(200).send('OK');
    }

    // Insert email_messages with direction: 'inbound'
    const toAddresses = Array.isArray(data.to) ? data.to : (data.to ? [data.to] : []);
    const ccAddresses = Array.isArray(data.cc) ? data.cc : (data.cc ? [data.cc] : []);

    await fetch(
      `${supabaseUrl}/rest/v1/email_messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: conversationId,
          resend_email_id: emailId,
          direction: 'inbound',
          from_address: senderEmail,
          to_addresses: toAddresses,
          cc_addresses: ccAddresses.length > 0 ? ccAddresses : null,
          subject: subject,
          body_html: bodyHtml || null,
          body_text: bodyText || null,
          has_attachments: attachments.length > 0,
          attachment_metadata: attachments.length > 0 ? JSON.stringify(attachments) : null,
          status: 'received',
          sent_at: new Date().toISOString(),
        }),
      }
    );
  } catch (err) {
    console.error('Email webhook processing error:', err);
  }

  return res.status(200).send('OK');
}

function parseEmailAddress(raw) {
  if (!raw) return { email: '', name: '' };
  // Handle "Display Name <email@example.com>" format
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/^["']|["']$/g, '').trim(), email: match[2].trim().toLowerCase() };
  }
  // Plain email
  return { email: raw.trim().toLowerCase(), name: '' };
}
