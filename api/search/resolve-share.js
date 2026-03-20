// Vercel serverless function: Resolve share.google URLs via headless browser
// share.google uses a JS redirect that server-side fetch() cannot follow.
// This endpoint launches headless Chromium, renders the page, and captures
// the final Google Maps URL containing the exact place identifier.

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing required parameter: url' });

  // Only allow share.google URLs — reject arbitrary browsing
  if (!url.includes('share.google')) {
    return res.status(400).json({ error: 'Only share.google URLs are supported' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Block images, CSS, fonts for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set a reasonable user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Navigate to the share URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    let currentUrl = page.url();

    // If still on share.google, wait for the JS redirect
    if (currentUrl.includes('share.google')) {
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        currentUrl = page.url();
      } catch (_) {
        // Navigation timeout — check URL anyway
        currentUrl = page.url();
      }
    }

    // Handle Google consent page (cookie banner)
    if (currentUrl.includes('consent.google')) {
      try {
        // Try clicking the accept button
        const acceptBtn = await page.$('button[aria-label="Accept all"], form[action*="consent"] button');
        if (acceptBtn) {
          await acceptBtn.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
          currentUrl = page.url();
        }
      } catch (_) {
        // Consent handling failed, continue with what we have
        currentUrl = page.url();
      }
    }

    // Detect CAPTCHA
    if (currentUrl.includes('/sorry/') || currentUrl.includes('google.com/sorry')) {
      return res.status(429).json({ error: 'CAPTCHA detected — too many requests' });
    }

    // Check if we got a useful Maps URL
    if (currentUrl.includes('share.google') || currentUrl === url) {
      return res.status(422).json({ error: 'Could not resolve share URL — JS redirect did not complete' });
    }

    return res.status(200).json({ resolved_url: currentUrl });
  } catch (err) {
    console.error('resolve-share error:', err.message);
    return res.status(500).json({ error: 'Failed to resolve share URL: ' + err.message });
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
}
