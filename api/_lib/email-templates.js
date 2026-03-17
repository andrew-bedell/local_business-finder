// HTML email templates — all Spanish (customer-facing) or bilingual where noted
// Each function returns { subject, html, text }

function baseLayout(title, content) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrapper { width: 100%; background: #f4f4f7; padding: 40px 0; }
  .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%); padding: 32px 40px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; }
  .header h1 span { color: #00D4AA; }
  .body { padding: 40px; }
  .body h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px; }
  .body p { font-size: 15px; line-height: 1.6; color: #4a4a66; margin: 0 0 16px; }
  .cta { display: inline-block; background: #6C5CE7; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; margin: 8px 0 24px; }
  .footer { padding: 24px 40px; text-align: center; border-top: 1px solid #eee; }
  .footer p { font-size: 12px; color: #999; margin: 0; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1>Ahora<span>Tengo</span>Página</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} AhoraTengoPagina. Todos los derechos reservados.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function employeeInviteEmail({ displayName, email, inviteUrl }) {
  const greeting = displayName ? `Hola ${displayName},` : 'Hola,';
  const html = baseLayout('Invitación al equipo', `
    <h2>${greeting}</h2>
    <p>Has sido invitado al equipo de <strong>Local Business Finder</strong>.</p>
    <p>Haz clic en el botón para configurar tu contraseña y acceder al panel de administración.</p>
    <a href="${inviteUrl}" class="cta">Aceptar Invitación</a>
    <p style="font-size:13px;color:#888;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
  `);
  const text = `${greeting}\n\nHas sido invitado al equipo de Local Business Finder.\n\nAccede aquí: ${inviteUrl}\n\nSi no esperabas esta invitación, puedes ignorar este correo.`;

  return {
    subject: 'Has sido invitado al equipo — Local Business Finder',
    html,
    text,
  };
}

export function customerWelcomeEmail({ contactName, businessName, loginUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const html = baseLayout('Bienvenido a AhoraTengoPagina', `
    <h2>${greeting}</h2>
    <p>¡Bienvenido a <strong>AhoraTengoPagina</strong>! Tu suscripción para <strong>${businessName || 'tu negocio'}</strong> está activa.</p>
    <p>Desde tu portal puedes:</p>
    <ul style="color:#4a4a66;font-size:15px;line-height:1.8;padding-left:20px;">
      <li>Ver y administrar tu página web</li>
      <li>Solicitar cambios y actualizaciones</li>
      <li>Administrar tu facturación</li>
      <li>Invitar a tu equipo</li>
    </ul>
    <p>Revisa tu correo para el enlace de configuración de contraseña, luego inicia sesión en tu portal:</p>
    <a href="${loginUrl}" class="cta">Ir a Mi Portal</a>
    <p style="font-size:13px;color:#888;">¿Preguntas? Responde a este correo o escríbenos a soporte@ahoratengopagina.com</p>
  `);
  const text = `${greeting}\n\n¡Bienvenido a AhoraTengoPagina! Tu suscripción para ${businessName || 'tu negocio'} está activa.\n\nAccede a tu portal: ${loginUrl}\n\n¿Preguntas? Escríbenos a soporte@ahoratengopagina.com`;

  return {
    subject: `¡Bienvenido a AhoraTengoPagina, ${contactName || 'nuevo cliente'}!`,
    html,
    text,
  };
}

export function customerTeamInviteEmail({ inviterName, businessName, email, inviteUrl }) {
  const html = baseLayout('Invitación al portal', `
    <h2>Hola,</h2>
    <p><strong>${inviterName || 'El administrador'}</strong> te ha invitado al portal de <strong>${businessName || 'su negocio'}</strong> en AhoraTengoPagina.</p>
    <p>Haz clic en el botón para configurar tu contraseña y acceder al portal de administración.</p>
    <a href="${inviteUrl}" class="cta">Aceptar Invitación</a>
    <p style="font-size:13px;color:#888;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
  `);
  const text = `Hola,\n\n${inviterName || 'El administrador'} te ha invitado al portal de ${businessName || 'su negocio'} en AhoraTengoPagina.\n\nConfigura tu contraseña aquí: ${inviteUrl}\n\nSi no esperabas esta invitación, puedes ignorar este correo.`;

  return {
    subject: `Te han invitado al portal de ${businessName || 'un negocio'} — AhoraTengoPagina`,
    html,
    text,
  };
}
