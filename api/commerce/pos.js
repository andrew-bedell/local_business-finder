import {
  getCommerceContext,
  selectRows,
  insertRows,
  patchRows,
  toNumber,
  toPositiveNumber,
  sanitizeText,
  sanitizeDate,
  getPaymentStatus,
  getInventoryItemMap,
  enrichSales,
  createFinancePayment,
  recordInventoryMovement,
} from '../_lib/commerce.js';

async function resolveCustomerId(ctx, body, balanceDue) {
  if (body.customer_id) {
    const existingCustomerRows = await selectRows(
      ctx,
      `commerce_customers?business_id=eq.${ctx.businessId}&id=eq.${body.customer_id}&select=*`,
      'Failed to load customer'
    );
    if (!existingCustomerRows || !existingCustomerRows[0]) {
      throw Object.assign(new Error('Customer not found'), { status: 404 });
    }
    return existingCustomerRows[0].id;
  }

  const customerName = sanitizeText(body.customer_name);
  const customerPhone = sanitizeText(body.customer_phone);
  const customerEmail = sanitizeText(body.customer_email);
  const customerAddress = sanitizeText(body.customer_address);
  const saveCustomer = body.save_customer === true || balanceDue > 0;

  if (!saveCustomer) {
    return null;
  }

  if (!customerName) {
    throw Object.assign(new Error('Customer name is required when the sale has money due'), { status: 400 });
  }

  if (customerPhone) {
    const byPhone = await selectRows(
      ctx,
      `commerce_customers?business_id=eq.${ctx.businessId}&phone=eq.${encodeURIComponent(customerPhone)}&select=*`,
      'Failed to load customer'
    );
    if (byPhone && byPhone[0]) return byPhone[0].id;
  }

  if (customerEmail) {
    const byEmail = await selectRows(
      ctx,
      `commerce_customers?business_id=eq.${ctx.businessId}&email=eq.${encodeURIComponent(customerEmail)}&select=*`,
      'Failed to load customer'
    );
    if (byEmail && byEmail[0]) return byEmail[0].id;
  }

  const createdRows = await insertRows(
    ctx,
    'commerce_customers',
    {
      business_id: ctx.businessId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress,
      notes: sanitizeText(body.customer_notes),
      credit_terms_days: Math.max(0, Math.trunc(toNumber(body.customer_credit_terms_days, 0))),
    },
    'Failed to create customer'
  );

  return createdRows && createdRows[0] ? createdRows[0].id : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = await getCommerceContext(req);
    const body = req.body || {};

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'At least one sale item is required' });
    }

    const itemMap = await getInventoryItemMap(ctx, body.items.map(function (item) { return item.item_id; }));
    const saleItems = body.items.map(function (item) {
      const product = itemMap[item.item_id];
      if (!product) {
        throw Object.assign(new Error('One or more inventory products were not found'), { status: 404 });
      }

      const quantity = toPositiveNumber(item.quantity, 0);
      if (quantity <= 0) {
        throw Object.assign(new Error('quantity must be greater than 0'), { status: 400 });
      }

      if (product.track_inventory !== false && toNumber(product.current_stock, 0) < quantity) {
        throw Object.assign(new Error('Insufficient stock for ' + product.name), { status: 400 });
      }

      const unitPrice = Math.max(0, toNumber(item.unit_price, product.sale_price));
      return {
        product: product,
        quantity: quantity,
        unit_price: unitPrice,
        unit_cost: Math.max(0, toNumber(product.cost_price, 0)),
        line_total: quantity * unitPrice,
      };
    });

    const subtotal = saleItems.reduce(function (sum, item) { return sum + item.line_total; }, 0);
    const discountAmount = Math.max(0, toNumber(body.discount_amount, 0));
    const taxAmount = Math.max(0, toNumber(body.tax_amount, 0));
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
    const amountPaid = Math.max(0, toNumber(body.amount_paid, totalAmount));

    if (amountPaid > totalAmount + 0.0001) {
      return res.status(400).json({ error: 'amount_paid cannot exceed the sale total' });
    }

    const balanceDue = Math.max(0, totalAmount - amountPaid);
    const customerId = await resolveCustomerId(ctx, body, balanceDue);
    const paymentMethod = body.payment_method || (balanceDue > 0 ? 'credit' : 'cash');

    const salePayload = {
      business_id: ctx.businessId,
      customer_id: customerId,
      sale_number: sanitizeText(body.sale_number) || undefined,
      status: 'completed',
      payment_status: getPaymentStatus(totalAmount, amountPaid),
      payment_method: paymentMethod,
      sale_channel: body.sale_channel || 'pos',
      currency: body.currency || (saleItems[0] && saleItems[0].product.currency) || 'MXN',
      subtotal: subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      due_date: sanitizeDate(body.due_date),
      notes: sanitizeText(body.notes),
      sold_at: new Date().toISOString(),
    };
    if (!salePayload.sale_number) delete salePayload.sale_number;

    const createdSaleRows = await insertRows(ctx, 'sales', salePayload, 'Failed to create sale');
    const sale = createdSaleRows && createdSaleRows[0];

    const saleItemPayload = saleItems.map(function (item) {
      return {
        sale_id: sale.id,
        business_id: ctx.businessId,
        item_id: item.product.id,
        description: item.product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        line_total: item.line_total,
      };
    });
    await insertRows(ctx, 'sale_items', saleItemPayload, 'Failed to create sale items');

    for (const item of saleItems) {
      if (item.product.track_inventory !== false) {
        await patchRows(
          ctx,
          'inventory_items',
          `id=eq.${item.product.id}`,
          { current_stock: Math.max(0, toNumber(item.product.current_stock, 0) - item.quantity) },
          'Failed to update inventory stock'
        );

        await recordInventoryMovement(ctx, {
          itemId: item.product.id,
          movementType: 'sale',
          direction: 'out',
          quantity: item.quantity,
          unitCost: item.unit_cost,
          unitPrice: item.unit_price,
          referenceType: 'sale',
          referenceId: sale.id,
          notes: 'POS sale ' + (sale.sale_number || sale.id),
        });
      }
    }

    if (amountPaid > 0) {
      await createFinancePayment(ctx, {
        direction: 'incoming',
        referenceType: 'sale',
        saleId: sale.id,
        customerId: customerId,
        amount: amountPaid,
        currency: sale.currency,
        paymentMethod: paymentMethod === 'mixed' ? 'other' : paymentMethod,
        paymentDate: body.payment_date,
        notes: body.notes,
      });
    }

    const enriched = await enrichSales(ctx, [sale]);
    return res.status(201).json(enriched[0] || sale);
  } catch (err) {
    console.error('Commerce POS error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
