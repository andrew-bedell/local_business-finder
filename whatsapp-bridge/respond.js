// Claude-powered response generation for WhatsApp messages
// Uses Anthropic SDK with conversation history for multi-turn context

const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}


/**
 * Build the system prompt based on contact context.
 *
 * @param {Object|null} context — From matchContact()
 * @returns {string} Spanish system prompt
 */
function buildSystemPrompt(context) {
  let prompt = `Eres el asistente de servicio al cliente de AhoraTengoPagina por WhatsApp.

SOBRE NOSOTROS:
- Creamos páginas web profesionales para negocios locales en Latinoamérica
- Ofrecemos suscripción mensual que incluye: página web, hosting, dominio, y soporte
- Los clientes pueden pedir cambios en su página web en cualquier momento
- Portal del cliente: ahoratengopagina.com/mipagina

REGLAS:
- Responde SIEMPRE en español
- Sé amable, breve y directo (2-3 oraciones máximo)
- No te repitas si ya dijiste algo en mensajes anteriores
- Si no sabes algo, di que un asesor se comunicará pronto
- No inventes información sobre precios o servicios específicos
- Usa emojis con moderación (máximo 1-2 por mensaje)`;

  if (!context) {
    prompt += `

CONTEXTO: Este contacto es DESCONOCIDO — no lo encontramos en nuestra base de datos.
INSTRUCCIÓN: Preséntate brevemente y pregunta el nombre de su negocio y en qué ciudad se encuentra, para poder identificarlo en nuestro sistema.
- Si el usuario ya te da el nombre de su negocio Y dice que quiere una página web, incluye [START_ONBOARDING] al final de tu respuesta
- Solo incluye el marcador si el usuario expresó interés claro en tener una página web`;
    return prompt;
  }

  const name = context.contactName ? ` (contacto: ${context.contactName})` : '';
  const biz = context.businessName || 'negocio sin nombre';
  const city = context.city ? `, en ${context.city}` : '';
  const category = context.category ? ` — categoría: ${context.category}` : '';

  prompt += `

NEGOCIO: ${biz}${name}${city}${category}
ESTADO EN PIPELINE: ${context.pipelineStatus || 'desconocido'}
TIPO DE CONTACTO: ${context.contactType}`;

  if (context.websiteUrl) {
    prompt += `\nPÁGINA WEB: ${context.websiteUrl} (estado: ${context.websiteStatus || 'desconocido'})`;
  } else {
    prompt += `\nPÁGINA WEB: No tiene página web todavía`;
  }

  // If the business doesn't have a website yet, override with website pitch — regardless of contact type
  if (!context.websiteUrl) {
    prompt += `

INSTRUCCIÓN PRIORITARIA: Este negocio NO tiene página web todavía.
- Saluda mencionando que lo conoces: usa el nombre del negocio "${biz}"
- Pregúntale si le gustaría que le creemos una página web profesional para su negocio
- Menciona que podemos crear una página web GRATIS para que vea cómo quedaría
- Sé conversacional y amable — no suenes como un vendedor
- Si ya se le ofreció antes en la conversación, no repitas la oferta, continúa la conversación naturalmente

REGLA DE ACTIVACIÓN IMPORTANTE:
- Si el usuario dice claramente que SÍ quiere una página web (acepta la oferta, muestra interés claro, dice "sí", "dale", "me interesa", "quiero", etc.), incluye exactamente el texto [START_ONBOARDING] al FINAL de tu respuesta (después de tu mensaje amigable)
- NO incluyas [START_ONBOARDING] si el usuario solo hace preguntas, pide más información, o no ha aceptado claramente
- El marcador [START_ONBOARDING] debe ir en su propia línea al final, después de tu respuesta conversacional`;
    return prompt;
  }

  switch (context.contactType) {
    case 'active_customer':
      prompt += `

INSTRUCCIÓN: Este es un CLIENTE ACTIVO con suscripción pagada.
- Ayúdalo con cambios en su página, preguntas de facturación, o soporte técnico
- Si pide un cambio en su página, toma nota del cambio y dile que lo procesaremos
- Puede ver su página en: ${context.websiteUrl}
- Puede administrar su cuenta en: ahoratengopagina.com/mipagina`;
      break;

    case 'inactive_customer':
      prompt += `

INSTRUCCIÓN: Este fue un cliente pero ya no tiene suscripción activa.
- Pregunta si le gustaría reactivar su página web
- Sé amable, no presiones`;
      break;

    case 'demo':
      prompt += `

INSTRUCCIÓN: Este contacto tiene una DEMOSTRACIÓN de página web lista.
- Anímalo a revisar su página de demostración: ${context.websiteUrl}
- Pregunta qué le parece y si le gustaría activarla
- Si tiene preguntas sobre precios, dile que un asesor le dará los detalles`;
      break;

    case 'lead':
    case 'saved_business':
      prompt += `

INSTRUCCIÓN: Este es un PROSPECTO — negocio identificado pero aún no es cliente.
- Explica brevemente nuestro servicio si pregunta
- Ofrece crear una demostración gratuita de su página web
- No presiones, sé informativo y amable`;
      break;

    case 'marketing_lead':
      prompt += `

INSTRUCCIÓN: Este contacto se registró en nuestra página de marketing.
- Agradece su interés
- Ofrece mostrarle cómo quedaría su página web (demostración gratis)
- Si ya tiene dudas específicas, respóndelas`;
      break;
  }

  return prompt;
}


/**
 * Generate a response using Claude.
 *
 * @param {Object|null} context — From matchContact()
 * @param {string} inboundMessage — The message the user just sent
 * @param {Array<{role: string, content: string}>} history — Previous messages from DB
 * @returns {string} Response text to send back
 */
async function generateResponse(context, inboundMessage, history = []) {
  const anthropic = getClient();
  const systemPrompt = buildSystemPrompt(context);

  // Build messages array: history + current message
  // Ensure messages alternate user/assistant properly
  const messages = [];

  for (const msg of history) {
    // Skip if it would create consecutive same-role messages
    if (messages.length > 0 && messages[messages.length - 1].role === msg.role) {
      // Merge with previous message of same role
      messages[messages.length - 1].content += '\n' + msg.content;
    } else {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add the current inbound message
  if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
    messages[messages.length - 1].content += '\n' + inboundMessage;
  } else {
    messages.push({ role: 'user', content: inboundMessage });
  }

  // Ensure first message is from user (Claude requirement)
  if (messages.length > 0 && messages[0].role !== 'user') {
    messages.shift();
  }

  // Safety: must have at least one message
  if (messages.length === 0) {
    messages.push({ role: 'user', content: inboundMessage });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock?.text || null;
  } catch (err) {
    console.error('Claude API error:', err.message);

    if (err.status === 429) {
      console.warn('Rate limited — skipping reply');
      return null;
    }

    // Fallback: return a generic response so the user isn't left hanging
    return '¡Hola! Gracias por escribirnos. Un asesor se comunicará contigo pronto. 😊';
  }
}


module.exports = { generateResponse };
