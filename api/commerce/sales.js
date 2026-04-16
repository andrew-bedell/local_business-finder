import {
  getCommerceContext,
  ensureManager,
  selectRows,
  patchRows,
  toNumber,
  toPositiveNumber,
  sanitizeDate,
  sanitizeText,
  getPaymentStatus,
  enrichSales,
  createFinancePayment,
} from '../_lib/commerce.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = await getCommerceContext(req);

    if (req.method === 'GET') {
      let path = `sales?business_id=eq.${ctx.businessId}&select=*&order=sold_at.desc`;
      if (req.query.open_only === 'true') {
        path += '&balance_due=gt.0';
      }
      const sales = await selectRows(ctx, path, 'Failed to load sales');
      const enriched = await enrichSales(ctx, sales || []);
      return res.status(200).json(enriched);
    }

    const body = req.body || {};
    if (!body.id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const existingRows = await selectRows(
      ctx,
      `sales?business_id=eq.${ctx.businessId}&id=eq.${body.id}&select=*`,
      'Failed to load sale'
    );
    const existing = existingRows && existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (body.action === 'record_payment') {
      const paymentAmount = toPositiveNumber(body.amount, 0);
      if (paymentAmount <= 0) {
        return res.status(400).json({ error: 'amount must be greater than 0' });
      }

      const currentPaid = toNumber(existing.amount_paid, 0);
      const totalAmount = toNumber(existing.total_amount, 0);
      if (currentPaid + paymentAmount > totalAmount + 0.0001) {
        return res.status(400).json({ error: 'Payment exceeds the remaining balance' });
      }

      const newAmountPaid = currentPaid + paymentAmount;
      const newBalance = Math.max(0, totalAmount - newAmountPaid);
      const paymentStatus = getPaymentStatus(totalAmount, newAmountPaid);

      await createFinancePayment(ctx, {
        direction: 'incoming',
        referenceType: 'sale',
        saleId: existing.id,
        customerId: existing.customer_id,
        amount: paymentAmount,
        currency: existing.currency || 'MXN',
        paymentMethod: body.payment_method || existing.payment_method || 'cash',
        paymentDate: body.payment_date,
        notes: body.notes,
      });

      const updatedRows = await patchRows(
        ctx,
        'sales',
        `id=eq.${existing.id}`,
        {
          amount_paid: newAmountPaid,
          balance_due: newBalance,
          payment_status: paymentStatus,
          payment_method: body.payment_method || existing.payment_method || 'cash',
          due_date: sanitizeDate(body.due_date) || existing.due_date,
        },
        'Failed to update sale payment'
      );

      const enriched = await enrichSales(ctx, [updatedRows[0] || existing]);
      return res.status(200).json(enriched[0] || updatedRows[0] || existing);
    }

    ensureManager(ctx.role, 'Only owner or manager can update sale details');

    const updatePayload = {};
    if (body.payment_method !== undefined) updatePayload.payment_method = body.payment_method;
    if (body.due_date !== undefined) updatePayload.due_date = sanitizeDate(body.due_date);
    if (body.notes !== undefined) updatePayload.notes = sanitizeText(body.notes);
    if (body.customer_id !== undefined) updatePayload.customer_id = body.customer_id || null;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedRows = await patchRows(
      ctx,
      'sales',
      `id=eq.${existing.id}`,
      updatePayload,
      'Failed to update sale'
    );
    const enriched = await enrichSales(ctx, [updatedRows[0] || existing]);
    return res.status(200).json(enriched[0] || updatedRows[0] || existing);
  } catch (err) {
    console.error('Commerce sales error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
