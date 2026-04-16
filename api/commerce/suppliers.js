import {
  getCommerceContext,
  ensureManager,
  selectRows,
  insertRows,
  patchRows,
  sanitizeText,
  toNumber,
} from '../_lib/commerce.js';

function buildSupplierPayload(body, businessId) {
  return {
    business_id: businessId,
    name: sanitizeText(body.name),
    contact_name: sanitizeText(body.contact_name),
    phone: sanitizeText(body.phone),
    email: sanitizeText(body.email),
    whatsapp: sanitizeText(body.whatsapp),
    address: sanitizeText(body.address),
    payment_terms_days: Math.max(0, Math.trunc(toNumber(body.payment_terms_days, 0))),
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
      let path = `suppliers?business_id=eq.${ctx.businessId}&select=*&order=name.asc`;
      if (!showInactive) path += '&is_active=eq.true';
      const suppliers = await selectRows(ctx, path, 'Failed to load suppliers');
      const openOrders = await selectRows(
        ctx,
        `purchase_orders?business_id=eq.${ctx.businessId}&balance_due=gt.0&select=supplier_id,balance_due`,
        'Failed to load supplier balances'
      );
      const balances = {};
      (openOrders || []).forEach(function (order) {
        balances[order.supplier_id] = (balances[order.supplier_id] || 0) + toNumber(order.balance_due, 0);
      });
      return res.status(200).json((suppliers || []).map(function (supplier) {
        return {
          ...supplier,
          open_balance: balances[supplier.id] || 0,
        };
      }));
    }

    ensureManager(ctx.role, 'Only owner or manager can manage suppliers');

    if (req.method === 'POST') {
      const payload = buildSupplierPayload(req.body || {}, ctx.businessId);
      if (!payload.name) {
        return res.status(400).json({ error: 'name is required' });
      }
      const created = await insertRows(ctx, 'suppliers', payload, 'Failed to create supplier');
      return res.status(201).json((created && created[0]) || {});
    }

    const supplierId = req.method === 'DELETE'
      ? (req.query.id || (req.body && req.body.id))
      : (req.body && req.body.id);

    if (!supplierId) {
      return res.status(400).json({ error: 'id is required' });
    }

    const existingRows = await selectRows(
      ctx,
      `suppliers?business_id=eq.${ctx.businessId}&id=eq.${supplierId}&select=*`,
      'Failed to load supplier'
    );
    if (!existingRows || !existingRows[0]) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (req.method === 'DELETE') {
      await patchRows(ctx, 'suppliers', `id=eq.${supplierId}`, { is_active: false }, 'Failed to archive supplier');
      return res.status(200).json({ success: true });
    }

    const payload = buildSupplierPayload(req.body || {}, ctx.businessId);
    delete payload.business_id;
    if (!payload.name) delete payload.name;
    const updated = await patchRows(ctx, 'suppliers', `id=eq.${supplierId}`, payload, 'Failed to update supplier');
    return res.status(200).json((updated && updated[0]) || {});
  } catch (err) {
    console.error('Commerce suppliers error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
