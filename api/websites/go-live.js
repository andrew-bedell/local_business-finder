// Vercel serverless function: Customer approves site and goes live with custom domain
// GET ?t=<token> — validates token, adds domain to Vercel, publishes, sends "site live" email

import { validateDomainToken } from '../_lib/domain-token.js';
import { sendEmail } from '../_lib/sendgrid.js';
import { siteLiveEmail } from '../_lib/email-templates.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).send(errorPage('Servicio no disponible'));
  }

  const { t: token } = req.query;
  if (!token) {
    return res.status(400).send(errorPage('Enlace inválido.'));
  }

  const tokenData = validateDomainToken(token);
  if (!tokenData) {
    return res.status(403).send(errorPage('Este enlace ha expirado o es inválido. Contáctanos para obtener un nuevo enlace.'));
  }

  const { businessId } = tokenData;
  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    // Fetch business + domain data
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=id,name,outreach_steps`,
      { headers: supabaseHeaders }
    );
    const bizData = await bizRes.json();
    if (!bizData || bizData.length === 0) {
      return res.status(404).send(errorPage('Negocio no encontrado.'));
    }
    const business = bizData[0];
    const domainData = (business.outreach_steps || {})._domain || {};
    const selectedDomain = domainData.customer_selected || domainData.selected || null;

    // Fetch published website
    const webRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${encodeURIComponent(businessId)}&status=eq.published&select=id,published_url,custom_domain,domain_status,site_status&limit=1`,
      { headers: supabaseHeaders }
    );
    const webData = await webRes.json();
    if (!webData || webData.length === 0) {
      return res.status(404).send(errorPage('No se encontró una página web publicada para este negocio.'));
    }
    const website = webData[0];

    // Check if already live with custom domain
    if (website.custom_domain && website.domain_status === 'verified') {
      return res.status(200).send(livePage(business.name, website.custom_domain, true));
    }

    // Need a selected domain to go live with custom domain
    if (!selectedDomain) {
      return res.status(200).send(livePage(business.name, website.published_url, false, true));
    }

    // Add domain to Vercel project
    let vercelSuccess = false;
    if (vercelToken && vercelProjectId) {
      try {
        const vercelRes = await fetch(
          `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: selectedDomain }),
          }
        );
        const vercelData = await vercelRes.json();
        if (vercelRes.ok || vercelData.error?.code === 'domain_already_in_use') {
          vercelSuccess = true;
        } else {
          console.error('Vercel domain add error:', vercelData);
        }
      } catch (vercelErr) {
        console.error('Vercel domain add error:', vercelErr);
      }
    }

    // Update website record with custom domain
    const websiteUpdate = {
      custom_domain: selectedDomain,
      domain_status: vercelSuccess ? 'pending_verification' : 'pending_verification',
      site_status: 'active',
    };

    await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(website.id)}`,
      {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify(websiteUpdate),
      }
    );

    // Record go-live in outreach_steps
    const steps = business.outreach_steps || {};
    const updatedSteps = {
      ...steps,
      _go_live: {
        approved_at: new Date().toISOString(),
        domain: selectedDomain,
        website_id: website.id,
      },
    };
    await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
      {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ outreach_steps: updatedSteps }),
      }
    );

    // Send "site is live" email (non-blocking)
    try {
      const custRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?business_id=eq.${encodeURIComponent(businessId)}&select=id,email,contact_name&limit=1`,
        { headers: supabaseHeaders }
      );
      const custData = await custRes.json();
      if (custData && custData.length > 0 && custData[0].email) {
        const customer = custData[0];
        const liveUrl = `https://${selectedDomain}`;
        const portalUrl = 'https://ahoratengopagina.com/mipagina';

        const emailContent = siteLiveEmail({
          contactName: customer.contact_name || '',
          businessName: business.name || '',
          domain: selectedDomain,
          liveUrl,
          portalUrl,
        });
        await sendEmail({
          to: customer.email,
          ...emailContent,
          from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
          replyTo: 'andres@ahoratengopagina.com',
        });
      }
    } catch (emailErr) {
      console.warn('Site live email error (non-blocking):', emailErr);
    }

    return res.status(200).send(livePage(business.name, selectedDomain, false));
  } catch (err) {
    console.error('Go-live error:', err);
    return res.status(500).send(errorPage('Ocurrió un error. Por favor intenta de nuevo o contáctanos.'));
  }
}

