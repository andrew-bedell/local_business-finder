// Shared Resend email utility
// Uses RESEND_API_KEY env var — direct fetch to REST API (no SDK)
//
// From / Reply-To defaults come from EMAIL_FROM and EMAIL_REPLY_TO env vars so
// the sender can be changed without touching code. Call sites should NOT pass
// `from` / `replyTo` unless they need to override per-message.

const DEFAULT_FROM = 'AhoraTengoPagina <andres@ahoratengopagina.com>';
const DEFAULT_REPLY_TO = 'andres@ahoratengopagina.com';

export function getDefaultFrom() {
  return process.env.EMAIL_FROM || DEFAULT_FROM;
}

export function getDefaultReplyTo() {
  return process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO;
}

export async function sendEmail({ to, subject, html, text, from, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || getDefaultFrom(),
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
        reply_to: replyTo || getDefaultReplyTo(),
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    const errText = await response.text().catch(() => '');
    console.error('Resend error:', response.status, errText);
    return { success: false, error: `Resend returned ${response.status}: ${errText.substring(0, 200)}` };
  } catch (err) {
    console.error('Resend fetch error:', err);
    return { success: false, error: err.message };
  }
}
