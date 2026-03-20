// Vercel serverless function: Seed email_templates table with default transactional templates
// POST — only seeds if table is empty

import {
  employeeInviteEmail,
  customerWelcomeEmail,
  customerTeamInviteEmail,
  websitePublishedEmail,
  paymentConfirmationEmail,
  paymentFailedEmail,
  subscriptionCancelledEmail,
  websiteSuspendedEmail,
  websiteReactivatedEmail,
  editRequestReceivedEmail,
  editRequestCompletedEmail,
  editRequestRejectedEmail,
  planChangeEmail,
} from '../_lib/email-templates.js';

const TEMPLATE_DEFINITIONS = [
  {
    trigger_key: 'employee_invite',
    name: 'Employee Invite',
    description: 'Sent when a new employee is invited to the admin panel',
    merge_tags: ['displayName', 'email', 'inviteUrl'],
    build: () => employeeInviteEmail({
      displayName: '{{displayName}}',
      email: '{{email}}',
      inviteUrl: '{{inviteUrl}}',
    }),
  },
  {
    trigger_key: 'customer_welcome',
    name: 'Customer Welcome',
    description: 'Sent when a new customer subscription is created',
    merge_tags: ['contactName', 'businessName', 'loginUrl'],
    build: () => customerWelcomeEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      loginUrl: '{{loginUrl}}',
    }),
  },
  {
    trigger_key: 'customer_team_invite',
    name: 'Customer Team Invite',
    description: 'Sent when a customer invites a team member to their portal',
    merge_tags: ['inviterName', 'businessName', 'email', 'inviteUrl'],
    build: () => customerTeamInviteEmail({
      inviterName: '{{inviterName}}',
      businessName: '{{businessName}}',
      email: '{{email}}',
      inviteUrl: '{{inviteUrl}}',
    }),
  },
  {
    trigger_key: 'website_published',
    name: 'Website Published',
    description: 'Sent when a customer website is published for the first time',
    merge_tags: ['contactName', 'businessName', 'publishedUrl', 'portalUrl'],
    build: () => websitePublishedEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      publishedUrl: '{{publishedUrl}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
  {
    trigger_key: 'payment_confirmed',
    name: 'Payment Confirmed',
    description: 'Sent when a subscription payment is successfully processed',
    merge_tags: ['contactName', 'businessName', 'amount', 'currency', 'periodEnd'],
    build: () => paymentConfirmationEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      amount: '{{amount}}',
      currency: '{{currency}}',
      periodEnd: '{{periodEnd}}',
    }),
  },
  {
    trigger_key: 'payment_failed',
    name: 'Payment Failed',
    description: 'Sent when a subscription payment fails',
    merge_tags: ['contactName', 'businessName', 'amount', 'currency', 'portalUrl'],
    build: () => paymentFailedEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      amount: '{{amount}}',
      currency: '{{currency}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
  {
    trigger_key: 'subscription_cancelled',
    name: 'Subscription Cancelled',
    description: 'Sent when a customer subscription is cancelled',
    merge_tags: ['contactName', 'businessName', 'portalUrl'],
    build: () => subscriptionCancelledEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
  {
    trigger_key: 'website_suspended',
    name: 'Website Suspended',
    description: 'Sent when a customer website is suspended due to payment issues',
    merge_tags: ['contactName', 'businessName', 'portalUrl'],
    build: () => websiteSuspendedEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
  {
    trigger_key: 'website_reactivated',
    name: 'Website Reactivated',
    description: 'Sent when a previously suspended website is reactivated',
    merge_tags: ['contactName', 'businessName', 'publishedUrl', 'portalUrl'],
    build: () => websiteReactivatedEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      publishedUrl: '{{publishedUrl}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
  {
    trigger_key: 'edit_request_received',
    name: 'Edit Request Received',
    description: 'Sent when a customer submits a website edit request',
    merge_tags: ['contactName', 'businessName', 'requestType', 'description'],
    build: () => editRequestReceivedEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      requestType: '{{requestType}}',
      description: '{{description}}',
    }),
  },
  {
    trigger_key: 'edit_request_completed',
    name: 'Edit Request Completed',
    description: 'Sent when an edit request has been completed and published',
    merge_tags: ['contactName', 'businessName', 'requestType', 'publishedUrl', 'portalUrl'],
    build: () => editRequestCompletedEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      requestType: '{{requestType}}',
      publishedUrl: '{{publishedUrl}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
  {
    trigger_key: 'edit_request_rejected',
    name: 'Edit Request Rejected',
    description: 'Sent when an edit request is rejected with a reason',
    merge_tags: ['contactName', 'businessName', 'requestType', 'rejectionReason', 'portalUrl'],
    build: () => editRequestRejectedEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      requestType: '{{requestType}}',
      rejectionReason: '{{rejectionReason}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
  {
    trigger_key: 'plan_changed',
    name: 'Plan Changed',
    description: 'Sent when a customer subscription plan is upgraded or downgraded',
    merge_tags: ['contactName', 'businessName', 'oldPlan', 'newPlan', 'newAmount', 'currency', 'portalUrl'],
    build: () => planChangeEmail({
      contactName: '{{contactName}}',
      businessName: '{{businessName}}',
      oldPlan: '{{oldPlan}}',
      newPlan: '{{newPlan}}',
      newAmount: '{{newAmount}}',
      currency: '{{currency}}',
      portalUrl: '{{portalUrl}}',
    }),
  },
];

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Check if templates already exist
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/email_templates?select=id`,
      {
        headers: {
          ...supabaseHeaders,
          'Prefer': 'count=exact',
          'Range': '0-0',
        },
      }
    );

    const contentRange = countRes.headers.get('content-range');
    const total = contentRange ? parseInt(contentRange.split('/')[1], 10) : 0;

    if (total > 0) {
      return res.status(200).json({ success: true, message: `Table already has ${total} templates, skipping seed`, seeded: 0 });
    }

    // Build all template rows
    const rows = TEMPLATE_DEFINITIONS.map((def) => {
      const rendered = def.build();
      return {
        name: def.name,
        description: def.description,
        category: 'transactional',
        trigger_key: def.trigger_key,
        subject: rendered.subject,
        body_html: rendered.html,
        body_text: rendered.text || null,
        merge_tags: def.merge_tags,
        is_active: true,
      };
    });

    // Bulk insert all templates
    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/email_templates`,
      {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(rows),
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => ({}));
      console.error('Email templates seed error:', err);
      return res.status(502).json({ error: 'Failed to seed email templates', detail: err.message || err.msg || JSON.stringify(err) });
    }

    const inserted = await insertRes.json();
    return res.status(200).json({ success: true, seeded: inserted.length, templates: inserted });
  } catch (err) {
    console.error('Email templates seed error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
