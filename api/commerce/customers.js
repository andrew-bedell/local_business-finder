import {
  getCommerceContext,
  ensureManager,
  selectRows,
  insertRows,
  patchRows,
  sanitizeText,
  toNumber,
} from '../_lib/commerce.js';

function buildCustomerPayload(body, businessId) {
  return {
    business_id: businessId,
    name: sanitizeText(body.name),
    phone: sanitizeText(body.phone),
    email: sanitizeText(body.email),
    address: sanitizeText(body.address),
    credit_terms_days: Math.max(0, Math.trunc(toNumber(body.credit_terms_days, 0))),
    notes: sanitizeText(body.notes),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = await getCommerceContext(req);

    if (req.method === 'GET') {
      const showInactive = req.query.show_inactive === 'true';
      let path = `commerce_customers?business_id=eq.${ctx.businessId}&select=*&order=name.asc`;
      if (!showInactive) path += '&is_active=eq.true';
      const customers = await selectRows(ctx, path, 'Failed to load customers');
      const openSales = await selectRows(
        ctx,
        `sales?business_id=eq.${ctx.businessId}&balance_due=gt.0&select=customer_id,balance_due`,
        'Failed to load customer balances'
      );
      const balances = {};
      (openSales || []).forEach(function (sale) {
        if (!sale.customer_id) return;
        balances[sale.customer_id] = (balances[sale.customer_id] || 0) + toNumber(sale.balance_due, 0);
      });
      return res.status(200).json((customers || []).map(function (customer) {
        return {
          ...customer,
          open_balance: balances[customer.id] || 0,
        };
      }));
    }

    ensureManager(ctx.role, 'Only owner or manager can manage customers');

    if (req.method === 'POST') {
      const payload = buildCustomerPayload(req.body || {}, ctx.businessId);
      if (!payload.name) {
        return res.status(400).json({ error: 'name is required' });
      }
      const created = await insertRows(ctx, 'commerce_customers', payload, 'Failed to create customer');
      return res.status(201).json((created && created[0]) || {});
    }

    const customerId = req.method === 'DELETE'
      ? (req.query.id || (req.body && req.body.id))
      : (req.body && req.body.id);

    if (!customerId) {
      return res.status(400).json({ error: 'id is required' });
    }

    const existingRows = await selectRows(
      ctx,
      `commerce_customers?business_id=eq.${ctx.businessId}&id=eq.${customerId}&select=*`,
      'Failed to load customer'
    );
    if (!existingRows || !existingRows[0]) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (req.method === 'DELETE') {
      await patchRows(ctx, 'commerce_customers', `id=eq.${customerId}`, { is_active: false }, 'Failed to archive customer');
      return res.status(200).json({ success: true });
    }

    const payload = buildCustomerPayload(req.body || {}, ctx.businessId);
    delete payload.business_id;
    if (!payload.name) delete payload.name;
    const updated = await patchRows(ctx, 'commerce_customers', `id=eq.${customerId}`, payload, 'Failed to update customer');
    return res.status(200).json((updated && updated[0]) || {});
  } catch (err) {
    console.error('Commerce customers error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
