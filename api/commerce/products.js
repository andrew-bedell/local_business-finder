import {
  getCommerceContext,
  ensureManager,
  selectRows,
  insertRows,
  patchRows,
  toNumber,
  sanitizeText,
  recordInventoryMovement,
} from '../_lib/commerce.js';

function buildProductPayload(body, businessId) {
  return {
    business_id: businessId,
    primary_supplier_id: body.primary_supplier_id || null,
    name: sanitizeText(body.name),
    sku: sanitizeText(body.sku),
    barcode: sanitizeText(body.barcode),
    description: sanitizeText(body.description),
    category: sanitizeText(body.category),
    unit_name: sanitizeText(body.unit_name) || 'pieza',
    sale_price: Math.max(0, toNumber(body.sale_price, 0)),
    cost_price: Math.max(0, toNumber(body.cost_price, 0)),
    currency: body.currency || 'MXN',
    reorder_point: Math.max(0, toNumber(body.reorder_point, 0)),
    reorder_quantity: Math.max(0, toNumber(body.reorder_quantity, 0)),
    track_inventory: body.track_inventory !== false,
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
      let path = `inventory_items?business_id=eq.${ctx.businessId}&select=*&order=category.asc,name.asc`;
      if (!showInactive) path += '&is_active=eq.true';
      const items = await selectRows(ctx, path, 'Failed to load inventory items');
      return res.status(200).json(items || []);
    }

    ensureManager(ctx.role, 'Only owner or manager can manage inventory');

    if (req.method === 'POST') {
      const payload = buildProductPayload(req.body || {}, ctx.businessId);
      if (!payload.name) {
        return res.status(400).json({ error: 'name is required' });
      }

      const initialStock = payload.track_inventory
        ? Math.max(0, toNumber((req.body || {}).initial_stock, toNumber((req.body || {}).current_stock, 0)))
        : 0;
      payload.current_stock = initialStock;

      const created = await insertRows(ctx, 'inventory_items', payload, 'Failed to create inventory item');
      const item = created && created[0];

      if (item && initialStock > 0) {
        await recordInventoryMovement(ctx, {
          itemId: item.id,
          movementType: 'opening_balance',
          direction: 'in',
          quantity: initialStock,
          unitCost: item.cost_price,
          notes: 'Initial stock balance',
          referenceType: 'manual',
        });
      }

      return res.status(201).json(item || {});
    }

    const itemId = req.method === 'DELETE'
      ? (req.query.id || (req.body && req.body.id))
      : (req.body && req.body.id);

    if (!itemId) {
      return res.status(400).json({ error: 'id is required' });
    }

    const existingRows = await selectRows(
      ctx,
      `inventory_items?business_id=eq.${ctx.businessId}&id=eq.${itemId}&select=*`,
      'Failed to load inventory item'
    );
    const existing = existingRows && existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (req.method === 'DELETE') {
      await patchRows(ctx, 'inventory_items', `id=eq.${itemId}`, { is_active: false }, 'Failed to archive inventory item');
      return res.status(200).json({ success: true });
    }

    const updatePayload = buildProductPayload(req.body || {}, ctx.businessId);
    delete updatePayload.business_id;
    if (!updatePayload.name) delete updatePayload.name;

    let stockAdjustment = toNumber((req.body || {}).stock_adjustment, 0);
    if ((req.body || {}).current_stock != null && (req.body || {}).stock_adjustment == null) {
      stockAdjustment = toNumber((req.body || {}).current_stock, 0) - toNumber(existing.current_stock, 0);
    }

    if (stockAdjustment !== 0) {
      const newStock = toNumber(existing.current_stock, 0) + stockAdjustment;
      if (newStock < 0) {
        return res.status(400).json({ error: 'Stock adjustment would make inventory negative' });
      }
      updatePayload.current_stock = newStock;
    }

    const updatedRows = await patchRows(
      ctx,
      'inventory_items',
      `id=eq.${itemId}`,
      updatePayload,
      'Failed to update inventory item'
    );
    const updated = updatedRows && updatedRows[0];

    if (updated && stockAdjustment !== 0) {
      await recordInventoryMovement(ctx, {
        itemId: updated.id,
        movementType: 'manual_adjustment',
        direction: stockAdjustment > 0 ? 'in' : 'out',
        quantity: Math.abs(stockAdjustment),
        unitCost: updated.cost_price,
        notes: sanitizeText((req.body || {}).adjustment_reason) || 'Manual stock adjustment',
        referenceType: 'manual',
      });
    }

    return res.status(200).json(updated || {});
  } catch (err) {
    console.error('Commerce products error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
