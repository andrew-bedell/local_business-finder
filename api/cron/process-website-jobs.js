// Vercel cron/server worker: processes durable customer website generation jobs.

import { runCustomerWebsiteGenerationJob } from '../_lib/customer-website-runner.js';
import {
  claimGenerationJob,
  listRunnableGenerationJobs,
  updateGenerationJob,
} from '../_lib/website-generation-jobs.js';

export const config = { maxDuration: 300 };

const TIME_BUDGET_MS = 270_000;

function readJobId(req) {
  return req.body?.jobId || req.body?.job_id || req.query?.jobId || req.query?.job_id || null;
}

function assertAuthorized(req, serviceKey) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  if (!cronSecret) return;
  if (authHeader === `Bearer ${cronSecret}`) return;
  if (serviceKey && authHeader === `Bearer ${serviceKey}`) return;
  const err = new Error('Unauthorized');
  err.status = 401;
  throw err;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(503).json({ error: 'Supabase service key not configured' });

  try {
    assertAuthorized(req, serviceKey);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const supabaseHeaders = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
  const workerId = `worker-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const jobId = readJobId(req);
  const startedAt = Date.now();
  const results = [];

  try {
    const candidates = await listRunnableGenerationJobs({
      supabaseUrl,
      supabaseHeaders,
      jobId,
      limit: jobId ? 1 : 2,
    });

    for (const candidate of candidates) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) break;

      const job = await claimGenerationJob({
        job: candidate,
        supabaseUrl,
        supabaseHeaders,
        workerId,
      });
      if (!job) continue;

      try {
        const result = await runCustomerWebsiteGenerationJob({
          job,
          supabaseUrl,
          supabaseHeaders,
          onStage: async (stage, progress) => {
            await updateGenerationJob({
              jobId: job.id,
              supabaseUrl,
              supabaseHeaders,
              updates: {
                status: 'running',
                stage,
                progress,
                locked_at: new Date().toISOString(),
                locked_by: workerId,
              },
            });
          },
        });

        await updateGenerationJob({
          jobId: job.id,
          supabaseUrl,
          supabaseHeaders,
          updates: {
            status: 'completed',
            stage: 'completed',
            progress: 100,
            website_id: result.websiteId || null,
            published_url: result.publishedUrl || null,
            error_message: null,
            locked_at: null,
            locked_by: null,
            finished_at: new Date().toISOString(),
            result: {
              websiteId: result.websiteId || null,
              publishedUrl: result.publishedUrl || null,
              warning: result.warning || null,
            },
          },
        });

        results.push({
          jobId: job.id,
          businessId: job.business_id,
          status: 'completed',
          websiteId: result.websiteId,
          publishedUrl: result.publishedUrl,
        });
      } catch (err) {
        console.error(`[WebsiteJobWorker] Job ${job.id} failed:`, err);
        await updateGenerationJob({
          jobId: job.id,
          supabaseUrl,
          supabaseHeaders,
          updates: {
            status: 'failed',
            stage: 'failed',
            progress: 100,
            error_message: err.message || 'Website generation failed',
            locked_at: null,
            locked_by: null,
            finished_at: new Date().toISOString(),
          },
        });
        results.push({
          jobId: job.id,
          businessId: job.business_id,
          status: 'failed',
          error: err.message || 'Website generation failed',
        });
      }
    }

    return res.status(200).json({
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error('[WebsiteJobWorker] Failed:', err);
    return res.status(500).json({ error: err.message || 'Website job worker failed' });
  }
}
