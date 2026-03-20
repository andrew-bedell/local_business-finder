// Vercel serverless function: Resend customer team member invite email
// POST — generates a new invite link and sends the branded team invite email

import { sendEmail } from '../_lib/sendgrid.js';
import { customerTeamInviteEmail } from '../_lib/email-templates.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  // Verify caller JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.slice(7);

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userData = await userRes.json();

    // Look up caller's customer_users record
    const callerRes = await fetch(
      `${supabaseUrl}/rest/v1/customer_users?auth_user_id=eq.${userData.id}&select=id,customer_id,role`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const callerData = await callerRes.json();
    if (!Array.isArray(callerData) || callerData.length === 0) {
      return res.status(403).json({ error: 'No customer account found' });
    }
    const caller = callerData[0];

    // Only owner or manager can resend invites
    if (caller.role !== 'owner' && caller.role !== 'manager') {
      return res.status(403).json({ error: 'Only owners and managers can resend invitations' });
    }

    // Get target member
    const { member_id } = req.body || {};
    if (!member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }

    const targetRes = await fetch(
      `${supabaseUrl}/rest/v1/customer_users?id=eq.${encodeURIComponent(member_id)}&customer_id=eq.${caller.customer_id}&select=id,email,display_name,auth_user_id,is_active,joined_at`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const targetData = await targetRes.json();
    if (!Array.isArray(targetData) || targetData.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    const target = targetData[0];

    // Generate a new invite link
    const inviteRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'invite',
        email: target.email,
        data: { display_name: target.display_name || '' },
        redirect_to: 'https://ahoratengopagina.com/mipagina',
      }),
    });

    if (!inviteRes.ok) {
      const errText = await inviteRes.text();
      console.error('Supabase generate_link error:', inviteRes.status, errText);
      return res.status(502).json({ error: 'Failed to generate invite link' });
    }

    const inviteData = await inviteRes.json();
    const inviteActionLink = inviteData.action_link;
    const inviteUrl = inviteActionLink || 'https://ahoratengopagina.com/mipagina';

    // Get business name and inviter name for the email
    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${caller.customer_id}&select=business_id,contact_name`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const custData = await custRes.json();
    let businessName = '';
    let inviterName = '';
    if (Array.isArray(custData) && custData.length > 0) {
      inviterName = custData[0].contact_name || '';
      const bizRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${custData[0].business_id}&select=name`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
        }
      );
      const bizData = await bizRes.json();
      if (Array.isArray(bizData) && bizData.length > 0) {
        businessName = bizData[0].name;
      }
    }

    // Send branded email
    const emailContent = customerTeamInviteEmail({ inviterName, businessName, email: target.email, inviteUrl });
    const emailResult = await sendEmail({
      to: target.email,
      ...emailContent,
      from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
      replyTo: 'andres@ahoratengopagina.com',
    });

    if (!emailResult.success) {
      console.error('Resend team invite email failed:', emailResult.error);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend customer invite error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
