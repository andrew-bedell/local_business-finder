export default function handler(req, res) {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';

  // Return config with whatever keys are available.
  // Google API key is optional — search works via SearchAPI.io without it.
  const config = {};
  if (googleApiKey) config.googleApiKey = googleApiKey;
  if (supabaseUrl) config.supabaseUrl = supabaseUrl;
  if (supabaseKey) config.supabaseKey = supabaseKey;
  if (stripePublishableKey) config.stripePublishableKey = stripePublishableKey;

  if (Object.keys(config).length === 0) {
    return res.status(404).json({ error: 'No server configuration available' });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json(config);
}
