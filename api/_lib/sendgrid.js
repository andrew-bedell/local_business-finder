// Shared Resend email utility
// Uses RESEND_API_KEY env var — direct fetch to REST API (no SDK)

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
        from: from || 'AhoraTengoPagina <noreply@ahoratengopagina.com>',
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
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
