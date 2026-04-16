import { resolveCustomerBusiness } from './resolve-customer-business.js';

const SUPABASE_URL_FALLBACK = 'https://xagfwyknlutmmtfufbfi.supabase.co';

export function getCommerceConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || SUPABASE_URL_FALLBACK;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw Object.assign(new Error('Service role key not configured'), { status: 503 });
  }

  return {
    supabaseUrl,
    serviceKey,
    supabaseHeaders: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  };
}

export async function getCommerceContext(req) {
  const config = getCommerceConfig();
  const resolved = await resolveCustomerBusiness(req, config.supabaseUrl, config.serviceKey);
  return {
    ...config,
    ...resolved,
  };
}

export function ensureManager(role, message) {
  if (role !== 'owner' && role !== 'manager') {
    throw Object.assign(new Error(message || 'Only owner or manager can manage this resource'), { status: 403 });
  }
}

export async function fetchJson(url, options, fallbackMessage) {
  const response = await fetch(url, options);
  const raw = await response.text().catch(() => '');

  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (err) {
      data = raw;
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data
      ? (data.error || data.message || data.msg || fallbackMessage || 'Request failed')
      : (fallbackMessage || raw || 'Request failed');
    const error = new Error(message);
    error.status = response.status;
    error.detail = data;
    throw error;
  }

  return data;
}

export async function selectRows(ctx, path, fallbackMessage) {
  return fetchJson(
    `${ctx.supabaseUrl}/rest/v1/${path}`,
    { headers: ctx.supabaseHeaders },
    fallbackMessage
  );
}

export async function insertRows(ctx, table, payload, fallbackMessage) {
  return fetchJson(
    `${ctx.supabaseUrl}/rest/v1/${table}`,
    {
      method: 'POST',
      headers: { ...ctx.supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload),
    },
    fallbackMessage
  );
}

export async function patchRows(ctx, table, filterQuery, payload, fallbackMessage) {
  return fetchJson(
    `${ctx.supabaseUrl}/rest/v1/${table}?${filterQuery}`,
    {
      method: 'PATCH',
      headers: { ...ctx.supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload),
    },
    fallbackMessage
  );
}

export function toNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : (fallback == null ? 0 : fallback);
}

export function toPositiveNumber(value, fallback) {
  const numberValue = toNumber(value, fallback);
  return numberValue > 0 ? numberValue : (fallback == null ? 0 : fallback);
}

