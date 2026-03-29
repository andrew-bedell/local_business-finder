// Vercel serverless function: Onboarding page for site edits after purchase
// GET ?t=<token> — shows edit options (WhatsApp, visual editor, schedule meeting) + "Go Live" button

import { validateDomainToken, generateDomainToken } from '../_lib/domain-token.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  };

  try {
    // Fetch business name, domain info, and website
    const bizRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=id,name,outreach_steps,phone`,
      { headers: supabaseHeaders }
    );
    const bizData = await bizRes.json();
    if (!bizData || bizData.length === 0) {
      return res.status(404).send(errorPage('Negocio no encontrado.'));
    }
    const business = bizData[0];
    const domainData = (business.outreach_steps || {})._domain || {};
    const selectedDomain = domainData.customer_selected || domainData.selected || null;

    // Fetch published website for preview URL
    const webRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?business_id=eq.${encodeURIComponent(businessId)}&status=eq.published&select=id,published_url,custom_domain,domain_status&limit=1`,
      { headers: supabaseHeaders }
    );
    const webData = await webRes.json();
    const website = webData && webData.length > 0 ? webData[0] : null;
    const previewUrl = website ? website.published_url : null;

    // Generate go-live token (30-day expiry)
    const goLiveToken = generateDomainToken(businessId, 30);
    const origin = 'https://ahoratengopagina.com';
    const goLiveUrl = `${origin}/api/websites/go-live?t=${encodeURIComponent(goLiveToken)}`;
    const portalUrl = `${origin}/mipagina`;
    const whatsappPhone = '5215512345678'; // TODO: configure per-operator

    return res.status(200).send(onboardingPage({
      businessName: business.name,
      selectedDomain,
      previewUrl,
      goLiveUrl,
      portalUrl,
      whatsappPhone,
      domainPurchased: !!domainData.purchased_at,
      isAlreadyLive: website && website.custom_domain && website.domain_status === 'verified',
    }));
  } catch (err) {
    console.error('Onboarding page error:', err);
    return res.status(500).send(errorPage('Ocurrió un error. Por favor intenta de nuevo.'));
  }
}

