// Vercel serverless function: Invite a new employee via Supabase Auth
// Requires caller to be an admin employee (verified via JWT)

import { sendEmail } from '../_lib/sendgrid.js';
import { employeeInviteEmail } from '../_lib/email-templates.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  // Verify caller is an admin
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

    // Check if caller is admin in employees table
    const empRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?auth_user_id=eq.${userData.id}&role=eq.admin&is_active=eq.true&select=id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const empData = await empRes.json();
    if (!Array.isArray(empData) || empData.length === 0) {
      return res.status(403).json({ error: 'Only admins can invite employees' });
    }

    // Validate request body
    const { email, display_name } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if employee with this email already exists
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?email=eq.${encodeURIComponent(email)}&select=id,is_active`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const existingData = await existingRes.json();
    if (Array.isArray(existingData) && existingData.length > 0) {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }

    // Generate invite link via Supabase Admin API (does NOT send Supabase's built-in email)
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://ahoratengopagina.com';
    const inviteRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'invite',
        email,
        data: { display_name: display_name || '' },
        redirect_to: origin + '/employee/login',
      }),
    });

    if (!inviteRes.ok) {
      const errText = await inviteRes.text();
      console.error('Supabase invite error:', inviteRes.status, errText);
      return res.status(502).json({ error: 'Failed to send invitation: ' + errText.substring(0, 200) });
    }

    const inviteData = await inviteRes.json();
    const newAuthUserId = inviteData.id;
    const inviteActionLink = inviteData.action_link;

    if (!newAuthUserId) {
      console.error('No user ID in invite response:', JSON.stringify(inviteData).substring(0, 500));
      return res.status(502).json({ error: 'Invitation created but no user ID returned' });
    }

    // Insert employee record
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/employees`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        auth_user_id: newAuthUserId,
        email,
        display_name: display_name || null,
        role: 'employee',
        is_active: true,
        invited_at: new Date().toISOString(),
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Employee insert error:', insertRes.status, errText);
      return res.status(502).json({ error: 'Invitation sent but failed to create employee record' });
    }

    const employees = await insertRes.json();

    // Send branded email with the actual invite magic link
    try {
      const inviteUrl = inviteActionLink || (origin + '/employee/login');
      const emailContent = employeeInviteEmail({ displayName: display_name || '', email, inviteUrl });
      const emailResult = await sendEmail({
        to: email,
        ...emailContent,
        from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
        replyTo: 'andres@ahoratengopagina.com',
      });
      if (!emailResult.success) {
        console.warn('Employee invite email failed (non-blocking):', emailResult.error);
      }
    } catch (emailErr) {
      console.warn('Employee invite email error (non-blocking):', emailErr);
    }

    return res.status(200).json(employees[0] || {});
  } catch (err) {
    console.error('Invite employee error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