export function sanitizeText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function sanitizeDate(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export function buildInFilter(ids) {
  return ids.map(function (id) { return String(id); }).join(',');
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getPaymentStatus(totalAmount, amountPaid) {
  const total = Math.max(0, toNumber(totalAmount, 0));
  const paid = Math.max(0, toNumber(amountPaid, 0));
  if (total === 0) return 'paid';
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'pending';
}

export function computePurchaseOrderStatus(items, currentStatus) {
  if (currentStatus === 'cancelled') return 'cancelled';
  if (!Array.isArray(items) || items.length === 0) return currentStatus || 'draft';

  let anyReceived = false;
  let allReceived = true;

  items.forEach(function (item) {
    const ordered = toNumber(item.quantity_ordered, 0);
    const received = toNumber(item.quantity_received, 0);
    if (received > 0) anyReceived = true;
    if (received < ordered) allReceived = false;
  });

  if (allReceived) return 'received';
  if (anyReceived) return 'partially_received';
  return currentStatus === 'draft' ? 'draft' : 'ordered';
}

export async function recordInventoryMovement(ctx, movement) {
  const payload = {
    business_id: ctx.businessId,
    item_id: movement.itemId,
    movement_type: movement.movementType,
    direction: movement.direction,
    quantity: movement.quantity,
    unit_cost: movement.unitCost != null ? toNumber(movement.unitCost, 0) : null,
    unit_price: movement.unitPrice != null ? toNumber(movement.unitPrice, 0) : null,
    reference_type: movement.referenceType || null,
    reference_id: movement.referenceId || null,
    notes: sanitizeText(movement.notes),
    occurred_at: movement.occurredAt || new Date().toISOString(),
  };

  await insertRows(ctx, 'inventory_movements', payload, 'Failed to record inventory movement');
}

export async function createFinancePayment(ctx, payment) {
  const payload = {
    business_id: ctx.businessId,
    direction: payment.direction,
    reference_type: payment.referenceType,
    sale_id: payment.saleId || null,
    purchase_order_id: payment.purchaseOrderId || null,
    customer_id: payment.customerId || null,
    supplier_id: payment.supplierId || null,
    amount: toPositiveNumber(payment.amount, 0),
    currency: payment.currency || 'MXN',
    payment_method: payment.paymentMethod || 'other',
    payment_date: sanitizeDate(payment.paymentDate) || getTodayDate(),
    notes: sanitizeText(payment.notes),
  };

  await insertRows(ctx, 'finance_payments', payload, 'Failed to record payment');
}

export async function getInventoryItemMap(ctx, itemIds) {
  const uniqueIds = Array.from(new Set((itemIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const items = await selectRows(
    ctx,
    `inventory_items?business_id=eq.${ctx.businessId}&id=in.(${buildInFilter(uniqueIds)})&select=*`,
    'Failed to load inventory items'
  );

  return (items || []).reduce(function (map, item) {
    map[item.id] = item;
    return map;
  }, {});
}

export async function getSupplierMap(ctx, supplierIds) {
  const uniqueIds = Array.from(new Set((supplierIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const suppliers = await selectRows(
    ctx,
    `suppliers?business_id=eq.${ctx.businessId}&id=in.(${buildInFilter(uniqueIds)})&select=*`,
    'Failed to load suppliers'
  );

  return (suppliers || []).reduce(function (map, supplier) {
    map[supplier.id] = supplier;
    return map;
  }, {});
}

export async function getCommerceCustomerMap(ctx, customerIds) {
  const uniqueIds = Array.from(new Set((customerIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const customers = await selectRows(
    ctx,
    `commerce_customers?business_id=eq.${ctx.businessId}&id=in.(${buildInFilter(uniqueIds)})&select=*`,
    'Failed to load customers'
  );

  return (customers || []).reduce(function (map, customer) {
    map[customer.id] = customer;
    return map;
  }, {});
}

export async function enrichPurchaseOrders(ctx, orders) {
  const rows = Array.isArray(orders) ? orders : [];
  if (rows.length === 0) return [];

  const orderIds = rows.map(function (order) { return order.id; });
  const supplierMap = await getSupplierMap(ctx, rows.map(function (order) { return order.supplier_id; }));
  const items = await selectRows(
    ctx,
    `purchase_order_items?business_id=eq.${ctx.businessId}&purchase_order_id=in.(${buildInFilter(orderIds)})&select=*&order=created_at.asc`,
    'Failed to load purchase order items'
  );
  const itemMap = await getInventoryItemMap(ctx, (items || []).map(function (item) { return item.item_id; }));

  const itemsByOrder = {};
  (items || []).forEach(function (item) {
    if (!itemsByOrder[item.purchase_order_id]) itemsByOrder[item.purchase_order_id] = [];
    itemsByOrder[item.purchase_order_id].push({
      ...item,
      item_name: itemMap[item.item_id] ? itemMap[item.item_id].name : null,
      sku: itemMap[item.item_id] ? itemMap[item.item_id].sku : null,
    });
  });

  return rows.map(function (order) {
    const supplier = supplierMap[order.supplier_id] || null;
    const orderItems = itemsByOrder[order.id] || [];
    return {
      ...order,
      supplier: supplier,
      supplier_name: supplier ? supplier.name : null,
      items: orderItems,
      item_count: orderItems.length,
    };
  });
}

export async function enrichSales(ctx, salesRows) {
  const rows = Array.isArray(salesRows) ? salesRows : [];
  if (rows.length === 0) return [];

  const saleIds = rows.map(function (sale) { return sale.id; });
  const customerMap = await getCommerceCustomerMap(ctx, rows.map(function (sale) { return sale.customer_id; }));
  const saleItems = await selectRows(
    ctx,
    `sale_items?business_id=eq.${ctx.businessId}&sale_id=in.(${buildInFilter(saleIds)})&select=*&order=created_at.asc`,
    'Failed to load sale items'
  );
  const itemMap = await getInventoryItemMap(ctx, (saleItems || []).map(function (item) { return item.item_id; }));

  const itemsBySale = {};
  (saleItems || []).forEach(function (item) {
    if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
    itemsBySale[item.sale_id].push({
      ...item,
      item_name: itemMap[item.item_id] ? itemMap[item.item_id].name : null,
      sku: itemMap[item.item_id] ? itemMap[item.item_id].sku : null,
    });
  });

  return rows.map(function (sale) {
    const customer = customerMap[sale.customer_id] || null;
    const items = itemsBySale[sale.id] || [];
    return {
      ...sale,
      customer: customer,
      customer_name: customer ? customer.name : null,
      items: items,
      item_count: items.length,
    };
  });
}
