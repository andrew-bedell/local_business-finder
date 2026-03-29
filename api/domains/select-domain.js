// Vercel serverless function: Handle domain selection from email link
// GET ?t=<token>&d=<domain> — validates token, records selection, shows confirmation

import { validateDomainToken } from '../_lib/domain-token.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).send(errorPage('Servicio no disponible'));
  }

  const { t: token, d: domain } = req.query;

  if (!token || !domain) {
    return res.status(400).send(errorPage('Enlace inválido. Verifica que copiaste el enlace completo del correo.'));
  }

  // Validate token
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
    // Fetch business to get current outreach_steps and name
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=id,name,outreach_steps`,
      { headers: supabaseHeaders }
    );
    const bizData = await bizRes.json();
    if (!bizData || bizData.length === 0) {
      return res.status(404).send(errorPage('Negocio no encontrado.'));
    }
    const business = bizData[0];
    const steps = business.outreach_steps || {};
    const domainData = steps._domain || {};

    // Check if already selected
    if (domainData.customer_selected) {
      return res.status(200).send(confirmationPage(
        business.name,
        domainData.customer_selected,
        true // already selected
      ));
    }

    // Validate the domain is one of the suggestions
    const suggestions = domainData.suggestions || [];
    const isValidChoice = suggestions.some(s => s.domain === domain);
    if (!isValidChoice) {
      return res.status(400).send(errorPage('Este dominio no es una opción válida. Por favor selecciona uno de los dominios del correo.'));
    }

    // Record the selection in outreach_steps._domain
    const updatedDomain = {
      ...domainData,
      selected: domain,
      customer_selected: domain,
      customer_selected_at: new Date().toISOString(),
    };
    const updatedSteps = { ...steps, _domain: updatedDomain };

    await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
      {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ outreach_steps: updatedSteps }),
      }
    );

    return res.status(200).send(confirmationPage(business.name, domain, false));
  } catch (err) {
    console.error('Domain select error:', err);
    return res.status(500).send(errorPage('Ocurrió un error. Por favor intenta de nuevo o contáctanos.'));
  }
}

function confirmationPage(businessName, domain, alreadySelected) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dominio Seleccionado — AhoraTengoPagina</title>
<style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .card { max-width: 480px; margin: 40px 20px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
  .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%); padding: 28px 40px; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; }
  .header h1 span { color: #00D4AA; }
  .body { padding: 40px; }
  .check { font-size: 48px; margin-bottom: 16px; }
  .body h2 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
  .body p { font-size: 15px; line-height: 1.6; color: #4a4a66; margin: 0 0 16px; }
  .domain-badge { display: inline-block; background: #f0f0f5; padding: 12px 24px; border-radius: 10px; font-size: 18px; font-weight: 700; color: #6C5CE7; margin: 8px 0 24px; word-break: break-all; }
  .info { background: #f8f8fb; border-radius: 10px; padding: 20px; margin-top: 8px; text-align: left; }
  .info p { font-size: 14px; color: #4a4a66; margin: 0 0 8px; }
  .info p:last-child { margin-bottom: 0; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Ahora<span>Tengo</span>Página</h1>
  </div>
  <div class="body">
    <div class="check">${alreadySelected ? '✅' : '🎉'}</div>
    <h2>${alreadySelected ? '¡Dominio ya seleccionado!' : '¡Excelente elección!'}</h2>
    <p>${alreadySelected
      ? `Ya habías seleccionado tu dominio para <strong>${esc(businessName)}</strong>.`
      : `Has seleccionado el dominio para <strong>${esc(businessName)}</strong>:`
    }</p>
    <div class="domain-badge">${esc(domain)}</div>
    <div class="info">
      <p><strong>¿Qué sigue?</strong></p>
      <p>Nuestro equipo registrará tu dominio y lo conectará a tu página web. Te notificaremos por correo cuando esté listo.</p>
      <p>Este proceso normalmente toma 1–2 días hábiles.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Error — AhoraTengoPagina</title>
<style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .card { max-width: 480px; margin: 40px 20px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
  .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%); padding: 28px 40px; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; }
  .header h1 span { color: #00D4AA; }
  .body { padding: 40px; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  .body h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
  .body p { font-size: 15px; line-height: 1.6; color: #4a4a66; margin: 0 0 16px; }
  .contact { font-size: 14px; color: #888; }
  .contact a { color: #6C5CE7; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Ahora<span>Tengo</span>Página</h1>
  </div>
  <div class="body">
    <div class="icon">⚠️</div>
    <h2>Algo salió mal</h2>
    <p>${message}</p>
    <p class="contact">¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@ahoratengopagina.com">soporte@ahoratengopagina.com</a></p>
  </div>
</div>
</body>
</html>`;
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
