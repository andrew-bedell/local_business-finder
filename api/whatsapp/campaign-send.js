// Vercel serverless function: Execute campaign sends in batches
// POST — sends template messages to audience members
// Processes up to BATCH_SIZE recipients per call, client polls until done

import { toE164 } from '../_lib/phone-utils.js';

const BATCH_SIZE = 50;
const SEND_DELAY_MS = 100; // delay between sends to respect rate limits

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!phoneNumberId || !accessToken) {
    return res.status(503).json({ error: 'WhatsApp API credentials not configured' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const { campaign_id } = req.body || {};
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });

  try {
    // Load campaign
    const campResp = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaign_id}&select=*,whatsapp_audiences(filters),whatsapp_templates(template_name,language,param_count)`,
      { headers }
    );
    const campData = await campResp.json();
    if (!campData || campData.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campData[0];
    if (!['draft', 'scheduled', 'sending'].includes(campaign.status)) {
      return res.status(409).json({ error: `Campaign is ${campaign.status}, cannot send` });
    }

    const filters = campaign.whatsapp_audiences?.filters || {};
    const templateName = campaign.whatsapp_templates?.template_name;
    const templateLang = campaign.whatsapp_templates?.language || 'en';
    const templateParams = campaign.template_params || [];

    if (!templateName) {
      return res.status(400).json({ error: 'Campaign template not found' });
    }

    // Get audience businesses (batch from offset)
    const offset = campaign.send_offset || 0;
    const audienceResp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_audience_businesses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        p_filters: filters,
        p_limit: BATCH_SIZE,
        p_offset: offset,
      }),
    });

    const businesses = await audienceResp.json();
    if (!audienceResp.ok) {
      return res.status(502).json({ error: 'Failed to load audience', detail: businesses });
    }

    const totalCount = businesses.length > 0 ? parseInt(businesses[0].total_count, 10) : 0;

    // First call: set status to sending and total
    if (campaign.status !== 'sending') {
      await fetch(`${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaign_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'sending',
          total_recipients: totalCount,
          started_at: new Date().toISOString(),
          send_offset: 0,
        }),
      });
    }

    if (businesses.length === 0) {
      // No more to send — mark complete
      await fetch(`${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaign_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'sent',
          completed_at: new Date().toISOString(),
        }),
      });
      return res.status(200).json({
        status: 'sent',
        total_recipients: totalCount,
        sent_count: campaign.sent_count || 0,
        failed_count: campaign.failed_count || 0,
      });
    }

    // Send messages in batch
    let batchSent = 0;
    let batchFailed = 0;

    for (const biz of businesses) {
      if (!biz.phone) {
        batchFailed++;
        continue;
      }

      const normalizedPhone = toE164(biz.phone, { addressCountry: biz.address_country }) || biz.phone.replace(/[\s\-()]/g, '').replace(/^(?!\+)/, '+');

      try {
        // Build Meta API payload
        const components = [];
        if (templateParams.length > 0) {
          components.push({
            type: 'body',
            parameters: templateParams.map(p => ({ type: 'text', text: p })),
          });
        }

        const metaPayload = {
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLang },
            components: components.length > 0 ? components : undefined,
          },
        };

        const metaResp = await fetch(
          `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metaPayload),
          }
        );

        const metaData = await metaResp.json();

        if (!metaResp.ok) {
          console.error('Meta API error for', biz.business_id, metaData);
          batchFailed++;
          continue;
        }

        const wamid = metaData.messages?.[0]?.id;
        const now = new Date().toISOString();

        // Upsert conversation
        const upsertResp = await fetch(`${supabaseUrl}/rest/v1/whatsapp_conversations`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            business_id: biz.business_id,
            recipient_phone: normalizedPhone,
            status: 'active',
            last_message_text: `[Campaign: ${campaign.name}]`.substring(0, 200),
            last_message_at: now,
          }),
        });
        const convResult = await upsertResp.json();
        const conversationId = convResult[0]?.id;

        // Insert message
        const msgResp = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            conversation_id: conversationId,
            business_id: biz.business_id,
            direction: 'outbound',
            message_type: 'template',
            template_name: templateName,
            template_params: templateParams.length > 0 ? templateParams : null,
            wamid,
            status: 'sent',
            sent_at: now,
            campaign_id,
          }),
        });

        const msgResult = await msgResp.json();
        const messageId = msgResult[0]?.id;

        // Insert campaign_message link
        if (messageId) {
          await fetch(`${supabaseUrl}/rest/v1/whatsapp_campaign_messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              campaign_id,
              message_id: messageId,
              business_id: biz.business_id,
            }),
          });
        }

        batchSent++;

        // Rate limit delay
        if (SEND_DELAY_MS > 0) {
          await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS));
        }
      } catch (sendErr) {
        console.error('Send error for business', biz.business_id, sendErr);
        batchFailed++;
      }
    }

    // Update campaign counters and offset
    const newOffset = offset + businesses.length;
    const isComplete = newOffset >= totalCount;

    const campaignUpdate = {
      sent_count: (campaign.sent_count || 0) + batchSent,
      failed_count: (campaign.failed_count || 0) + batchFailed,
      send_offset: newOffset,
    };

    if (isComplete) {
      campaignUpdate.status = 'sent';
      campaignUpdate.completed_at = new Date().toISOString();
    }

    await fetch(`${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaign_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(campaignUpdate),
    });

    return res.status(200).json({
      status: isComplete ? 'sent' : 'sending',
      batch_sent: batchSent,
      batch_failed: batchFailed,
      total_recipients: totalCount,
      processed: newOffset,
      sent_count: (campaign.sent_count || 0) + batchSent,
      failed_count: (campaign.failed_count || 0) + batchFailed,
    });
  } catch (err) {
    console.error('Campaign send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
