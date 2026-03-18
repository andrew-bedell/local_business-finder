// Vercel serverless function: Update edit request status + send email notifications
// PATCH — handles status transitions with customer email notifications

import { sendEmail } from '../_lib/sendgrid.js';
import { editRequestCompletedEmail, editRequestRejectedEmail } from '../_lib/email-templates.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { editRequestId, status, rejection_reason } = req.body || {};
  const validStatuses = ['in_review', 'in_progress', 'completed', 'rejected'];

  if (!editRequestId || !status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Missing required fields: editRequestId, status (in_review|in_progress|completed|rejected)' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch the current edit request with customer and business info
    const reqRes = await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}&select=*`,
      { headers: supabaseHeaders }
    );
    const reqData = await reqRes.json();

    if (!reqData || reqData.length === 0) {
      return res.status(404).json({ error: 'Edit request not found' });
    }

    const editRequest = reqData[0];

    // Build update payload
    const updatePayload = { status };
    if (status === 'rejected' && rejection_reason) {
      updatePayload.rejection_reason = rejection_reason;
    }

    // Update the edit request
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(updatePayload),
      }
    );

    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      console.error('Edit request update error:', patchData);
      return res.status(502).json({ error: 'Failed to update edit request' });
    }

    // Send email on terminal statuses (completed or rejected)
    if (status === 'completed' || status === 'rejected') {
      try {
        // Look up customer and business
        const custRes = await fetch(
          `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(editRequest.customer_id)}&select=email,contact_name`,
          { headers: supabaseHeaders }
        );
        const custs = await custRes.json();

        const bizRes = await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(editRequest.business_id)}&select=name`,
          { headers: supabaseHeaders }
        );
        const bizData = await bizRes.json();

        // Get published URL for completed emails
        let publishedUrl = '';
        if (status === 'completed') {
          const webRes = await fetch(
            `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${encodeURIComponent(editRequest.business_id)}&status=eq.published&select=published_url&limit=1`,
            { headers: supabaseHeaders }
          );
          const webData = await webRes.json();
          publishedUrl = webData?.[0]?.published_url || '';
        }

        if (custs?.[0]?.email) {
          const portalUrl = 'https://ahoratengopagina.com/mipagina';
          const emailFrom = 'AhoraTengoPagina <andres@ahoratengopagina.com>';
          const emailReplyTo = 'andres@ahoratengopagina.com';

          let emailContent;
          if (status === 'completed') {
            emailContent = editRequestCompletedEmail({
              contactName: custs[0].contact_name || '',
              businessName: bizData?.[0]?.name || '',
              requestType: editRequest.request_type,
              publishedUrl,
              portalUrl,
            });
          } else {
            emailContent = editRequestRejectedEmail({
              contactName: custs[0].contact_name || '',
              businessName: bizData?.[0]?.name || '',
              requestType: editRequest.request_type,
              rejectionReason: rejection_reason || '',
              portalUrl,
            });
          }

          await sendEmail({ to: custs[0].email, ...emailContent, from: emailFrom, replyTo: emailReplyTo });
        }
      } catch (emailErr) {
        console.warn('Edit request email error (non-blocking):', emailErr);
      }
    }

    return res.status(200).json({ success: true, editRequest: patchData[0] || patchData });
  } catch (err) {
    console.error('Update edit request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
