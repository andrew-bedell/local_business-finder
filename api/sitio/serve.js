// Vercel serverless function: Serve published websites as full HTML pages
// GET — serves website HTML by slug or custom domain

import { escapeRegExp, formatBusinessName } from '../_lib/format-business-name.js';
import { getWebsiteHtml } from '../_lib/website-config.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).send('Service not configured');
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    let website = null;
    let business = null;

    // Check if this is a custom domain request
    const host = req.headers.host || '';
    const isCustomDomain = host &&
      !host.includes('ahoratengopagina.com') &&
      !host.includes('vercel.app') &&
      !host.includes('localhost') &&
      !host.includes('127.0.0.1');

    if (isCustomDomain) {
      // Look up by custom domain
      const domainRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?custom_domain=eq.${encodeURIComponent(host)}&domain_status=eq.verified&select=*,businesses(id,name,slug)`,
        { headers: supabaseHeaders }
      );
      const domainData = await domainRes.json();
      if (domainData && domainData.length > 0) {
        website = domainData[0];
        business = website.businesses;
      }
    } else {
      // Look up by slug from query param
      const slug = req.query.slug;
      if (!slug) {
        return res.status(400).send(notFoundPage());
      }

      // Find business by slug, then get its published website
      const bizRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug`,
        { headers: supabaseHeaders }
      );
      const bizData = await bizRes.json();
      if (!bizData || bizData.length === 0) {
        return res.status(404).send(notFoundPage());
      }
      business = bizData[0];

      // Get the latest published website for this business
      const webRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${business.id}&status=eq.published&order=created_at.desc&limit=1`,
        { headers: supabaseHeaders }
      );
      const webData = await webRes.json();
      if (!webData || webData.length === 0) {
        return res.status(404).send(notFoundPage());
      }
      website = webData[0];
    }

    if (!website) {
      return res.status(404).send(notFoundPage());
    }

    // Check site_status for suspension
    if (website.site_status === 'suspended') {
      return res.status(200).send(suspendedPage(business ? business.name : ''));
    }

    // Extract HTML from config
    const html = getWebsiteHtml(website.config);
    if (!html) {
      return res.status(404).send(notFoundPage());
    }

    // Inject analytics tracking script before </body>
    const trackingScript = `
<script>
(function(){
  var bid = ${business ? business.id : 'null'};
  var wid = '${website.id}';
  if (!bid) return;
  function track(type, meta) {
    var payload = {
      business_id: bid,
      website_id: wid,
      event_type: type,
      page_url: location.href,
      referrer: document.referrer ? (new URL(document.referrer)).hostname : null,
      device_type: /Mobi/i.test(navigator.userAgent) ? 'mobile' : (/Tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop'),
      metadata: meta || {}
    };
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload));
    } else {
      fetch('/api/analytics/track', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(function(){});
    }
  }
  track('page_view');
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.href || '';
    if (href.startsWith('tel:')) track('click_phone', { phone: href });
    else if (href.startsWith('mailto:')) track('click_email', { email: href });
    else if (href.includes('maps.google') || href.includes('goo.gl/maps') || href.includes('maps.app')) track('click_directions');
    else if (href.includes('facebook.com') || href.includes('instagram.com') || href.includes('wa.me') || href.includes('whatsapp.com')) track('click_social', { platform: href });
  });
  document.addEventListener('submit', function(e) {
    track('form_submit', { formId: e.target.id || null });
  });
})();
</script>`;

    const finalHtml = applyPublishedSiteFixups(
      html.includes('</body>')
      ? html.replace('</body>', trackingScript + '\n</body>')
      : html + trackingScript,
      business
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(finalHtml);
  } catch (err) {
    console.error('Serve website error:', err);
    return res.status(500).send(notFoundPage());
  }
}

function applyPublishedSiteFixups(html, business) {
  let output = String(html || '');
  const rawName = String(business?.name || '').trim();
  const formattedName = formatBusinessName(rawName);

  if (rawName && formattedName && rawName !== formattedName) {
    output = output.replace(new RegExp(escapeRegExp(rawName), 'g'), formattedName);
  }

  const navFixupCss = `
<style id="atp-site-fixups">
  .site-nav__logo {
    max-width: min(32rem, 42vw) !important;
    font-size: clamp(1.05rem, 0.8rem + 0.8vw, 1.4rem) !important;
    white-space: normal !important;
    overflow-wrap: anywhere;
    text-wrap: balance;
    line-height: 1.15;
  }

  .site-nav__cta,
  .site-nav__cta:visited,
  .site-nav__cta:hover,
  .site-nav__cta:focus,
  .site-nav__cta span {
    color: var(--color-text-light, #fff) !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.22);
  }

  .site-nav__cta {
    isolation: isolate;
    position: relative;
  }
<\/style>`;

  if (output.includes('</head>')) {
    output = output.replace('</head>', navFixupCss + '\n</head>');
  } else {
    output = navFixupCss + output;
  }

  return output;
}

function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página no encontrada — AhoraTengoPagina</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0f; color: #f0f0f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .wrap { max-width: 420px; padding: 40px 24px; }
    h1 { font-size: 64px; margin: 0 0 16px; opacity: 0.3; }
    h2 { font-size: 22px; margin: 0 0 12px; font-weight: 700; }
    p { color: #6b6b8a; font-size: 15px; line-height: 1.6; margin: 0 0 32px; }
    a { color: #6C5CE7; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>404</h1>
    <h2>Página no encontrada</h2>
    <p>Lo sentimos, esta página no existe o ya no está disponible.</p>
    <a href="https://ahoratengopagina.com">Ir a AhoraTengoPagina</a>
  </div>
</body>
</html>`;
}

function suspendedPage(businessName) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName ? businessName + ' — ' : ''}Sitio temporalmente no disponible</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0f; color: #f0f0f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .wrap { max-width: 420px; padding: 40px 24px; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h2 { font-size: 22px; margin: 0 0 12px; font-weight: 700; }
    p { color: #6b6b8a; font-size: 15px; line-height: 1.6; margin: 0 0 32px; }
    a { color: #6C5CE7; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="icon">🔒</div>
    <h2>Sitio temporalmente no disponible</h2>
    <p>Esta página web está temporalmente suspendida. Si eres el dueño del negocio, contacta a tu proveedor de servicio.</p>
    <a href="https://ahoratengopagina.com">AhoraTengoPagina</a>
  </div>
</body>
</html>`;
}
