#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const PROTECTED_BUSINESS_ID = String(process.env.PROTECTED_BUSINESS_ID || '1910');
const EXECUTE = process.argv.includes('--execute');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv('.env.local');
loadEnv('.env');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or service-role key');
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

const storageDeleteHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
};

const now = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve('backups', `reset-${now}`);
fs.mkdirSync(backupDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, label = 'request') {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && (res.status === 429 || res.status >= 500) && attempt < 5) {
        const text = await res.text().catch(() => '');
        lastError = new Error(`${label} failed ${res.status}: ${text.slice(0, 200)}`);
        await sleep(750 * attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt >= 5) break;
      await sleep(750 * attempt);
    }
  }
  throw lastError || new Error(`${label} failed`);
}

async function rest(pathname, options = {}) {
  const res = await fetchWithRetry(`${supabaseUrl}/rest/v1/${pathname}`, {
    headers,
    ...options,
  }, `${options.method || 'GET'} ${pathname}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getOpenApiSchemas() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, { headers });
  if (!res.ok) throw new Error(`OpenAPI fetch failed ${res.status}`);
  const spec = await res.json();
  return spec.definitions || spec.components?.schemas || {};
}

function tablesWithField(schemas, field) {
  return Object.entries(schemas)
    .filter(([, schema]) => Boolean(schema?.properties?.[field]))
    .map(([name]) => name)
    .sort();
}

async function fetchAll(table, query = 'select=*') {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const chunk = await rest(`${table}?${query}&limit=1000&offset=${offset}`);
    rows.push(...(chunk || []));
    if (!chunk || chunk.length < 1000) break;
  }
  return rows;
}

async function tableExists(table) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, { headers });
  return res.ok;
}

async function backupTable(table) {
  if (!(await tableExists(table))) return { table, skipped: true };
  const rows = await fetchAll(table);
  fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(rows, null, 2));
  console.log(`Backed up ${table}: ${rows.length} rows`);
  return { table, rows: rows.length };
}

async function deleteWhere(table, filter) {
  if (!(await tableExists(table))) return { table, skipped: true };
  const countRes = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}&select=*&limit=1`, {
    method: 'HEAD',
    headers: { ...headers, Prefer: 'count=exact' },
  });
  const contentRange = countRes.headers.get('content-range') || '*/0';
  const total = Number(contentRange.split('/').pop() || 0);
  if (!EXECUTE || total === 0) return { table, planned: total };

  await rest(`${table}?${filter}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  });
  return { table, deleted: total };
}

async function listStorage(prefix = '') {
  const results = [];
  async function walk(currentPrefix) {
    for (let offset = 0; ; offset += 1000) {
      const res = await fetchWithRetry(`${supabaseUrl}/storage/v1/object/list/photos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prefix: currentPrefix,
          limit: 1000,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        }),
      }, `Storage list ${currentPrefix || '(root)'}`);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Storage list failed ${res.status}: ${text.slice(0, 200)}`);
      }
      const items = await res.json();
      for (const item of items || []) {
        const fullPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;
        if (item.id || item.metadata) results.push(fullPath);
        else await walk(fullPath);
      }
      if (!items || items.length < 1000) break;
    }
  }
  await walk(prefix);
  return results;
}

async function removeStorageObjects(paths) {
  let removed = 0;
  const concurrency = 10;
  for (let index = 0; index < paths.length; index += concurrency) {
    const chunk = paths.slice(index, index + concurrency);
    if (!EXECUTE) {
      removed += chunk.length;
      continue;
    }
    const results = await Promise.all(chunk.map(async (storagePath) => {
      const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
      const res = await fetchWithRetry(`${supabaseUrl}/storage/v1/object/photos/${encodedPath}`, {
        method: 'DELETE',
        headers: storageDeleteHeaders,
      }, `Storage delete ${storagePath}`);
      if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => '');
        throw new Error(`Storage delete failed for ${storagePath} ${res.status}: ${text.slice(0, 300)}`);
      }
      return storagePath;
    }));
    removed += results.length;
    if (removed % 500 === 0 || removed === paths.length) {
      console.log(`Deleted storage objects: ${removed}/${paths.length}`);
    }
  }
  return removed;
}

function inFilter(values) {
  return `in.(${values.map(encodeURIComponent).join(',')})`;
}

const schemas = await getOpenApiSchemas();
const businessTables = tablesWithField(schemas, 'business_id');
const customerTables = tablesWithField(schemas, 'customer_id');
const conversationTables = tablesWithField(schemas, 'conversation_id');
const websiteTables = tablesWithField(schemas, 'website_id');
const allTables = Array.from(new Set([
  ...businessTables,
  ...customerTables,
  ...conversationTables,
  ...websiteTables,
  'businesses',
  'customer_users',
  'subscriptions',
])).sort();

console.log(`${EXECUTE ? 'EXECUTE' : 'DRY RUN'} reset preserving business_id=${PROTECTED_BUSINESS_ID}`);
console.log(`Backup directory: ${backupDir}`);

const backupResults = [];
for (const table of allTables) backupResults.push(await backupTable(table));
fs.writeFileSync(path.join(backupDir, '_backup-summary.json'), JSON.stringify(backupResults, null, 2));

const protectedCustomers = await fetchAll('customers', `business_id=eq.${PROTECTED_BUSINESS_ID}&select=id`);
const protectedCustomerIds = protectedCustomers.map((row) => String(row.id));
const protectedWebsites = await fetchAll('generated_websites', `business_id=eq.${PROTECTED_BUSINESS_ID}&select=id`);
const protectedWebsiteIds = protectedWebsites.map((row) => String(row.id));
const protectedWhatsappConversations = await fetchAll('whatsapp_conversations', `business_id=eq.${PROTECTED_BUSINESS_ID}&select=id`);
const protectedEmailConversations = await fetchAll('email_conversations', `business_id=eq.${PROTECTED_BUSINESS_ID}&select=id`);
const protectedConversationIds = [...protectedWhatsappConversations, ...protectedEmailConversations].map((row) => String(row.id));
const protectedPhotos = await fetchAll('business_photos', `business_id=eq.${PROTECTED_BUSINESS_ID}&select=storage_path`);
const protectedStoragePaths = new Set(
  protectedPhotos.map((row) => row.storage_path).filter(Boolean)
);

const allStoragePaths = await listStorage();
fs.writeFileSync(path.join(backupDir, '_storage-manifest.json'), JSON.stringify(allStoragePaths, null, 2));
const storageToDelete = allStoragePaths.filter((item) => !protectedStoragePaths.has(item));
fs.writeFileSync(path.join(backupDir, '_storage-delete-plan.json'), JSON.stringify(storageToDelete, null, 2));

const deletionResults = [];

for (const table of conversationTables.filter((table) => table !== 'whatsapp_conversations' && table !== 'email_conversations')) {
  if (protectedConversationIds.length) {
    deletionResults.push(await deleteWhere(table, `conversation_id=not.${inFilter(protectedConversationIds)}`));
  } else {
    deletionResults.push(await deleteWhere(table, 'id=not.is.null'));
  }
}

for (const table of websiteTables.filter((table) => !businessTables.includes(table))) {
  if (protectedWebsiteIds.length) {
    deletionResults.push(await deleteWhere(table, `website_id=not.${inFilter(protectedWebsiteIds)}`));
  } else {
    deletionResults.push(await deleteWhere(table, 'id=not.is.null'));
  }
}

for (const table of customerTables.filter((table) => !businessTables.includes(table))) {
  if (protectedCustomerIds.length) {
    deletionResults.push(await deleteWhere(table, `customer_id=not.${inFilter(protectedCustomerIds)}`));
  } else {
    deletionResults.push(await deleteWhere(table, 'id=not.is.null'));
  }
}

for (const table of businessTables.filter((table) => table !== 'businesses')) {
  deletionResults.push(await deleteWhere(table, `business_id=neq.${encodeURIComponent(PROTECTED_BUSINESS_ID)}`));
}

deletionResults.push(await deleteWhere('businesses', `id=neq.${encodeURIComponent(PROTECTED_BUSINESS_ID)}`));

const removedStorage = await removeStorageObjects(storageToDelete);
const summary = {
  mode: EXECUTE ? 'execute' : 'dry-run',
  protectedBusinessId: PROTECTED_BUSINESS_ID,
  protectedCustomerIds,
  protectedWebsiteIds,
  protectedConversationIds,
  protectedStoragePaths: Array.from(protectedStoragePaths),
  storageObjects: allStoragePaths.length,
  storageObjectsPlannedForDeletion: storageToDelete.length,
  storageObjectsRemoved: EXECUTE ? removedStorage : 0,
  deletionResults,
};

fs.writeFileSync(path.join(backupDir, '_reset-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