function livePage(businessName, domainOrUrl, alreadyLive, noDomain) {
  const isFullUrl = domainOrUrl && domainOrUrl.startsWith('http');
  const displayUrl = isFullUrl ? domainOrUrl : `https://${domainOrUrl}`;
  const displayDomain = isFullUrl ? domainOrUrl.replace(/^https?:\/\//, '') : domainOrUrl;

  if (noDomain) {
    return brandedPage('Tu Página Está Publicada', `
      <div style="font-size:48px;margin-bottom:16px">🌐</div>
      <h2>Tu página está publicada</h2>
      <p>Tu página para <strong>${esc(businessName)}</strong> ya está disponible en:</p>
      <div style="text-align:center;margin:16px 0 24px">
        <a href="${esc(displayUrl)}" target="_blank" style="display:inline-block;background:#f0f0f5;padding:12px 24px;border-radius:10px;font-size:16px;font-weight:700;color:#6C5CE7;text-decoration:none;word-break:break-all">${esc(displayDomain)}</a>
      </div>
      <div style="background:#f8f8fb;border-radius:10px;padding:20px;text-align:left">
        <p style="font-size:14px;color:#4a4a66;margin:0"><strong>Nota:</strong> Aún no has seleccionado un dominio personalizado. Revisa tu correo para elegir uno, o contáctanos para ayudarte.</p>
      </div>
    `);
  }

  return brandedPage('¡Tu Página Está en Vivo!', `
    <div style="font-size:48px;margin-bottom:16px">${alreadyLive ? '✅' : '🎉'}</div>
    <h2>${alreadyLive ? '¡Tu página ya está en vivo!' : '¡Felicidades! Tu página está en vivo'}</h2>
    <p>${alreadyLive
      ? `Tu página para <strong>${esc(businessName)}</strong> ya está publicada en tu dominio personalizado.`
      : `Tu página para <strong>${esc(businessName)}</strong> ahora está disponible en tu propio dominio:`
    }</p>
    <div style="text-align:center;margin:16px 0 24px">
      <a href="${esc(displayUrl)}" target="_blank" style="display:inline-block;background:#f0eeff;padding:14px 28px;border-radius:12px;font-size:20px;font-weight:800;color:#6C5CE7;text-decoration:none;border:2px solid #6C5CE7;word-break:break-all">${esc(displayDomain)}</a>
    </div>
    <div style="background:#f8f8fb;border-radius:10px;padding:20px;text-align:left">
      <p style="font-size:14px;font-weight:700;color:#1a1a2e;margin:0 0 8px">¿Qué hacer ahora?</p>
      <ul style="font-size:14px;color:#4a4a66;margin:0;padding-left:18px;line-height:1.8">
        <li>Comparte tu nueva dirección web con tus clientes</li>
        <li>Agrégala a tus redes sociales y tarjetas de presentación</li>
        <li>La verificación del dominio puede tardar hasta 24 horas</li>
      </ul>
    </div>
    ${!alreadyLive ? `<p style="font-size:13px;color:#888;margin-top:20px;text-align:center">Te enviaremos un correo de confirmación con más detalles.</p>` : ''}
  `);
}

function brandedPage(title, content) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — AhoraTengoPagina</title>
<style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .card { max-width: 520px; margin: 40px 20px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
  .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%); padding: 28px 40px; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; }
  .header h1 span { color: #00D4AA; }
  .body { padding: 40px; }
  .body h2 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
  .body p { font-size: 15px; line-height: 1.6; color: #4a4a66; margin: 0 0 16px; }
</style>
</head>
<body>
<div class="card">
  <div class="header"><h1>Ahora<span>Tengo</span>Página</h1></div>
  <div class="body">${content}</div>
</div>
</body>
</html>`;
}

function errorPage(message) {
  return brandedPage('Error', `
    <div style="font-size:48px;margin-bottom:16px">⚠️</div>
    <h2>Algo salió mal</h2>
    <p>${message}</p>
    <p style="font-size:14px;color:#888">Escríbenos a <a href="mailto:soporte@ahoratengopagina.com" style="color:#6C5CE7">soporte@ahoratengopagina.com</a></p>
  `);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
