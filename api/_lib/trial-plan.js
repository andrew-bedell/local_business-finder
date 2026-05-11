export const PAGINAPRO_TRIAL_DAYS = 30;

export function getTrialEndsAt(days = PAGINAPRO_TRIAL_DAYS) {
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + days);
  return endsAt.toISOString();
}

export async function resolvePaginaProTrialProduct({ productId, countryCode, supabaseUrl, supabaseHeaders }) {
  if (!supabaseUrl || !supabaseHeaders) return null;

  if (productId) {
    const productRes = await fetch(
      `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&is_active=eq.true&price=gt.0&select=id,name,price,currency,billing_interval,stripe_price_id`,
      { headers: supabaseHeaders }
    );
    const products = productRes.ok ? await productRes.json() : [];
    return products && products.length > 0 ? products[0] : null;
  }

  let url = `${supabaseUrl}/rest/v1/products?is_active=eq.true&price=gt.0&order=sort_order.asc&limit=1&select=id,name,price,currency,billing_interval,stripe_price_id`;
  const country = String(countryCode || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(country)) {
    url += `&or=(country_code.eq.${country},country_code.is.null)`;
  }

  const productRes = await fetch(url, { headers: supabaseHeaders });
  const products = productRes.ok ? await productRes.json() : [];
  return products && products.length > 0 ? products[0] : null;
}

export function buildTrialCustomerFields(product, fallbackCurrency = 'MXN') {
  return {
    monthly_price: product && product.price != null ? product.price : 0,
    currency: product?.currency || fallbackCurrency || 'MXN',
  };
}

export function buildTrialSubscriptionPayload(customerId, product, startsAt = new Date().toISOString()) {
  return {
    customer_id: customerId,
    stripe_subscription_id: null,
    stripe_price_id: product?.stripe_price_id || null,
    status: 'trialing',
    current_period_start: startsAt,
    current_period_end: getTrialEndsAt(),
  };
}
