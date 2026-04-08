// Vercel serverless function: Serve the demo landing page HTML
// Workaround for Vercel not serving demo-landing/index.html as a static file

import { readFileSync } from 'fs';
import { join } from 'path';

let cachedHtml;

function getHtml() {
  if (!cachedHtml) {
    cachedHtml = readFileSync(join(process.cwd(), 'demo-landing', 'index.html'), 'utf8');
  }
  return cachedHtml;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const html = getHtml();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (err) {
    console.error('Failed to read demo landing HTML:', err);
    res.status(500).send('Internal server error');
  }
}
