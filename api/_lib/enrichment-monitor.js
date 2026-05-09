import { sendEmail } from './sendgrid.js';

const ENRICHMENT_RUN_SELECT = 'id';
const ENRICHMENT_CONTROL_KEY = 'enrichment_pipeline';
const DEFAULT_ALERT_RECIPIENT = 'andres@ahoratengopagina.com';

let cachedEnrichmentRunsSchemaSupport = null;
let cachedSystemSettingsSchemaSupport = null;

export function truncateEnrichmentText(value, max = 500) {
  return String(value || '').slice(0, max);
}

export function isQuotaOrBillingError(...parts) {
  const text = parts
    .filter(Boolean)
    .map((part) => String(part).toLowerCase())
    .join(' ');

  if (!text) return false;

  return (
    text.includes('quota')
    || text.includes('credit')
    || text.includes('http_429')
    || text.includes('rate limit')
    || text.includes('too many requests')
    || text.includes('usage limit')
    || text.includes('billing')
    || text.includes('payment required')
    || text.includes('exhausted')
  );
}

export function isConfigurationBlockerError(...parts) {
  const text = parts
    .filter(Boolean)
    .map((part) => String(part).toLowerCase())
    .join(' ');

  if (!text) return false;

  return (
    text.includes('google_places_api_key not configured')
    || text.includes('missing_google_places_key')
    || text.includes('searchapi_key not configured')
    || text.includes('missing_searchapi_key')
  );
}

export function getAdminAlertEmail() {
  return (
    process.env.ADMIN_ALERT_EMAIL
    || process.env.ADMIN_EMAIL
    || process.env.ALERT_EMAIL
    || process.env.OPERATIONS_EMAIL
    || DEFAULT_ALERT_RECIPIENT
  );
}

export function isMissingTableSchemaError(message, tableName) {
  const normalized = String(message || '').toLowerCase();
  const target = String(tableName || '').toLowerCase();

  return (
    normalized.includes(target)
    && (
      normalized.includes('does not exist')
      || normalized.includes('schema cache')
      || normalized.includes('42p01')
      || normalized.includes('42703')
    )
  );
}

export async function supportsEnrichmentRunsSchema({ supabaseUrl, headers }) {
  if (cachedEnrichmentRunsSchemaSupport !== null) {
    return cachedEnrichmentRunsSchemaSupport;
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/enrichment_runs?select=${ENRICHMENT_RUN_SELECT}&limit=1`,
    { headers }
  );

  if (res.ok) {
    cachedEnrichmentRunsSchemaSupport = true;
    return true;
  }

  const text = await res.text().catch(() => '');
  if (isMissingTableSchemaError(text, 'enrichment_runs')) {
    cachedEnrichmentRunsSchemaSupport = false;
    return false;
  }

  throw new Error(`Failed to detect enrichment_runs schema support: ${truncateEnrichmentText(text, 200)}`);
}

export async function supportsSystemSettingsSchema({ supabaseUrl, headers }) {
  if (cachedSystemSettingsSchemaSupport !== null) {
    return cachedSystemSettingsSchemaSupport;
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/system_settings?select=key&limit=1`,
    { headers }
  );

  if (res.ok) {
    cachedSystemSettingsSchemaSupport = true;
    return true;
  }

  const text = await res.text().catch(() => '');
  if (isMissingTableSchemaError(text, 'system_settings')) {
    cachedSystemSettingsSchemaSupport = false;
    return false;
  }

  throw new Error(`Failed to detect system_settings schema support: ${truncateEnrichmentText(text, 200)}`);
}

