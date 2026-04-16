import {
  getCommerceContext,
  ensureManager,
  selectRows,
  insertRows,
  patchRows,
  toNumber,
  toPositiveNumber,
  sanitizeText,
  sanitizeDate,
  getPaymentStatus,
  computePurchaseOrderStatus,
  getInventoryItemMap,
  enrichPurchaseOrders,
  recordInventoryMovement,
  createFinancePayment,
} from '../_lib/commerce.js';

function addDays(dateText, days) {
  const date = new Date((dateText || '') + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function sumLineItems(items) {
  return (items || []).reduce(function (sum, item) {
    return sum + (toNumber(item.quantity_ordered, 0) * toNumber(item.unit_cost, 0));
  }, 0);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = await getCommerceContext(req);

    if (req.method === 'GET') {
      const orders = await selectRows(
        ctx,
        `purchase_orders?business_id=eq.${ctx.businessId}&select=*&order=created_at.desc`,
        'Failed to load purchase orders'
      );
      const enriched = await enrichPurchaseOrders(ctx, orders || []);
      return res.status(200).json(enriched);
    }

    ensureManager(ctx.role, 'Only owner or manager can manage purchase orders');

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.supplier_id) {
        return res.status(400).json({ error: 'supplier_id is required' });
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ error: 'At least one purchase order item is required' });
      }

      const suppliers = await selectRows(
        ctx,
        `suppliers?business_id=eq.${ctx.businessId}&id=eq.${body.supplier_id}&select=*`,
        'Failed to load supplier'
      );
      const supplier = suppliers && suppliers[0];
      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      const itemMap = await getInventoryItemMap(ctx, body.items.map(function (item) { return item.item_id; }));
      const lineItems = body.items.map(function (item) {
        const product = itemMap[item.item_id];
        if (!product) {
          throw Object.assign(new Error('One or more products were not found'), { status: 404 });
        }

        const quantityOrdered = toPositiveNumber(item.quantity_ordered, 0);
        if (quantityOrdered <= 0) {
          throw Object.assign(new Error('quantity_ordered must be greater than 0'), { status: 400 });
        }

        const unitCost = Math.max(0, toNumber(item.unit_cost, product.cost_price));
        return {
          business_id: ctx.businessId,
          item_id: product.id,
          description: sanitizeText(item.description) || product.name,
          quantity_ordered: quantityOrdered,
          quantity_received: 0,
          unit_cost: unitCost,
          line_total: quantityOrdered * unitCost,
        };
      });

      const subtotal = sumLineItems(lineItems);
      const taxAmount = Math.max(0, toNumber(body.tax_amount, 0));
      const totalAmount = subtotal + taxAmount;
      const orderDate = sanitizeDate(body.order_date) || new Date().toISOString().slice(0, 10);
      const dueDate = sanitizeDate(body.due_date)
        || (supplier.payment_terms_days ? addDays(orderDate, supplier.payment_terms_days) : null);

      const purchaseOrderPayload = {
        business_id: ctx.businessId,
        supplier_id: supplier.id,
        po_number: sanitizeText(body.po_number) || undefined,
        status: body.status || 'ordered',
        payment_status: 'pending',
        order_date: orderDate,
        expected_date: sanitizeDate(body.expected_date),
        due_date: dueDate,
        currency: body.currency || 'MXN',
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        notes: sanitizeText(body.notes),
      };

      if (!purchaseOrderPayload.po_number) delete purchaseOrderPayload.po_number;

      const createdOrderRows = await insertRows(
        ctx,
        'purchase_orders',
        purchaseOrderPayload,
        'Failed to create purchase order'
      );
      const order = createdOrderRows && createdOrderRows[0];

      const itemPayload = lineItems.map(function (item) {
        return {
          ...item,
          purchase_order_id: order.id,
        };
      });
      await insertRows(ctx, 'purchase_order_items', itemPayload, 'Failed to create purchase order items');

      const enriched = await enrichPurchaseOrders(ctx, [order]);
      return res.status(201).json(enriched[0] || order);
    }

    const body = req.body || {};
    if (!body.id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const existingRows = await selectRows(
      ctx,
      `purchase_orders?business_id=eq.${ctx.businessId}&id=eq.${body.id}&select=*`,
      'Failed to load purchase order'
    );
    const existing = existingRows && existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (body.action === 'receive') {
      const lineItemId = body.line_item_id;
      const receivedQuantity = toPositiveNumber(body.quantity, 0);
      if (!lineItemId || receivedQuantity <= 0) {
        return res.status(400).json({ error: 'line_item_id and quantity are required' });
      }

      const orderItems = await selectRows(
        ctx,
        `purchase_order_items?business_id=eq.${ctx.businessId}&purchase_order_id=eq.${existing.id}&select=*`,
        'Failed to load purchase order items'
      );
      const lineItem = (orderItems || []).find(function (item) { return item.id === lineItemId; });
      if (!lineItem) {
        return res.status(404).json({ error: 'Purchase order item not found' });
      }

      const remaining = toNumber(lineItem.quantity_ordered, 0) - toNumber(lineItem.quantity_received, 0);
      if (receivedQuantity > remaining) {
        return res.status(400).json({ error: 'Received quantity exceeds quantity still pending' });
      }

      const newReceived = toNumber(lineItem.quantity_received, 0) + receivedQuantity;
      await patchRows(
        ctx,
        'purchase_order_items',
        `id=eq.${lineItem.id}`,
        { quantity_received: newReceived },
        'Failed to update purchase order item'
      );

      const itemMap = await getInventoryItemMap(ctx, [lineItem.item_id]);
      const product = itemMap[lineItem.item_id];
      if (!product) {
        return res.status(404).json({ error: 'Inventory product not found' });
      }

      await patchRows(
        ctx,
        'inventory_items',
        `id=eq.${product.id}`,
        { current_stock: toNumber(product.current_stock, 0) + receivedQuantity },
        'Failed to update inventory stock'
      );

      await recordInventoryMovement(ctx, {
        itemId: product.id,
        movementType: 'purchase_receive',
        direction: 'in',
        quantity: receivedQuantity,
        unitCost: lineItem.unit_cost,
        referenceType: 'purchase_order',
        referenceId: existing.id,
        notes: sanitizeText(body.notes) || ('Received against PO ' + existing.po_number),
      });

      const refreshedItems = await selectRows(
        ctx,
        `purchase_order_items?business_id=eq.${ctx.businessId}&purchase_order_id=eq.${existing.id}&select=*`,
        'Failed to reload purchase order items'
      );
      const newStatus = computePurchaseOrderStatus(refreshedItems || [], existing.status);
      const updatedRows = await patchRows(
        ctx,
        'purchase_orders',
        `id=eq.${existing.id}`,
        { status: newStatus },
        'Failed to update purchase order status'
      );

      const enriched = await enrichPurchaseOrders(ctx, [updatedRows[0] || existing]);
      return res.status(200).json(enriched[0] || updatedRows[0] || existing);
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
        direction: 'outgoing',
        referenceType: 'purchase_order',
        purchaseOrderId: existing.id,
        supplierId: existing.supplier_id,
        amount: paymentAmount,
        currency: existing.currency || 'MXN',
        paymentMethod: body.payment_method || 'transfer',
        paymentDate: body.payment_date,
        notes: body.notes,
      });

      const updatedRows = await patchRows(
        ctx,
        'purchase_orders',
        `id=eq.${existing.id}`,
        {
          amount_paid: newAmountPaid,
          balance_due: newBalance,
          payment_status: paymentStatus,
          due_date: sanitizeDate(body.due_date) || existing.due_date,
        },
        'Failed to update purchase order payment'
      );

      const enriched = await enrichPurchaseOrders(ctx, [updatedRows[0] || existing]);
      return res.status(200).json(enriched[0] || updatedRows[0] || existing);
    }

    const updatePayload = {};
    if (body.status) updatePayload.status = body.status;
    if (body.expected_date !== undefined) updatePayload.expected_date = sanitizeDate(body.expected_date);
    if (body.due_date !== undefined) updatePayload.due_date = sanitizeDate(body.due_date);
    if (body.notes !== undefined) updatePayload.notes = sanitizeText(body.notes);

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedRows = await patchRows(
      ctx,
      'purchase_orders',
      `id=eq.${existing.id}`,
      updatePayload,
      'Failed to update purchase order'
    );
    const enriched = await enrichPurchaseOrders(ctx, [updatedRows[0] || existing]);
    return res.status(200).json(enriched[0] || updatedRows[0] || existing);
  } catch (err) {
    console.error('Commerce purchase orders error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
