// Vercel serverless function: Send email from employee dashboard
// POST — send/reply to emails via Resend

import { sendEmail } from '../_lib/sendgrid.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const { conversationId, to, subject, html, text } = req.body;

    if (!subject || (!html && !text)) {
      return res.status(400).json({ error: 'Missing subject or body' });
    }

    // Determine recipient and conversation
    let recipientEmail;
    let convId = conversationId;

    if (conversationId) {
      // Reply mode — get sender_email from conversation
      const convResp = await fetch(
        `${supabaseUrl}/rest/v1/email_conversations?id=eq.${conversationId}&select=sender_email`,
        { headers }
      );
      const convData = await convResp.json();
      if (!convData || convData.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      recipientEmail = convData[0].sender_email;
    } else if (to) {
      // Compose mode — find or create conversation
      recipientEmail = to.trim().toLowerCase();

      const convResp = await fetch(
        `${supabaseUrl}/rest/v1/email_conversations?sender_email=eq.${encodeURIComponent(recipientEmail)}&select=id`,
        { headers }
      );
      const convData = await convResp.json();

      if (convData && convData.length > 0) {
        convId = convData[0].id;
      } else {
        // Try matching to a customer
        let customerId = null;
        let businessId = null;
        const custResp = await fetch(
          `${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(recipientEmail)}&select=id,business_id&limit=1`,
          { headers }
        );
        const custData = await custResp.json();
        if (custData && custData.length > 0) {
          customerId = custData[0].id;
          businessId = custData[0].business_id;
        }

        const createResp = await fetch(
          `${supabaseUrl}/rest/v1/email_conversations`,
          {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
              sender_email: recipientEmail,
              sender_name: null,
              customer_id: customerId,
              business_id: businessId,
              unread_count: 0,
              last_message_subject: (subject || '').substring(0, 500),
              last_message_text: (text || html || '').substring(0, 200).replace(/<[^>]*>/g, ''),
              last_message_at: new Date().toISOString(),
              status: 'active',
            }),
          }
        );
        const newConv = await createResp.json();
        convId = newConv[0]?.id;
      }
    } else {
      return res.status(400).json({ error: 'Missing conversationId or to address' });
    }

    // Send the email via Resend
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html: html || undefined,
      text: text || undefined,
      from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
      replyTo: 'andres@ahoratengopagina.com',
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send email' });
    }

    // Insert email_messages with direction: 'outbound'
    const now = new Date().toISOString();
    const msgResp = await fetch(
      `${supabaseUrl}/rest/v1/email_messages`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          conversation_id: convId,
          direction: 'outbound',
          from_address: 'andres@ahoratengopagina.com',
          to_addresses: [recipientEmail],
          subject: subject,
          body_html: html || null,
          body_text: text || null,
          has_attachments: false,
          status: 'sent',
          sent_at: now,
        }),
      }
    );
    const msgData = await msgResp.json();
    const messageId = msgData?.[0]?.id;

    // Update conversation preview
    await fetch(
      `${supabaseUrl}/rest/v1/email_conversations?id=eq.${convId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          last_message_subject: (subject || '').substring(0, 500),
          last_message_text: (text || html || '').substring(0, 200).replace(/<[^>]*>/g, ''),
          last_message_at: now,
        }),
      }
    );

    return res.status(200).json({ success: true, messageId, conversationId: convId });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
