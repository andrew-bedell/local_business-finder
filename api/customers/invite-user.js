// Vercel serverless function: Invite a team member to a customer's portal
// POST — owner/manager invites a new team member to their business portal

import { sendEmail } from '../_lib/sendgrid.js';
import { getTemplateForTrigger } from '../_lib/email-templates.js';

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
    // Get user from JWT
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

    // Only owner or manager can invite
    if (caller.role !== 'owner' && caller.role !== 'manager') {
      return res.status(403).json({ error: 'Only owners and managers can invite team members' });
    }

    // Validate request body
    const { email, display_name, role } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const inviteRole = role || 'employee';
    if (!['manager', 'employee'].includes(inviteRole)) {
      return res.status(400).json({ error: 'Role must be manager or employee' });
    }

    // Check for duplicate email in this customer's team
    const dupRes = await fetch(
      `${supabaseUrl}/rest/v1/customer_users?customer_id=eq.${caller.customer_id}&email=eq.${encodeURIComponent(email)}&select=id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const dupData = await dupRes.json();
    if (Array.isArray(dupData) && dupData.length > 0) {
      return res.status(409).json({ error: 'Este correo ya está en tu equipo' });
    }

    // Invite user via Supabase Auth Admin API
    const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        data: { display_name: display_name || '' },
      }),
    });

    let authUserId = null;
    if (inviteRes.ok) {
      const inviteData = await inviteRes.json();
      authUserId = inviteData.id;
    } else if (inviteRes.status === 422) {
      // User already exists in auth — look up
      const lookupRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
        }
      );
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        const users = lookupData.users || lookupData || [];
        const matched = Array.isArray(users) ? users.find(u => u.email === email) : null;
        if (matched) authUserId = matched.id;
      }
    } else {
      const errText = await inviteRes.text().catch(() => '');
      console.error('Supabase invite error:', inviteRes.status, errText);
      return res.status(502).json({ error: 'Failed to send invitation' });
    }

    if (!authUserId) {
      return res.status(502).json({ error: 'Could not resolve auth user' });
    }

    // Insert customer_users record
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/customer_users`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        auth_user_id: authUserId,
        customer_id: caller.customer_id,
        role: inviteRole,
        email,
        display_name: display_name || null,
        is_active: true,
        invited_at: new Date().toISOString(),
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text().catch(() => '');
      console.error('customer_users insert error:', insertRes.status, errText);
      return res.status(502).json({ error: 'Invitation sent but failed to create team record' });
    }

    const records = await insertRes.json();

    // Send branded email via SendGrid (non-blocking)
    try {
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

      const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://ahoratengopagina.com';
      const inviteUrl = origin + '/mipagina';
      const emailContent = await getTemplateForTrigger('customer_team_invite', { inviterName, businessName, email, inviteUrl });
      const emailResult = await sendEmail({ to: email, ...emailContent });
      if (!emailResult.success) {
        console.warn('SendGrid email failed (non-blocking):', emailResult.error);
      }
    } catch (emailErr) {
      console.warn('SendGrid email error (non-blocking):', emailErr);
    }

    return res.status(200).json(records[0] || {});
  } catch (err) {
    console.error('Invite customer user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
