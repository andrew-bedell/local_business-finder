// Vercel serverless function: Preview email template with sample merge tag values
// POST — body: { html, subject (optional), trigger_key (optional) }

const SAMPLE_DATA = {
  contactName: 'María García',
  businessName: 'Tacos Don Pepe',
  loginUrl: 'https://ahoratengopagina.com/mipagina',
  portalUrl: 'https://ahoratengopagina.com/mipagina',
  publishedUrl: 'https://ahoratengopagina.com/sitio/tacos-don-pepe',
  inviteUrl: 'https://ahoratengopagina.com/mipagina',
  amount: '$499.00 MXN',
  currency: 'MXN',
  periodEnd: '15 de abril de 2026',
  requestType: 'Actualización de contenido',
  description: 'Actualizar el horario de atención y agregar nuevas fotos del local',
  rejectionReason: 'La solicitud requiere información adicional',
  oldPlan: 'Plan Básico',
  newPlan: 'Plan Premium',
  newAmount: '$899.00 MXN',
  inviterName: 'Carlos López',
  displayName: 'Ana Martínez',
  email: 'maria@ejemplo.com',
  typeLabel: 'Actualización de contenido',
};

function replaceMergeTags(text) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, tag) => {
    return SAMPLE_DATA[tag] !== undefined ? SAMPLE_DATA[tag] : match;
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, subject } = req.body || {};

  if (!html) {
    return res.status(400).json({ error: 'Missing required field: html' });
  }

  try {
    const previewHtml = replaceMergeTags(html);
    const previewSubject = subject ? replaceMergeTags(subject) : null;

    return res.status(200).json({
      subject: previewSubject,
      html: previewHtml,
    });
  } catch (err) {
    console.error('Email template preview error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
