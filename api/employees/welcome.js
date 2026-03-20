// Vercel serverless function: Send welcome/onboarding tutorial email to new employee
// Triggered on first login — idempotent via welcome_email_sent_at guard

import { sendEmail } from '../_lib/sendgrid.js';
import { getTemplateForTrigger } from '../_lib/email-templates.js';

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

  // Verify caller via JWT
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

    // Look up employee record
    const empRes = await fetch(
      `${supabaseUrl}/rest/v1/employees?auth_user_id=eq.${userData.id}&is_active=eq.true&select=id,email,display_name,welcome_email_sent_at`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    const empData = await empRes.json();
    if (!Array.isArray(empData) || empData.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = empData[0];

    // Idempotency guard — don't send twice
    if (employee.welcome_email_sent_at) {
      return res.status(200).json({ already_sent: true });
    }

    // Build URLs
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://ahoratengopagina.com';
    const searchUrl = origin + '/employee';
    const dashboardUrl = origin + '/employee/admin';

    // Get email template and send
    const emailContent = await getTemplateForTrigger('employee_welcome', {
      displayName: employee.display_name || '',
      searchUrl,
      dashboardUrl,
    });

    const emailResult = await sendEmail({ to: employee.email, ...emailContent });
    if (!emailResult.success) {
      console.error('Welcome email send failed:', emailResult.error);
      return res.status(502).json({ error: 'Failed to send welcome email' });
    }

    // Mark as sent
    await fetch(
      `${supabaseUrl}/rest/v1/employees?id=eq.${employee.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ welcome_email_sent_at: new Date().toISOString() }),
      }
    );

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Welcome email error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
