// Vercel serverless function: Resend employee invite email
// POST — generates a new magic link and sends the branded invite email

import { sendEmail } from '../_lib/sendgrid.js';
import { employeeInviteEmail } from '../_lib/email-templates.js';

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

  // Verify caller is an admin
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

    // Check if caller is admin
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
      return res.status(403).json({ error: 'Only admins can resend invitations' });
    }

    // Get target employee
    const { employee_id } = req.body || {};
    if (!employee_id) {
      return res.status(400).json({ error: 'employee_id is required' });
    }

    const targetRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?id=eq.${encodeURIComponent(employee_id)}&select=id,email,display_name,auth_user_id,is_active,joined_at`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const targetData = await targetRes.json();
    if (!Array.isArray(targetData) || targetData.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const target = targetData[0];

    // Generate a new invite link via Supabase Admin API
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
        email: target.email,
        data: { display_name: target.display_name || '' },
        redirect_to: origin + '/employee/login',
      }),
    });

    if (!inviteRes.ok) {
      const errText = await inviteRes.text();
      console.error('Supabase generate_link error:', inviteRes.status, errText);
      return res.status(502).json({ error: 'Failed to generate invite link' });
    }

    const inviteData = await inviteRes.json();
    const inviteActionLink = inviteData.action_link;
    const inviteUrl = inviteActionLink || (origin + '/employee/login');

    // Send branded email
    const emailContent = employeeInviteEmail({ displayName: target.display_name || '', email: target.email, inviteUrl });
    const emailResult = await sendEmail({
      to: target.email,
      ...emailContent,
      from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
      replyTo: 'andres@ahoratengopagina.com',
    });

    if (!emailResult.success) {
      console.error('Resend invite email failed:', emailResult.error);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend employee invite error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
