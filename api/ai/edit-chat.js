// Vercel serverless function: AI-powered website edit chat assistant
// POST — receives conversation messages + element context, streams Claude response via SSE
// Uses tool calling to generate structured edit requests

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Anthropic API key not configured' });
  }

  const { messages, elementContext, businessName, websiteId } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing required field: messages' });
  }

  // Build system prompt with context
  let systemPrompt = `Eres un asistente de edición de páginas web para pequeños negocios en México. Tu trabajo es ayudar al cliente a describir qué cambios quiere hacer en su página web.

REGLAS IMPORTANTES:
- Responde SIEMPRE en español
- Sé amable, breve y claro
- Cuando entiendas claramente qué quiere cambiar el cliente, usa la herramienta "submit_edit_request" para crear una solicitud estructurada
- Si el pedido es vago, haz UNA pregunta de clarificación antes de enviar la solicitud
- No hagas más de una pregunta a la vez
- Mantén tus respuestas cortas (2-3 oraciones máximo)
- No ofrezcas opciones largas — sugiere la mejor acción directamente`;

  if (businessName) {
    systemPrompt += `\n\nEl negocio del cliente se llama "${businessName}".`;
  }

  if (elementContext) {
    systemPrompt += `\n\nEl cliente ha seleccionado un elemento de su página web:`;
    systemPrompt += `\n- Tipo de elemento: ${elementContext.elementType || 'desconocido'}`;
    systemPrompt += `\n- Etiqueta HTML: ${elementContext.tagName || 'desconocido'}`;
    if (elementContext.currentValue) {
      const preview = elementContext.currentValue.substring(0, 200);
      systemPrompt += `\n- Contenido actual: "${preview}"`;
    }
    if (elementContext.selector) {
      systemPrompt += `\n- Selector CSS: ${elementContext.selector}`;
    }
  }

  // Tool definition for structured edit request
  const tools = [
    {
      name: 'submit_edit_request',
      description: 'Envía una solicitud de edición estructurada cuando entiendas claramente qué cambio quiere el cliente. Usa esta herramienta cuando tengas suficiente información para crear la solicitud.',
      input_schema: {
        type: 'object',
        properties: {
          request_type: {
            type: 'string',
            enum: ['content_update', 'photo_update', 'contact_update', 'hours_update', 'menu_update', 'design_change', 'other'],
            description: 'Tipo de cambio solicitado',
          },
          description: {
            type: 'string',
            description: 'Descripción clara y detallada del cambio en español, incluyendo qué elemento cambiar y cuál es el nuevo contenido',
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high'],
            description: 'Prioridad del cambio. Usa "normal" por defecto, "high" solo si el cliente lo pide urgente',
          },
          element_type: {
            type: 'string',
            description: 'Tipo de elemento web (heading, text, image, button, section)',
          },
          element_selector: {
            type: 'string',
            description: 'Selector CSS del elemento a modificar',
          },
          current_value: {
            type: 'string',
            description: 'El valor actual del elemento que se va a cambiar',
          },
        },
        required: ['request_type', 'description'],
      },
    },
  ];

  // Sanitize messages — only pass role and content
  const sanitizedMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: typeof m.content === 'string' ? m.content.substring(0, 2000) : '',
  })).filter(m => m.content);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        tools,
        messages: sanitizedMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);

      if (response.status === 429) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' });
      }
      if (response.status === 529) {
        return res.status(529).json({ error: 'El servicio de IA está temporalmente saturado. Intenta de nuevo.' });
      }
      return res.status(502).json({ error: 'Error al conectar con el servicio de IA' });
    }

    // Forward SSE stream to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    console.error('Edit chat error:', err);
    if (res.headersSent) {
      res.end();
    } else {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
