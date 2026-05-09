import { getEnrichmentPauseState, supportsEnrichmentRunsSchema } from '../_lib/enrichment-monitor.js';
import { supportsEnrichmentTrackingSchema } from '../_lib/enrichment-runner.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server config missing' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10) || 25, 1), 100);
    const businessId = req.query.businessId ? String(req.query.businessId).trim() : '';

    const [trackingSupported, runsSupported, pauseState] = await Promise.all([
      supportsEnrichmentTrackingSchema({ supabaseUrl, headers }),
      supportsEnrichmentRunsSchema({ supabaseUrl, headers }),
      getEnrichmentPauseState({ supabaseUrl, headers }),
    ]);

    if (!runsSupported) {
      return res.status(200).json({
        trackingSupported,
        runsSupported: false,
        paused: !!pauseState.paused,
        pauseReason: pauseState.reason || null,
        runs: [],
      });
    }

    const params = new URLSearchParams({
      select: 'id,business_id,place_id,trigger_source,status,attempt,data_id,error_message,warnings,step_results,evidence,started_at,finished_at,created_at',
      order: 'created_at.desc',
      limit: String(limit),
    });
    if (businessId) params.set('business_id', `eq.${businessId}`);

    const runsRes = await fetch(`${supabaseUrl}/rest/v1/enrichment_runs?${params.toString()}`, { headers });
    if (!runsRes.ok) {
      const text = await runsRes.text().catch(() => '');
      throw new Error(text || `Failed to fetch enrichment runs (HTTP ${runsRes.status})`);
    }

    const runs = await runsRes.json();

    return res.status(200).json({
      trackingSupported,
      runsSupported: true,
      paused: !!pauseState.paused,
      pauseReason: pauseState.reason || null,
      runs: Array.isArray(runs) ? runs : [],
    });
  } catch (err) {
    console.error('Enrichment logs error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch enrichment logs' });
  }
}
