// Vercel serverless function: Publish/unpublish/suspend/reactivate websites
// POST — handles website lifecycle state changes

import { sendEmail } from '../_lib/sendgrid.js';
import { getTemplateForTrigger } from '../_lib/email-templates.js';
import { ensureEmployeeSession } from '../_lib/employee-session.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { websiteId, action } = req.body || {};
  const validActions = ['publish', 'unpublish', 'suspend', 'reactivate'];

  if (!websiteId || !action || !validActions.includes(action)) {
    return res.status(400).json({ error: 'Missing required fields: websiteId, action (publish|unpublish|suspend|reactivate)' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const session = await ensureEmployeeSession(req, res, { supabaseUrl, serviceKey: supabaseKey });
  if (!session) return;

  try {
    // Fetch the website with business info
    const webRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=*,businesses(id,name,slug,category,subcategory,address_city,address_country)`,
      { headers: supabaseHeaders }
    );
    const webData = await webRes.json();
    if (!webData || webData.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }
    const website = webData[0];
    const business = website.businesses;

    if (!business) {
      return res.status(404).json({ error: 'Business not found for this website' });
    }

    let updatePayload = {};
    let businessUpdate = null;

    switch (action) {
      case 'publish': {
        // Generate slug if business doesn't have one
        let slug = business.slug;
        if (!slug) {
          slug = await generateUniqueSlug(buildTemporarySlugSeed(business), business.id, supabaseUrl, supabaseHeaders);
          businessUpdate = { slug };
        }

        const publishedUrl = `https://ahoratengopagina.com/sitio/${slug}`;
        updatePayload = {
          status: 'published',
          site_status: 'active',
          published_url: publishedUrl,
          published_at: new Date().toISOString(),
          version: (website.version || 0) + 1,
          last_edited_at: new Date().toISOString(),
        };
        break;
      }

      case 'unpublish': {
        updatePayload = {
          status: 'draft',
          site_status: null,
          published_url: null,
          published_at: null,
        };
        break;
      }

      case 'suspend': {
        updatePayload = {
          site_status: 'suspended',
        };
        break;
      }

      case 'reactivate': {
        updatePayload = {
          site_status: 'active',
        };
        break;
      }
    }

    // Update business slug if needed
    if (businessUpdate) {
      await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${business.id}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify(businessUpdate),
        }
      );
    }

    // Update website
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(updatePayload),
      }
    );
    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      console.error('Website update error:', patchData);
      return res.status(502).json({ error: 'Failed to update website' });
    }

    const updatedWebsite = patchData[0] || {};

    // Send lifecycle email to customer (non-blocking)
    // Skip 'publish' — auto-publish happens at generation time for outreach URLs,
    // before the business owner has purchased. Only email on suspend/reactivate
    // (which only apply to paying customers with active sites).
    if (action === 'suspend' || action === 'reactivate') {
      sendLifecycleEmail(action, business, updatedWebsite, supabaseUrl, supabaseHeaders).catch(err => {
        console.warn('Lifecycle email error (non-blocking):', err);
      });
    }

    return res.status(200).json({
      success: true,
      action,
      website: {
        id: updatedWebsite.id,
        status: updatedWebsite.status,
        site_status: updatedWebsite.site_status,
        published_url: updatedWebsite.published_url,
        version: updatedWebsite.version,
      },
      slug: businessUpdate ? businessUpdate.slug : business.slug,
    });
  } catch (err) {
    console.error('Publish action error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildTemporarySlugSeed(business) {
  const businessType = inferGenericBusinessType(business);
  const country = normalizeCountryName(business?.address_country);
  if (businessType && country) return `${businessType} en ${country}`;
  if (businessType) return businessType;
  if (country) return `negocio en ${country}`;
  return 'negocio local';
}

function inferGenericBusinessType(business) {
  const source = [
    business?.category,
    business?.subcategory,
    business?.name,
  ].filter(Boolean).join(' ').toLowerCase();

  if (!source) return 'negocio local';

  const matches = [
    [/ropa|boutique|moda|fashion|clothing|vestido|zapato|calzado|tienda/, 'ropa'],
    [/restaurante|restaurant|comida|food|cafe|cafeteria|bar|pizzeria|taco|taqueria/, 'restaurante'],
    [/salon|salón|peluquer|barber|barberia|barbería|nail|uñas|spa|belleza/, 'salon de belleza'],
    [/dentista|dental|odontolog/, 'dentista'],
    [/doctor|medic|médic|clinica|clínica|salud/, 'servicios de salud'],
    [/gimnasio|gym|fitness|entrenamiento/, 'gimnasio'],
    [/abogado|legal|lawyer/, 'servicios legales'],
    [/auto|mecan|mecán|taller|carro|llanta/, 'taller automotriz'],
    [/plomer|fontaner|electric|reparacion|reparación/, 'servicio local'],
  ];

  for (const [pattern, label] of matches) {
    if (pattern.test(source)) return label;
  }

  return 'negocio local';
}

function normalizeCountryName(country) {
  const value = String(country || '').trim().toLowerCase();
  if (!value) return '';
  const countries = {
    co: 'colombia',
    colombia: 'colombia',
    mx: 'mexico',
    mexico: 'mexico',
    'méxico': 'mexico',
    ec: 'ecuador',
    ecuador: 'ecuador',
  };
  return countries[value] || value;
}

// Send lifecycle email to the customer who owns this business
async function sendLifecycleEmail(action, business, website, supabaseUrl, supabaseHeaders) {
  // Look up customer for this business
  const custRes = await fetch(
    `${supabaseUrl}/rest/v1/customers?business_id=eq.${business.id}&select=id,email,contact_name`,
    { headers: supabaseHeaders }
  );
  const custs = await custRes.json();
  if (!custs || custs.length === 0 || !custs[0].email) return;

  const customer = custs[0];
  const portalUrl = 'https://ahoratengopagina.com/mipagina';

  let emailContent;

  if (action === 'publish') {
    emailContent = await getTemplateForTrigger('website_published', {
      contactName: customer.contact_name || '',
      businessName: business.name || '',
      publishedUrl: website.published_url || '',
      portalUrl,
    });
  } else if (action === 'suspend') {
    emailContent = await getTemplateForTrigger('website_suspended', {
      contactName: customer.contact_name || '',
      businessName: business.name || '',
      portalUrl,
    });
  } else if (action === 'reactivate') {
    emailContent = await getTemplateForTrigger('website_reactivated', {
      contactName: customer.contact_name || '',
      businessName: business.name || '',
      publishedUrl: website.published_url || '',
      portalUrl,
    });
  }

  if (emailContent) {
    const result = await sendEmail({ to: customer.email, ...emailContent });
    if (!result.success) {
      console.warn(`${action} email failed:`, result.error);
    }
  }
}

// Generate a URL-safe slug from a business name, ensuring uniqueness
async function generateUniqueSlug(name, businessId, supabaseUrl, supabaseHeaders) {
  // Lowercase → strip diacritics → replace non-alphanumeric with hyphens → collapse → trim
  let slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanumeric → hyphens
    .replace(/-+/g, '-')               // collapse multiple hyphens
    .replace(/^-|-$/g, '');            // trim leading/trailing hyphens

  if (!slug) slug = 'negocio';

  // Check uniqueness
  let candidate = slug;
  let suffix = 1;

  while (true) {
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?slug=eq.${encodeURIComponent(candidate)}&id=neq.${businessId}&select=id`,
      { headers: supabaseHeaders }
    );
    const existing = await checkRes.json();
    if (!existing || existing.length === 0) {
      break;
    }
    suffix++;
    candidate = `${slug}-${suffix}`;
  }

  return candidate;
}
