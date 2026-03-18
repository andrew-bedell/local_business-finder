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

// ── Transactional Email Templates ──

export function websitePublishedEmail({ contactName, businessName, publishedUrl, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const html = baseLayout('¡Tu página web está lista!', `
    <h2>${greeting}</h2>
    <p>🎉 ¡Tu página web para <strong>${businessName || 'tu negocio'}</strong> ya está publicada y disponible para tus clientes!</p>
    <p>Tu nueva dirección web es:</p>
    <p style="background:#f0f0f5;padding:12px 16px;border-radius:8px;font-size:16px;font-weight:600;color:#6C5CE7;word-break:break-all;">
      <a href="${publishedUrl}" style="color:#6C5CE7;text-decoration:none;">${publishedUrl}</a>
    </p>
    <p>Comparte este enlace con tus clientes, agrégalo a tus redes sociales y tarjetas de presentación.</p>
    <p>Desde tu portal puedes solicitar cambios, ver estadísticas y administrar tu suscripción:</p>
    <a href="${portalUrl}" class="cta">Ir a Mi Portal</a>
    <p style="font-size:13px;color:#888;">¿Preguntas? Responde a este correo y te ayudaremos.</p>
  `);
  const text = `${greeting}\n\n¡Tu página web para ${businessName || 'tu negocio'} ya está publicada!\n\nTu dirección: ${publishedUrl}\n\nAdministra tu página: ${portalUrl}\n\n¿Preguntas? Responde a este correo.`;

  return {
    subject: `🎉 ¡Tu página web está lista! — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function paymentConfirmationEmail({ contactName, businessName, amount, currency, periodEnd }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const formattedAmount = formatCurrency(amount, currency);
  const formattedDate = formatDate(periodEnd);
  const html = baseLayout('Confirmación de pago', `
    <h2>${greeting}</h2>
    <p>Hemos recibido tu pago exitosamente. Aquí están los detalles:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:10px 0;color:#888;font-size:14px;">Negocio</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;text-align:right;">${businessName || '—'}</td>
      </tr>
      <tr style="border-top:1px solid #eee;">
        <td style="padding:10px 0;color:#888;font-size:14px;">Monto</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;text-align:right;">${formattedAmount}</td>
      </tr>
      <tr style="border-top:1px solid #eee;">
        <td style="padding:10px 0;color:#888;font-size:14px;">Próximo cobro</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;text-align:right;">${formattedDate}</td>
      </tr>
    </table>
    <p>Tu página web seguirá activa. No necesitas hacer nada.</p>
    <p style="font-size:13px;color:#888;">¿Preguntas sobre tu facturación? Responde a este correo.</p>
  `);
  const text = `${greeting}\n\nHemos recibido tu pago de ${formattedAmount} para ${businessName || 'tu negocio'}.\n\nPróximo cobro: ${formattedDate}\n\n¿Preguntas? Responde a este correo.`;

  return {
    subject: `Confirmación de pago — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function paymentFailedEmail({ contactName, businessName, amount, currency, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const formattedAmount = formatCurrency(amount, currency);
  const html = baseLayout('Problema con tu pago', `
    <h2>${greeting}</h2>
    <p>No pudimos procesar tu pago de <strong>${formattedAmount}</strong> para <strong>${businessName || 'tu negocio'}</strong>.</p>
    <p>Esto puede pasar por fondos insuficientes, tarjeta vencida u otro problema con tu método de pago.</p>
    <p><strong>¿Qué hacer?</strong></p>
    <ul style="color:#4a4a66;font-size:15px;line-height:1.8;padding-left:20px;">
      <li>Verifica que tu tarjeta esté vigente y tenga fondos</li>
      <li>Actualiza tu método de pago desde tu portal</li>
      <li>Si el problema persiste, contáctanos</li>
    </ul>
    <p>⚠️ Si no se resuelve el pago, tu página web podría ser suspendida.</p>
    <a href="${portalUrl}" class="cta">Actualizar Método de Pago</a>
    <p style="font-size:13px;color:#888;">¿Necesitas ayuda? Responde a este correo.</p>
  `);
  const text = `${greeting}\n\nNo pudimos procesar tu pago de ${formattedAmount} para ${businessName || 'tu negocio'}.\n\nActualiza tu método de pago en: ${portalUrl}\n\nSi no se resuelve, tu página web podría ser suspendida.\n\n¿Necesitas ayuda? Responde a este correo.`;

  return {
    subject: `⚠️ Problema con tu pago — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function subscriptionCancelledEmail({ contactName, businessName, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const html = baseLayout('Suscripción cancelada', `
    <h2>${greeting}</h2>
    <p>Tu suscripción para <strong>${businessName || 'tu negocio'}</strong> ha sido cancelada.</p>
    <p>Tu página web será desactivada y dejará de estar disponible para tus clientes.</p>
    <p>Si esto fue un error o cambias de opinión, puedes reactivar tu suscripción en cualquier momento:</p>
    <a href="${portalUrl}" class="cta">Reactivar Suscripción</a>
    <p style="font-size:13px;color:#888;">Lamentamos verte partir. Si hay algo que podamos mejorar, responde a este correo — tu opinión nos importa.</p>
  `);
  const text = `${greeting}\n\nTu suscripción para ${businessName || 'tu negocio'} ha sido cancelada.\n\nTu página web será desactivada.\n\nPara reactivar: ${portalUrl}\n\nSi hay algo que podamos mejorar, responde a este correo.`;

  return {
    subject: `Suscripción cancelada — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function websiteSuspendedEmail({ contactName, businessName, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const html = baseLayout('Página web suspendida', `
    <h2>${greeting}</h2>
    <p>Tu página web para <strong>${businessName || 'tu negocio'}</strong> ha sido suspendida y ya no está visible para tus clientes.</p>
    <p>Esto generalmente ocurre por un problema con tu pago. Para reactivar tu página:</p>
    <ol style="color:#4a4a66;font-size:15px;line-height:1.8;padding-left:20px;">
      <li>Accede a tu portal</li>
      <li>Actualiza tu método de pago</li>
      <li>Tu página se reactivará automáticamente</li>
    </ol>
    <a href="${portalUrl}" class="cta">Ir a Mi Portal</a>
    <p style="font-size:13px;color:#888;">¿Necesitas ayuda? Responde a este correo.</p>
  `);
  const text = `${greeting}\n\nTu página web para ${businessName || 'tu negocio'} ha sido suspendida.\n\nPara reactivarla, actualiza tu método de pago en: ${portalUrl}\n\n¿Necesitas ayuda? Responde a este correo.`;

  return {
    subject: `⚠️ Página web suspendida — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function websiteReactivatedEmail({ contactName, businessName, publishedUrl, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const html = baseLayout('¡Página web reactivada!', `
    <h2>${greeting}</h2>
    <p>¡Buenas noticias! Tu página web para <strong>${businessName || 'tu negocio'}</strong> ha sido reactivada y ya está disponible nuevamente.</p>
    <p>Tu página: <a href="${publishedUrl}" style="color:#6C5CE7;">${publishedUrl}</a></p>
    <a href="${portalUrl}" class="cta">Ir a Mi Portal</a>
    <p style="font-size:13px;color:#888;">Gracias por continuar con nosotros. ¿Preguntas? Responde a este correo.</p>
  `);
  const text = `${greeting}\n\n¡Tu página web para ${businessName || 'tu negocio'} ha sido reactivada!\n\nTu página: ${publishedUrl}\n\nPortal: ${portalUrl}\n\n¿Preguntas? Responde a este correo.`;

  return {
    subject: `✅ ¡Página web reactivada! — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function editRequestReceivedEmail({ contactName, businessName, requestType, description }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const typeLabels = {
    content_update: 'Actualización de contenido',
    photo_update: 'Actualización de fotos',
    contact_update: 'Actualización de contacto',
    hours_update: 'Actualización de horarios',
    menu_update: 'Actualización de menú',
    design_change: 'Cambio de diseño',
    other: 'Otro',
  };
  const typeLabel = typeLabels[requestType] || requestType || 'Solicitud';
  const html = baseLayout('Solicitud recibida', `
    <h2>${greeting}</h2>
    <p>Hemos recibido tu solicitud de cambio para <strong>${businessName || 'tu negocio'}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:10px 0;color:#888;font-size:14px;">Tipo</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;text-align:right;">${typeLabel}</td>
      </tr>
      <tr style="border-top:1px solid #eee;">
        <td style="padding:10px 0;color:#888;font-size:14px;">Descripción</td>
        <td style="padding:10px 0;font-size:14px;text-align:right;">${(description || '').substring(0, 200)}</td>
      </tr>
    </table>
    <p>Nuestro equipo revisará tu solicitud y te notificaremos cuando los cambios estén listos.</p>
    <p style="font-size:13px;color:#888;">Tiempo estimado: 1–3 días hábiles.</p>
  `);
  const text = `${greeting}\n\nHemos recibido tu solicitud de cambio (${typeLabel}) para ${businessName || 'tu negocio'}.\n\nDescripción: ${(description || '').substring(0, 200)}\n\nTe notificaremos cuando los cambios estén listos. Tiempo estimado: 1–3 días hábiles.`;

  return {
    subject: `Solicitud recibida — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function editRequestCompletedEmail({ contactName, businessName, requestType, publishedUrl, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const typeLabels = {
    content_update: 'Actualización de contenido',
    photo_update: 'Actualización de fotos',
    contact_update: 'Actualización de contacto',
    hours_update: 'Actualización de horarios',
    menu_update: 'Actualización de menú',
    design_change: 'Cambio de diseño',
    other: 'Otro',
  };
  const typeLabel = typeLabels[requestType] || requestType || 'Solicitud';
  const html = baseLayout('¡Cambios realizados!', `
    <h2>${greeting}</h2>
    <p>✅ Los cambios que solicitaste para <strong>${businessName || 'tu negocio'}</strong> ya están publicados.</p>
    <p><strong>Tipo:</strong> ${typeLabel}</p>
    <p>Revisa tu página web para confirmar que todo se ve bien:</p>
    <a href="${publishedUrl}" class="cta">Ver Mi Página Web</a>
    <p>Si necesitas más cambios, puedes solicitarlos desde tu portal:</p>
    <p><a href="${portalUrl}" style="color:#6C5CE7;font-size:14px;">Ir a Mi Portal →</a></p>
    <p style="font-size:13px;color:#888;">¿Algo no se ve bien? Responde a este correo y lo corregimos.</p>
  `);
  const text = `${greeting}\n\n¡Los cambios (${typeLabel}) para ${businessName || 'tu negocio'} ya están publicados!\n\nRevisa tu página: ${publishedUrl}\n\nPortal: ${portalUrl}\n\n¿Algo no se ve bien? Responde a este correo.`;

  return {
    subject: `✅ ¡Cambios realizados! — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function editRequestRejectedEmail({ contactName, businessName, requestType, rejectionReason, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const typeLabels = {
    content_update: 'Actualización de contenido',
    photo_update: 'Actualización de fotos',
    contact_update: 'Actualización de contacto',
    hours_update: 'Actualización de horarios',
    menu_update: 'Actualización de menú',
    design_change: 'Cambio de diseño',
    other: 'Otro',
  };
  const typeLabel = typeLabels[requestType] || requestType || 'Solicitud';
  const html = baseLayout('Solicitud no aprobada', `
    <h2>${greeting}</h2>
    <p>Revisamos tu solicitud de cambio para <strong>${businessName || 'tu negocio'}</strong>, pero no pudimos aprobarla en este momento.</p>
    <p><strong>Tipo:</strong> ${typeLabel}</p>
    ${rejectionReason ? `<p><strong>Motivo:</strong> ${rejectionReason}</p>` : ''}
    <p>Puedes enviar una nueva solicitud con más detalles o contactarnos para discutir alternativas:</p>
    <a href="${portalUrl}" class="cta">Ir a Mi Portal</a>
    <p style="font-size:13px;color:#888;">¿Preguntas? Responde a este correo y te ayudaremos.</p>
  `);
  const text = `${greeting}\n\nTu solicitud de cambio (${typeLabel}) para ${businessName || 'tu negocio'} no fue aprobada.\n\n${rejectionReason ? `Motivo: ${rejectionReason}\n\n` : ''}Puedes enviar una nueva solicitud desde: ${portalUrl}\n\n¿Preguntas? Responde a este correo.`;

  return {
    subject: `Solicitud no aprobada — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

export function planChangeEmail({ contactName, businessName, oldPlan, newPlan, newAmount, currency, portalUrl }) {
  const greeting = contactName ? `Hola ${contactName},` : 'Hola,';
  const formattedAmount = formatCurrency(newAmount, currency);
  const html = baseLayout('Plan actualizado', `
    <h2>${greeting}</h2>
    <p>Tu plan para <strong>${businessName || 'tu negocio'}</strong> ha sido actualizado.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${oldPlan ? `<tr>
        <td style="padding:10px 0;color:#888;font-size:14px;">Plan anterior</td>
        <td style="padding:10px 0;font-size:14px;text-align:right;">${oldPlan}</td>
      </tr>` : ''}
      <tr style="border-top:1px solid #eee;">
        <td style="padding:10px 0;color:#888;font-size:14px;">Nuevo plan</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;text-align:right;">${newPlan || '—'}</td>
      </tr>
      <tr style="border-top:1px solid #eee;">
        <td style="padding:10px 0;color:#888;font-size:14px;">Nuevo precio</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;text-align:right;">${formattedAmount}/mes</td>
      </tr>
    </table>
    <p>Los cambios se aplican inmediatamente. Puedes ver los detalles de tu suscripción en tu portal:</p>
    <a href="${portalUrl}" class="cta">Ir a Mi Portal</a>
    <p style="font-size:13px;color:#888;">¿Preguntas? Responde a este correo.</p>
  `);
  const text = `${greeting}\n\nTu plan para ${businessName || 'tu negocio'} ha sido actualizado.\n\n${oldPlan ? `Plan anterior: ${oldPlan}\n` : ''}Nuevo plan: ${newPlan || '—'}\nNuevo precio: ${formattedAmount}/mes\n\nPortal: ${portalUrl}\n\n¿Preguntas? Responde a este correo.`;

  return {
    subject: `Plan actualizado — ${businessName || 'AhoraTengoPagina'}`,
    html,
    text,
  };
}

// ── Helpers ──

function formatCurrency(amount, currency) {
  if (!amount && amount !== 0) return '—';
  const curr = (currency || 'USD').toUpperCase();
  const symbols = { USD: '$', MXN: '$', COP: '$', EUR: '€' };
  const symbol = symbols[curr] || curr + ' ';
  // Stripe amounts are in cents
  const value = typeof amount === 'number' && amount > 100 ? (amount / 100).toFixed(2) : parseFloat(amount).toFixed(2);
  return `${symbol}${value} ${curr}`;
}

function formatDate(dateInput) {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'number'
      ? new Date(dateInput * 1000)  // Unix timestamp
      : new Date(dateInput);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
}