function onboardingPage({ businessName, selectedDomain, previewUrl, goLiveUrl, portalUrl, whatsappPhone, domainPurchased, isAlreadyLive }) {
  const domainBadge = selectedDomain
    ? `<div style="text-align:center;margin:16px 0 24px"><span style="display:inline-block;background:#f0eeff;padding:10px 20px;border-radius:10px;font-size:16px;font-weight:700;color:#6C5CE7;border:2px solid #6C5CE7">${esc(selectedDomain)}</span></div>`
    : '';

  const previewLink = previewUrl
    ? `<p style="text-align:center;margin-bottom:24px"><a href="${esc(previewUrl)}" target="_blank" style="color:#6C5CE7;font-weight:600;font-size:14px">Ver vista previa de tu página actual →</a></p>`
    : '';

  const goLiveSection = isAlreadyLive
    ? `<div style="background:#e8faf0;border:2px solid #22c55e;border-radius:12px;padding:20px;text-align:center;margin-top:24px">
        <p style="font-size:16px;font-weight:700;color:#16a34a;margin:0">✅ ¡Tu página ya está en vivo!</p>
        <p style="font-size:14px;color:#4a4a66;margin:8px 0 0">${esc(selectedDomain)}</p>
      </div>`
    : `<div style="background:#f0eeff;border:2px solid #6C5CE7;border-radius:12px;padding:24px;text-align:center;margin-top:24px">
        <p style="font-size:15px;color:#4a4a66;margin:0 0 16px"><strong>¿Tu página ya está lista?</strong> Cuando estés satisfecho con los cambios, publícala en tu dominio${selectedDomain ? ` <strong>${esc(selectedDomain)}</strong>` : ''}.</p>
        <a href="${esc(goLiveUrl)}" style="display:inline-block;background:#6C5CE7;color:#ffffff !important;padding:14px 36px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none">Publicar Mi Página</a>
      </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Personaliza tu página — AhoraTengoPagina</title>
<style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .hdr { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%); padding: 32px 40px; text-align: center; }
  .hdr h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; }
  .hdr h1 span { color: #00D4AA; }
  .hdr p { margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.7); }
  .bd { padding: 40px; }
  .bd h2 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; text-align: center; }
  .bd > .subtitle { font-size: 15px; color: #4a4a66; text-align: center; margin: 0 0 28px; line-height: 1.6; }
  .option { display: flex; gap: 16px; align-items: flex-start; padding: 20px; background: #f8f8fb; border-radius: 12px; margin-bottom: 12px; border: 1px solid #e8e8ef; transition: border-color 0.2s; }
  .option:hover { border-color: #6C5CE7; }
  .option-icon { font-size: 28px; flex-shrink: 0; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: #ffffff; border-radius: 12px; border: 1px solid #e8e8ef; }
  .option-content { flex: 1; }
  .option-content h3 { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
  .option-content p { font-size: 14px; color: #4a4a66; margin: 0 0 10px; line-height: 1.5; }
  .option-btn { display: inline-block; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; }
  .btn-wa { background: #25D366; color: #fff !important; }
  .btn-editor { background: #6C5CE7; color: #fff !important; }
  .btn-meeting { background: #ffffff; color: #6C5CE7 !important; border: 2px solid #6C5CE7; }
  .ft { padding: 24px 40px; text-align: center; border-top: 1px solid #eee; }
  .ft p { font-size: 12px; color: #999; margin: 0; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="hdr">
      <h1>Ahora<span>Tengo</span>Página</h1>
      <p>${esc(businessName)}</p>
    </div>
    <div class="bd">
      <h2>Personaliza Tu Página Web</h2>
      <p class="subtitle">Antes de publicarla, puedes hacer los cambios que quieras. Elige la opción que prefieras:</p>
      ${domainBadge}
      ${previewLink}

      <div class="option">
        <div class="option-icon">💬</div>
        <div class="option-content">
          <h3>Enviar cambios por WhatsApp</h3>
          <p>Escríbenos qué quieres cambiar — texto, fotos, colores, lo que sea. Nosotros lo hacemos por ti.</p>
          <a href="https://wa.me/${esc(whatsappPhone)}?text=${encodeURIComponent('Hola, quiero hacer cambios en mi página web para ' + (businessName || 'mi negocio'))}" target="_blank" class="option-btn btn-wa">Abrir WhatsApp</a>
        </div>
      </div>

      <div class="option">
        <div class="option-icon">✏️</div>
        <div class="option-content">
          <h3>Editor visual en tu portal</h3>
          <p>Haz clic en cualquier parte de tu página y edítala directamente. Nuestro asistente de IA te ayuda con los cambios.</p>
          <a href="${esc(portalUrl)}" target="_blank" class="option-btn btn-editor">Ir al Editor</a>
        </div>
      </div>

      <div class="option">
        <div class="option-icon">📅</div>
        <div class="option-content">
          <h3>Agendar una llamada con nuestro diseñador</h3>
          <p>¿Prefieres hablar con alguien? Agenda una videollamada y haremos los cambios juntos en tiempo real.</p>
          <a href="https://wa.me/${esc(whatsappPhone)}?text=${encodeURIComponent('Hola, me gustaría agendar una llamada para personalizar mi página web de ' + (businessName || 'mi negocio'))}" target="_blank" class="option-btn btn-meeting">Agendar Llamada</a>
        </div>
      </div>

      ${goLiveSection}
    </div>
    <div class="ft">
      <p>&copy; ${new Date().getFullYear()} AhoraTengoPagina. Todos los derechos reservados.</p>
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
  .body h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
  .body p { font-size: 15px; line-height: 1.6; color: #4a4a66; margin: 0 0 16px; }
</style>
</head>
<body>
<div class="card">
  <div class="header"><h1>Ahora<span>Tengo</span>Página</h1></div>
  <div class="body">
    <h2>Algo salió mal</h2>
    <p>${message}</p>
    <p style="font-size:14px;color:#888">Escríbenos a <a href="mailto:soporte@ahoratengopagina.com" style="color:#6C5CE7">soporte@ahoratengopagina.com</a></p>
  </div>
</div>
</body>
</html>`;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
