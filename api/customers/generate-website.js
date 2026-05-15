// Customer-triggered website generation.
// POST enqueues durable server-side work. GET returns resumable job status.

import { resolveCustomerBusiness } from '../_lib/resolve-customer-business.js';
import {
  createGenerationJob,
  getActiveGenerationJob,
  getGenerationJobById,
  toPublicGenerationJob,
} from '../_lib/website-generation-jobs.js';

export const config = { maxDuration: 60 };

const API_BASE = process.env.API_BASE_URL || 'https://ahoratengopagina.com';

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return API_BASE;
  const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function kickGenerationWorker(req, serviceKey, jobId) {
  const baseUrl = getBaseUrl(req);
  fetch(`${baseUrl}/api/cron/process-website-jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ jobId }),
  }).catch((err) => {
    console.warn('[GenerateWebsite] Best-effort worker kick failed:', err.message);
  });
}

async function loadLatestWebsite({ businessId, supabaseUrl, supabaseHeaders }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${encodeURIComponent(businessId)}&select=id,created_at,last_edited_at,version,status,published_url,config&order=created_at.desc&limit=1`,
    { headers: supabaseHeaders }
  );
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function loadWebsiteById({ businessId, websiteId, supabaseUrl, supabaseHeaders }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&business_id=eq.${encodeURIComponent(businessId)}&select=id,created_at,last_edited_at,version,status,published_url,config&limit=1`,
    { headers: supabaseHeaders }
  );
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function enforceGenerationRateLimit({ latestWebsite, isUpdate }) {
  if (!latestWebsite) {
    if (isUpdate) {
      const err = new Error('No existing website to update');
      err.status = 400;
      throw err;
    }
    return;
  }

  const lastTime = new Date(latestWebsite.last_edited_at || latestWebsite.created_at);
  const hoursSince = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);

  if (isUpdate && hoursSince < 1) {
    const err = new Error('Puedes actualizar tu página web una vez por hora.');
    err.status = 429;
    err.minutesRemaining = Math.ceil(60 - hoursSince * 60);
    throw err;
  }

  if (!isUpdate && hoursSince < 24) {
    const err = new Error('Puedes generar una página web nueva una vez cada 24 horas.');
    err.status = 429;
    err.hoursRemaining = Math.ceil(24 - hoursSince);
    throw err;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service role key not configured' });
  }

  const supabaseHeaders = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  let resolved;
  try {
    resolved = await resolveCustomerBusiness(req, supabaseUrl, serviceKey);
  } catch (authErr) {
    const status = authErr.status || 401;
    return res.status(status).json({ error: authErr.message });
  }

  const { businessId, customerId, userId } = resolved;

  try {
    if (req.method === 'GET') {
      const jobId = req.query?.jobId || req.query?.job_id;
      const job = jobId
        ? await getGenerationJobById({ jobId, businessId, supabaseUrl, supabaseHeaders })
        : await getActiveGenerationJob({ businessId, supabaseUrl, supabaseHeaders });
      return res.status(200).json({ job: toPublicGenerationJob(job) });
    }

    const { mode, existingWebsiteId } = req.body || {};
    const isUpdate = mode === 'update' && existingWebsiteId;

    const activeJob = await getActiveGenerationJob({ businessId, supabaseUrl, supabaseHeaders });
    if (activeJob) {
      return res.status(202).json({
        success: true,
        queued: true,
        job: toPublicGenerationJob(activeJob),
      });
    }

    const latestWebsite = await loadLatestWebsite({ businessId, supabaseUrl, supabaseHeaders });
    if (isUpdate) {
      const targetWebsite = await loadWebsiteById({
        businessId,
        websiteId: existingWebsiteId,
        supabaseUrl,
        supabaseHeaders,
      });
      if (!targetWebsite) {
        return res.status(400).json({ error: 'No existing website to update' });
      }
    }
    enforceGenerationRateLimit({ latestWebsite, isUpdate });

    const job = await createGenerationJob({
      businessId,
      customerId,
      userId,
      mode: isUpdate ? 'update' : 'create',
      existingWebsiteId: isUpdate ? existingWebsiteId : null,
      supabaseUrl,
      supabaseHeaders,
    });

    console.log(`[GenerateWebsite] Queued job ${job.id} for business ${businessId}`);
    kickGenerationWorker(req, serviceKey, job.id);

    return res.status(202).json({
      success: true,
      queued: true,
      job: toPublicGenerationJob(job),
    });
  } catch (err) {
    console.error(`[GenerateWebsite] Failed for business ${businessId}:`, err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Website generation failed',
      minutesRemaining: err.minutesRemaining,
      hoursRemaining: err.hoursRemaining,
    });
  }
}
