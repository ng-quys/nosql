import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Inventory } from '../models/Inventory';
import { isDbConnected } from '../config/db';

const router = Router();

// GET /api/reports/revenue
// Support: daily, weekly, monthly, custom date range (startDate, endDate)
// Uses real MongoDB aggregation with robust date parsing ($convert)
router.get('/revenue', async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    let dateFormat = '%Y-%m-%d';
    if (period === 'monthly') {
      dateFormat = '%Y-%m';
    } else if (period === 'weekly') {
      dateFormat = '%Y-W%V';
    }

    // Build date filter
    const matchConditions: any = {
      status: { $ne: 'cancelled' },
    };

    const pipeline: any[] = [
      {
        $addFields: {
          parsedDate: {
            $convert: {
              input: '$createdAt',
              to: 'date',
              onError: new Date(),
              onNull: new Date(),
            },
          },
          orderRevenue: {
            $convert: {
              input: { $ifNull: ['$total', '$totalAmount'] },
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    ];

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      matchConditions.parsedDate = dateFilter;
    }

    pipeline.push(
      { $match: matchConditions },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$parsedDate' } },
          revenue: { $sum: '$orderRevenue' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$orderRevenue' },
        },
      },
      { $sort: { _id: 1 } }
    );

    const [timeline, overall] = await Promise.all([
      Order.aggregate(pipeline),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ['$total', '$totalAmount'] } },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: { $ifNull: ['$total', '$totalAmount'] } },
          },
        },
      ]),
    ]);

    const summary = overall[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalRevenue: Math.round(Number(summary.totalRevenue || 0)),
          totalOrders: Number(summary.totalOrders || 0),
          avgOrderValue: Math.round(Number(summary.avgOrderValue || 0)),
        },
        timeline: timeline.map((t) => ({
          date: t._id,
          revenue: Math.round(Number(t.revenue || 0)),
          orders: Number(t.orderCount || 0),
          avg: Math.round(Number(t.avgOrderValue || 0)),
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/top-products
// Aggregates: orders.items.productId, calculates quantity and revenue
// Uses $lookup to products collection
router.get('/top-products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const limitNum = parseInt(limit as string, 10) || 10;

    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $ifNull: ['$items.productId', '$items.drinkId'] },
          rawName: { $first: { $ifNull: ['$items.name', '$items.drink.name'] } },
          quantitySold: { $sum: { $ifNull: ['$items.qty', '$items.quantity'] } },
          totalRevenue: {
            $sum: {
              $ifNull: [
                '$items.amount',
                { $multiply: ['$items.unitPrice', { $ifNull: ['$items.qty', '$items.quantity'] }] },
              ],
            },
          },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'products',
          let: { prodId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$prodId'] },
                    { $eq: ['$id', '$$prodId'] },
                  ],
                },
              },
            },
          ],
          as: 'prodDoc',
        },
      },
      { $unwind: { path: '$prodDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          productId: '$_id',
          name: { $ifNull: ['$prodDoc.name', '$rawName', 'Món uống FreshLeaf'] },
          quantitySold: '$quantitySold',
          revenue: '$totalRevenue',
        },
      },
    ]);

    res.json({
      success: true,
      data: topProducts.map((p) => ({
        id: p.id,
        productId: p.productId,
        name: p.name,
        quantitySold: Number(p.quantitySold || 0),
        revenue: Math.round(Number(p.revenue || 0)),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/orders
// Returns order status metrics and summary
router.get('/orders', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$total', '$totalAmount'] } },
        },
      },
    ]);

    const byStatus: Record<string, number> = {
      pending: 0,
      preparing: 0,
      completed: 0,
      cancelled: 0,
    };

    let totalOrders = 0;
    stats.forEach((s) => {
      byStatus[s._id] = s.count;
      totalOrders += s.count;
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        byStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/inventory
// Calculates total inventory valuation and low-stock count
router.get('/inventory', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const items = await Inventory.aggregate([
      {
        $lookup: {
          from: 'ingredients',
          let: { ingId: '$ingredientId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$ingId'] },
                    { $eq: ['$id', '$$ingId'] },
                  ],
                },
              },
            },
          ],
          as: 'ingDoc',
        },
      },
      { $unwind: { path: '$ingDoc', preserveNullAndEmptyArrays: true } },
    ]);

    const totalItems = items.length;
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    items.forEach((it) => {
      const q = Number(it.quantity || 0);
      const min = Number(it.minStock || 5);
      const cost = Number(it.ingDoc?.costPerUnit || 30000);
      if (q <= min) lowStockCount++;
      totalInventoryValue += q * cost;
    });

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockCount,
        totalInventoryValue: Math.round(totalInventoryValue),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
