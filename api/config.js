export default function handler(req, res) {
  const googleBrowserApiKey = process.env.GOOGLE_MAPS_BROWSER_API_KEY || process.env.GOOGLE_BROWSER_API_KEY || '';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';

  // Return config with whatever keys are available.
  // Never expose the server-side Places key here.
  const config = {};
  if (googleBrowserApiKey) config.googleApiKey = googleBrowserApiKey;
  if (supabaseUrl) config.supabaseUrl = supabaseUrl;
  if (supabaseKey) config.supabaseKey = supabaseKey;
  if (stripePublishableKey) config.stripePublishableKey = stripePublishableKey;

  if (Object.keys(config).length === 0) {
    return res.status(404).json({ error: 'No server configuration available' });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json(config);
}
