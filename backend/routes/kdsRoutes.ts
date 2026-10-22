import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { isDbConnected } from '../config/db';

const router = Router();

function formatKdsOrder(doc: any) {
  const o = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (o._id || o.id)?.toString();
  return {
    id,
    _id: id,
    orderNumber: o.orderNumber || id,
    customerName: o.customerName || 'Khách hàng',
    tableNumber: o.tableNumber ?? 1,
    orderType: o.orderType || 'dine_in',
    items: (o.items || []).map((it: any) => ({
      productId: it.productId,
      name: it.name || 'Món uống',
      qty: Number(it.qty ?? it.quantity ?? 1),
      quantity: Number(it.quantity ?? it.qty ?? 1),
      sugar: it.sugar || '100%',
      ice: it.ice || 'regular',
      size: it.size || 'medium',
      note: it.note || it.notes || '',
      boosters: it.boosters || [],
    })),
    status: o.status,
    createdAt: o.createdAt,
    notes: o.notes || '',
  };
}

// GET /api/kds/orders
// Retrieves real pending and preparing orders from MongoDB Atlas
router.get('/orders', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    // Orders active in KDS: pending, preparing, and recently completed
    const orders = await Order.find({
      status: { $in: ['pending', 'preparing', 'completed'] },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: orders.map(formatKdsOrder),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/kds/orders/:id/start
// Transition: pending -> preparing
router.put('/orders/:id/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const updated = await Order.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { orderNumber: id }] },
      { status: 'preparing' },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      return;
    }

    res.json({
      success: true,
      data: formatKdsOrder(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/kds/orders/:id/complete
// Transition: preparing -> completed
router.put('/orders/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const updated = await Order.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { orderNumber: id }] },
      { status: 'completed' },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      return;
    }

    res.json({
      success: true,
      data: formatKdsOrder(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
