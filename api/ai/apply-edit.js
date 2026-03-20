// Vercel serverless function: AI agent that applies HTML edits to a website
// POST — takes an edit request ID, loads website HTML, sends to Claude for modification,
// saves draft HTML, updates status, and sends email notification
//
// New statuses: processing → ready_for_review (or back to submitted on error)

import { sendEmail } from '../_lib/sendgrid.js';
import { getTemplateForTrigger } from '../_lib/email-templates.js';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(503).json({ error: 'Anthropic API key not configured' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: 'Supabase not configured' });

  const { editRequestId } = req.body || {};
  if (!editRequestId) return res.status(400).json({ error: 'Missing required field: editRequestId' });

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  let editRequest = null;

  try {
    // 1. Fetch the edit request
    const erRes = await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}&select=*`,
      { headers: supabaseHeaders }
    );
    const erData = await erRes.json();
    if (!erData || erData.length === 0) {
      return res.status(404).json({ error: 'Edit request not found' });
    }
    editRequest = erData[0];

    // 2. Fetch the website's config (contains html)
    const websiteId = editRequest.website_id;
    if (!websiteId) {
      return res.status(400).json({ error: 'Edit request has no associated website' });
    }

    const webRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=id,config,business_id,businesses(id,name)`,
      { headers: supabaseHeaders }
    );
    const webData = await webRes.json();
    if (!webData || webData.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }
    const website = webData[0];
    const currentHtml = website.config?.html;
    if (!currentHtml) {
      return res.status(400).json({ error: 'Website has no HTML content' });
    }

    // 3. Update edit request status to 'processing'
    await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'processing' }),
      }
    );

    // 4. Build context for Claude
    let editContext = `Descripción del cambio solicitado: ${editRequest.description}`;
    if (editRequest.element_type) editContext += `\nTipo de elemento: ${editRequest.element_type}`;
    if (editRequest.element_selector) editContext += `\nSelector CSS: ${editRequest.element_selector}`;
    if (editRequest.current_value) editContext += `\nValor actual del elemento: ${editRequest.current_value}`;

    // Include AI conversation history if present
    if (editRequest.ai_conversation && Array.isArray(editRequest.ai_conversation)) {
      const convoSummary = editRequest.ai_conversation
        .filter(m => m.content)
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.content}`)
        .join('\n');
      if (convoSummary) editContext += `\n\nConversación con el cliente:\n${convoSummary}`;
    }

    const systemPrompt = `Eres un experto editor de HTML para páginas web de pequeños negocios. Tu tarea es aplicar un cambio solicitado al HTML de una página web.

INSTRUCCIONES:
- Aplica EXACTAMENTE el cambio descrito — no hagas cambios adicionales
- Devuelve el HTML COMPLETO modificado (no solo el fragmento)
- Mantén todo el CSS, JavaScript y estructura existente intactos
- Si el cambio es de texto, solo cambia el texto especificado
- Si el cambio es de diseño (colores, fuentes, etc.), modifica solo las propiedades CSS relevantes
- Si el cambio es de imagen, actualiza solo el src o background-image correspondiente
- Genera un resumen breve en español de lo que cambiaste (1-2 oraciones)

Usa la herramienta "apply_html_change" para devolver tu resultado.`;

    const tools = [
      {
        name: 'apply_html_change',
        description: 'Devuelve el HTML modificado y un resumen del cambio aplicado.',
        input_schema: {
          type: 'object',
          properties: {
            modified_html: {
              type: 'string',
              description: 'El HTML completo de la página web con el cambio aplicado',
            },
            summary: {
              type: 'string',
              description: 'Resumen breve en español de lo que se cambió (1-2 oraciones)',
            },
          },
          required: ['modified_html', 'summary'],
        },
      },
    ];

    // 5. Call Claude (non-streaming) to apply the edit
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: systemPrompt,
        tools,
        tool_choice: { type: 'tool', name: 'apply_html_change' },
        messages: [
          {
            role: 'user',
            content: `=== CONTEXTO DEL CAMBIO ===\n${editContext}\n\n=== HTML ACTUAL DE LA PÁGINA ===\n${currentHtml}`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errText);
      throw new Error(`Claude API returned ${claudeResponse.status}`);
    }

    const claudeResult = await claudeResponse.json();

    // Extract tool use result
    let modifiedHtml = null;
    let summary = null;

    for (const block of claudeResult.content || []) {
      if (block.type === 'tool_use' && block.name === 'apply_html_change') {
        modifiedHtml = block.input?.modified_html;
        summary = block.input?.summary;
        break;
      }
    }

    if (!modifiedHtml) {
      throw new Error('Claude did not return modified HTML');
    }

    // Basic HTML validation
    if (!modifiedHtml.includes('<!DOCTYPE') && !modifiedHtml.includes('<html')) {
      throw new Error('Modified content does not appear to be valid HTML');
    }

    // 6. Save draft_html into website config
    const updatedConfig = { ...website.config, draft_html: modifiedHtml };
    const configPatchRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ config: updatedConfig }),
      }
    );
    if (!configPatchRes.ok) {
      throw new Error('Failed to save draft HTML to website config');
    }

    // 7. Update edit request: status → ready_for_review, save ai_edit_summary
    await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          status: 'ready_for_review',
          ai_edit_summary: summary || 'Cambio aplicado por IA',
        }),
      }
    );

    // 8. Send email notification (non-blocking)
    sendApprovalEmail(editRequest, summary, website.businesses, supabaseUrl, supabaseHeaders).catch(err => {
      console.warn('Approval email error (non-blocking):', err);
    });

    return res.status(200).json({
      success: true,
      editRequestId,
      status: 'ready_for_review',
      summary: summary || 'Cambio aplicado por IA',
    });
  } catch (err) {
    console.error('Apply edit error:', err);

    // Revert status back to submitted on failure
    if (editRequest) {
      try {
        await fetch(
          `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}`,
          {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ status: 'submitted' }),
          }
        );
      } catch (revertErr) {
        console.error('Failed to revert edit request status:', revertErr);
      }
    }

    return res.status(500).json({ error: 'Failed to apply edit: ' + err.message });
  }
}

async function sendApprovalEmail(editRequest, summary, business, supabaseUrl, supabaseHeaders) {
  // Look up customer email
  const custRes = await fetch(
    `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(editRequest.customer_id)}&select=email,contact_name`,
    { headers: supabaseHeaders }
  );
  const custs = await custRes.json();
  if (!custs?.[0]?.email) return;

  const customer = custs[0];
  const approvalUrl = `https://ahoratengopagina.com/mipagina?review=${editRequest.id}`;

  const emailContent = await getTemplateForTrigger('edit_ready_for_review', {
    customer_name: customer.contact_name || '',
    business_name: business?.name || '',
    edit_description: summary || editRequest.description || '',
    approval_url: approvalUrl,
  });

  await sendEmail({
    to: customer.email,
    ...emailContent,
    from: 'AhoraTengoPagina <andres@ahoratengopagina.com>',
    replyTo: 'andres@ahoratengopagina.com',
  });
}
