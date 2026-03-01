export default function handler(req, res) {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || '';

  if (!googleApiKey) {
    return res.status(404).json({ error: 'API key not configured' });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ googleApiKey });
}
