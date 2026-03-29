// Porkbun API helpers — domain registration and DNS management

const PORKBUN_API = 'https://api.porkbun.com/api/json/v3';

function getCredentials() {
  const apiKey = process.env.PORKBUN_API_KEY;
  const apiSecret = process.env.PORKBUN_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('Porkbun API not configured');
  return { apikey: apiKey, secretapikey: apiSecret };
}

// Register (purchase) a domain — 1 year, with ID protection
export async function registerDomain(domain) {
  const creds = getCredentials();
  const resp = await fetch(`${PORKBUN_API}/domain/register/${domain}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, years: 1, idProtection: 'yes' }),
  });

  const data = await resp.json();
  if (data.status !== 'SUCCESS') {
    throw new Error(`Porkbun registration failed: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

// Create a DNS record on a Porkbun-registered domain
export async function createDnsRecord(domain, { type, name, content, ttl }) {
  const creds = getCredentials();
  const resp = await fetch(`${PORKBUN_API}/dns/create/${domain}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, type, name: name || '', content, ttl: String(ttl || 600) }),
  });

  const data = await resp.json();
  if (data.status !== 'SUCCESS') {
    throw new Error(`Porkbun DNS create failed: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

// Full setup: register domain + configure DNS for Vercel
export async function purchaseAndConfigureDomain(domain) {
  // 1. Register the domain
  const regResult = await registerDomain(domain);

  // 2. Set DNS records for Vercel
  // A record for apex domain → Vercel's IP
  await createDnsRecord(domain, {
    type: 'A',
    name: '',
    content: '76.76.21.21',
    ttl: 600,
  });

  // CNAME for www subdomain → Vercel
  await createDnsRecord(domain, {
    type: 'CNAME',
    name: 'www',
    content: 'cname.vercel-dns.com',
    ttl: 600,
  });

  return { registered: true, domain, registration: regResult };
}
