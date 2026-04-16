import {
  getCommerceContext,
  selectRows,
  enrichPurchaseOrders,
  enrichSales,
  toNumber,
  getTodayDate,
} from '../_lib/commerce.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = await getCommerceContext(req);
    const today = getTodayDate();

    const [products, suppliers, purchaseOrders, sales] = await Promise.all([
      selectRows(
        ctx,
        `inventory_items?business_id=eq.${ctx.businessId}&is_active=eq.true&select=*&order=category.asc,name.asc`,
        'Failed to load inventory items'
      ),
      selectRows(
        ctx,
        `suppliers?business_id=eq.${ctx.businessId}&is_active=eq.true&select=*&order=name.asc`,
        'Failed to load suppliers'
      ),
      selectRows(
        ctx,
        `purchase_orders?business_id=eq.${ctx.businessId}&select=*&order=created_at.desc`,
        'Failed to load purchase orders'
      ),
      selectRows(
        ctx,
        `sales?business_id=eq.${ctx.businessId}&select=*&order=sold_at.desc`,
        'Failed to load sales'
      ),
    ]);

    const enrichedPurchaseOrders = await enrichPurchaseOrders(ctx, purchaseOrders || []);
    const enrichedSales = await enrichSales(ctx, sales || []);

    const lowStockItems = (products || []).filter(function (item) {
      return item.track_inventory !== false
        && toNumber(item.reorder_point, 0) > 0
        && toNumber(item.current_stock, 0) <= toNumber(item.reorder_point, 0);
    });

    const openPayables = enrichedPurchaseOrders.filter(function (order) {
      return order.status !== 'cancelled' && toNumber(order.balance_due, 0) > 0;
    });

    const openReceivables = enrichedSales.filter(function (sale) {
      return sale.status === 'completed' && toNumber(sale.balance_due, 0) > 0;
    });

    const todaySales = enrichedSales.filter(function (sale) {
      return sale.status === 'completed' && String(sale.sold_at || '').slice(0, 10) === today;
    });

    const inventoryValue = (products || []).reduce(function (sum, item) {
      return sum + (toNumber(item.current_stock, 0) * toNumber(item.cost_price, 0));
    }, 0);

    const summary = {
      inventoryItems: (products || []).length,
      stockUnits: (products || []).reduce(function (sum, item) { return sum + toNumber(item.current_stock, 0); }, 0),
      inventoryValue: inventoryValue,
      lowStockCount: lowStockItems.length,
      supplierCount: (suppliers || []).length,
      openPurchaseOrders: enrichedPurchaseOrders.filter(function (order) {
        return order.status !== 'cancelled' && order.status !== 'received';
      }).length,
      accountsPayable: openPayables.reduce(function (sum, order) {
        return sum + toNumber(order.balance_due, 0);
      }, 0),
      accountsReceivable: openReceivables.reduce(function (sum, sale) {
        return sum + toNumber(sale.balance_due, 0);
      }, 0),
      todaySalesCount: todaySales.length,
      todaySalesTotal: todaySales.reduce(function (sum, sale) {
        return sum + toNumber(sale.total_amount, 0);
      }, 0),
      currency: (products && products[0] && products[0].currency)
        || (openPayables[0] && openPayables[0].currency)
        || (openReceivables[0] && openReceivables[0].currency)
        || 'MXN',
    };

    return res.status(200).json({
      summary,
      lowStockItems: lowStockItems.slice(0, 8),
      openPayables: openPayables.slice(0, 10),
      openReceivables: openReceivables.slice(0, 10),
      recentSales: enrichedSales.slice(0, 10),
      recentPurchaseOrders: enrichedPurchaseOrders.slice(0, 10),
    });
  } catch (err) {
    console.error('Commerce overview error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}
