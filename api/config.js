export default function handler(req, res) {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  if (!googleApiKey) {
    return res.status(404).json({ error: 'API key not configured' });
  }

  const config = { googleApiKey };
  if (supabaseUrl) config.supabaseUrl = supabaseUrl;
  if (supabaseKey) config.supabaseKey = supabaseKey;

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json(config);
}
