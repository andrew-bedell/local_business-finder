export const ACTIVE_GENERATION_STATUSES = ['queued', 'running'];

export function toPublicGenerationJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    businessId: job.business_id,
    customerId: job.customer_id,
    mode: job.mode || 'create',
    existingWebsiteId: job.existing_website_id || null,
    status: job.status || 'queued',
    stage: job.stage || 'queued',
    progress: Number(job.progress || 0),
    error: job.error_message || null,
    websiteId: job.website_id || null,
    publishedUrl: job.published_url || null,
    attempts: Number(job.attempts || 0),
    createdAt: job.created_at || null,
    updatedAt: job.updated_at || null,
    startedAt: job.started_at || null,
    finishedAt: job.finished_at || null,
  };
}

export async function readRestJson(response, fallback = null) {
  const text = await response.text().catch(() => '');
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch (_) {
    return fallback;
  }
}

export async function getActiveGenerationJob({ businessId, supabaseUrl, supabaseHeaders }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/website_generation_jobs?business_id=eq.${encodeURIComponent(businessId)}&status=in.(queued,running)&select=*&order=created_at.asc&limit=1`,
    { headers: supabaseHeaders }
  );
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function getGenerationJobById({ jobId, businessId, supabaseUrl, supabaseHeaders }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/website_generation_jobs?id=eq.${encodeURIComponent(jobId)}&business_id=eq.${encodeURIComponent(businessId)}&select=*&limit=1`,
    { headers: supabaseHeaders }
  );
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function createGenerationJob({
  businessId,
  customerId,
  userId,
  mode,
  existingWebsiteId,
  supabaseUrl,
  supabaseHeaders,
}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/website_generation_jobs`, {
    method: 'POST',
    headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      business_id: businessId,
      customer_id: customerId,
      requested_by_user_id: userId,
      mode: mode === 'update' ? 'update' : 'create',
      existing_website_id: existingWebsiteId || null,
      status: 'queued',
      stage: 'queued',
      progress: 0,
    }),
  });

  const data = await readRestJson(response, []);
  if (!response.ok || !Array.isArray(data) || data.length === 0) {
    const detail = Array.isArray(data) ? '' : (data?.message || data?.error || '');
    throw new Error(detail || 'Failed to create website generation job');
  }

  return data[0];
}

export async function listRunnableGenerationJobs({ supabaseUrl, supabaseHeaders, jobId, limit = 3 }) {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const filter = jobId
    ? `id=eq.${encodeURIComponent(jobId)}&`
    : `status=in.(queued,running)&`;
  const response = await fetch(
    `${supabaseUrl}/rest/v1/website_generation_jobs?${filter}select=*&order=created_at.asc&limit=${limit}`,
    { headers: supabaseHeaders }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Failed to load generation jobs: ${detail.substring(0, 200)}`);
  }

  const rows = await response.json();
  return (Array.isArray(rows) ? rows : []).filter((job) => {
    if (job.status === 'queued') return true;
    if (job.status !== 'running') return false;
    if (!job.locked_at) return true;
    return new Date(job.locked_at).getTime() < new Date(staleBefore).getTime();
  });
}

export async function claimGenerationJob({ job, supabaseUrl, supabaseHeaders, workerId }) {
  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const base = `${supabaseUrl}/rest/v1/website_generation_jobs?id=eq.${encodeURIComponent(job.id)}`;
  const claimFilter = job.status === 'running'
    ? `&status=eq.running&locked_at=lt.${encodeURIComponent(staleBefore)}`
    : '&status=eq.queued';

  const response = await fetch(`${base}${claimFilter}`, {
    method: 'PATCH',
    headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      status: 'running',
      stage: job.stage && job.stage !== 'queued' ? job.stage : 'research',
      progress: Math.max(Number(job.progress || 0), 5),
      locked_at: now,
      locked_by: workerId,
      attempts: Number(job.attempts || 0) + 1,
      started_at: job.started_at || now,
      updated_at: now,
    }),
  });

  const rows = await readRestJson(response, []);
  if (!response.ok || !Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

export async function updateGenerationJob({ jobId, supabaseUrl, supabaseHeaders, updates }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/website_generation_jobs?id=eq.${encodeURIComponent(jobId)}`,
    {
      method: 'PATCH',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  const rows = await readRestJson(response, []);
  if (!response.ok) {
    const detail = Array.isArray(rows) ? '' : (rows?.message || rows?.error || '');
    throw new Error(detail || 'Failed to update website generation job');
  }
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}
