// Vercel serverless function: Geo-detection endpoint
// Returns visitor's country code based on Vercel's x-vercel-ip-country header

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPPORTED = ['MX', 'CO', 'EC', 'PE', 'AR', 'CL'];

  // Allow URL param override: /api/geo?country=CO
  const override = (req.query.country || '').toUpperCase();
  if (override && SUPPORTED.includes(override)) {
    return res.status(200).json({ country: override });
  }

  const detected = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const country = SUPPORTED.includes(detected) ? detected : 'MX';

  return res.status(200).json({ country });
}