export async function createEnrichmentRun({
  supabaseUrl,
  headers,
  businessId,
  placeId,
  triggerSource,
  attempt,
}) {
  const supported = await supportsEnrichmentRunsSchema({ supabaseUrl, headers });
  if (!supported) return null;

  const res = await fetch(`${supabaseUrl}/rest/v1/enrichment_runs`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      business_id: businessId,
      place_id: placeId || null,
      trigger_source: triggerSource || 'manual',
      status: 'started',
      attempt: attempt || 0,
      started_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (isMissingTableSchemaError(text, 'enrichment_runs')) {
      cachedEnrichmentRunsSchemaSupport = false;
      return null;
    }
    throw new Error(`Failed to create enrichment run: ${truncateEnrichmentText(text, 200)}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0].id : null;
}

export async function finalizeEnrichmentRun({
  supabaseUrl,
  headers,
  runId,
  status,
  dataId,
  errorMessage,
  warnings,
  stepResults,
  evidence,
}) {
  if (!runId) return;

  const supported = await supportsEnrichmentRunsSchema({ supabaseUrl, headers });
  if (!supported) return;

  const res = await fetch(`${supabaseUrl}/rest/v1/enrichment_runs?id=eq.${encodeURIComponent(runId)}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      status,
      data_id: dataId || null,
      error_message: errorMessage ? truncateEnrichmentText(errorMessage, 1000) : null,
      warnings: Array.isArray(warnings) && warnings.length ? warnings : null,
      step_results: stepResults || {},
      evidence: evidence || {},
      finished_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (isMissingTableSchemaError(text, 'enrichment_runs')) {
      cachedEnrichmentRunsSchemaSupport = false;
      return;
    }
    throw new Error(`Failed to finalize enrichment run: ${truncateEnrichmentText(text, 200)}`);
  }
}

async function upsertSystemSetting({ supabaseUrl, headers, key, value }) {
  const res = await fetch(`${supabaseUrl}/rest/v1/system_settings?on_conflict=key`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify([{ key, value, updated_at: new Date().toISOString() }]),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (isMissingTableSchemaError(text, 'system_settings')) {
      cachedSystemSettingsSchemaSupport = false;
      return null;
    }
    throw new Error(`Failed to upsert system setting ${key}: ${truncateEnrichmentText(text, 200)}`);
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function getEnrichmentPauseState({ supabaseUrl, headers }) {
  const supported = await supportsSystemSettingsSchema({ supabaseUrl, headers });
  if (!supported) {
    return {
      supported: false,
      paused: false,
      reason: null,
      value: null,
    };
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/system_settings?key=eq.${encodeURIComponent(ENRICHMENT_CONTROL_KEY)}&select=key,value&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (isMissingTableSchemaError(text, 'system_settings')) {
      cachedSystemSettingsSchemaSupport = false;
      return {
        supported: false,
        paused: false,
        reason: null,
        value: null,
      };
    }
    throw new Error(`Failed to fetch enrichment pause state: ${truncateEnrichmentText(text, 200)}`);
  }

  const rows = await res.json();
  const record = Array.isArray(rows) && rows[0] ? rows[0] : null;
  const value = record?.value || null;

  return {
    supported: true,
    paused: !!value?.paused,
    reason: value?.reason || null,
    value,
  };
}

async function sendEnrichmentAlertEmail({
  reason,
  triggerSource,
  businessId,
  placeId,
  errorMessage,
  runId,
}) {
  const to = getAdminAlertEmail();
  if (!to) {
    return { success: false, skipped: true, error: 'No administrator alert email configured' };
  }

  const subject = `Enrichment paused: ${reason}`;
  const text = [
    'The enrichment pipeline has been paused because it hit a blocking external API error.',
    '',
    `Reason: ${reason}`,
    errorMessage ? `Error: ${errorMessage}` : null,
    triggerSource ? `Trigger: ${triggerSource}` : null,
    businessId ? `Business ID: ${businessId}` : null,
    placeId ? `Place ID: ${placeId}` : null,
    runId ? `Run ID: ${runId}` : null,
    '',
    'Please restore the external API configuration or credits before resuming enrichment.',
  ].filter(Boolean).join('\n');

  const html = `
    <h2>Enrichment Paused</h2>
    <p>The enrichment pipeline has been paused because it hit a blocking external API error.</p>
    <ul>
      <li><strong>Reason:</strong> ${escapeHtml(reason)}</li>
      ${errorMessage ? `<li><strong>Error:</strong> ${escapeHtml(errorMessage)}</li>` : ''}
      ${triggerSource ? `<li><strong>Trigger:</strong> ${escapeHtml(triggerSource)}</li>` : ''}
      ${businessId ? `<li><strong>Business ID:</strong> ${escapeHtml(String(businessId))}</li>` : ''}
      ${placeId ? `<li><strong>Place ID:</strong> ${escapeHtml(placeId)}</li>` : ''}
      ${runId ? `<li><strong>Run ID:</strong> ${escapeHtml(String(runId))}</li>` : ''}
    </ul>
    <p>Please restore the external API configuration or credits before resuming enrichment.</p>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text,
    from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
    replyTo: 'andres@ahoratengopagina.com',
  });
}

export async function pauseEnrichmentPipeline({
  supabaseUrl,
  headers,
  reason,
  errorMessage,
  triggerSource,
  businessId,
  placeId,
  runId,
}) {
  const current = await getEnrichmentPauseState({ supabaseUrl, headers });
  const alreadyPaused = current.paused;
  const currentReason = current.value?.reason || null;
  const shouldSendAlert = !alreadyPaused || currentReason !== reason;
  const pausedAt = current.value?.pausedAt || new Date().toISOString();

  let alertResult = { success: false, skipped: true, error: null };
  if (shouldSendAlert) {
    alertResult = await sendEnrichmentAlertEmail({
      reason,
      triggerSource,
      businessId,
      placeId,
      errorMessage,
      runId,
    });
  }

  if (current.supported) {
    const nextValue = {
      paused: true,
      reason,
      errorMessage: errorMessage ? truncateEnrichmentText(errorMessage, 1000) : null,
      triggerSource: triggerSource || 'unknown',
      businessId: businessId || null,
      placeId: placeId || null,
      runId: runId || null,
      pausedAt,
      updatedAt: new Date().toISOString(),
      alertSentAt: alertResult.success ? new Date().toISOString() : (current.value?.alertSentAt || null),
      alertRecipient: getAdminAlertEmail() || null,
    };

    await upsertSystemSetting({
      supabaseUrl,
      headers,
      key: ENRICHMENT_CONTROL_KEY,
      value: nextValue,
    });
  }

  return {
    paused: true,
    reason,
    alertSent: !!alertResult.success,
  };
}

export async function resumeEnrichmentPipeline({ supabaseUrl, headers, resumedBy = 'manual' }) {
  const current = await getEnrichmentPauseState({ supabaseUrl, headers });
  if (!current.supported) {
    return { paused: false, supported: false };
  }

  const nextValue = {
    ...(current.value || {}),
    paused: false,
    reason: null,
    errorMessage: null,
    updatedAt: new Date().toISOString(),
    resumedAt: new Date().toISOString(),
    resumedBy,
  };

  await upsertSystemSetting({
    supabaseUrl,
    headers,
    key: ENRICHMENT_CONTROL_KEY,
    value: nextValue,
  });

  return { paused: false, supported: true };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
