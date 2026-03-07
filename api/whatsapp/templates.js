// Vercel serverless function: Sync WhatsApp message templates from Meta
// GET — fetches approved templates and upserts into whatsapp_templates table

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken || !wabId) {
    return res.status(503).json({ error: 'WhatsApp API credentials not configured' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  try {
    // Fetch templates from Meta API
    const metaResp = await fetch(
      `https://graph.facebook.com/v21.0/${wabId}/message_templates?limit=100`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    const metaData = await metaResp.json();

    if (!metaResp.ok) {
      console.error('Meta templates API error:', metaData);
      return res.status(502).json({
        error: 'Failed to fetch templates from Meta',
        detail: metaData.error?.message || 'Unknown error',
      });
    }

    const templates = metaData.data || [];
    const now = new Date().toISOString();
    const upserted = [];

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    };

    for (const tpl of templates) {
      // Extract body component
      const bodyComponent = (tpl.components || []).find(c => c.type === 'BODY');
      const headerComponent = (tpl.components || []).find(c => c.type === 'HEADER');
      const footerComponent = (tpl.components || []).find(c => c.type === 'FOOTER');

      const bodyText = bodyComponent?.text || '';
      // Count {{n}} placeholders
      const paramMatches = bodyText.match(/\{\{\d+\}\}/g);
      const paramCount = paramMatches ? paramMatches.length : 0;

      const record = {
        template_name: tpl.name,
        language: tpl.language || 'en',
        category: tpl.category || 'UTILITY',
        body_text: bodyText,
        header_text: headerComponent?.text || null,
        footer_text: footerComponent?.text || null,
        param_count: paramCount,
        meta_status: tpl.status || 'PENDING',
        last_synced_at: now,
      };

      const upsertResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_templates`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(record),
        }
      );

      const result = await upsertResp.json();
      if (result && result.length > 0) {
        upserted.push(result[0]);
      }
    }

    return res.status(200).json({
      success: true,
      count: upserted.length,
      templates: upserted,
    });
  } catch (err) {
    console.error('Template sync error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
