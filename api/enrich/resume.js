import { resumeEnrichmentPipeline } from '../_lib/enrichment-monitor.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server config missing' });
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer ${supabaseKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const result = await resumeEnrichmentPipeline({
      supabaseUrl,
      headers,
      resumedBy: 'manual',
    });

    return res.status(200).json({
      success: true,
      paused: result.paused,
      supported: result.supported,
    });
  } catch (err) {
    console.error('Resume enrichment error:', err);
    return res.status(500).json({ error: err.message || 'Failed to resume enrichment' });
  }
}
