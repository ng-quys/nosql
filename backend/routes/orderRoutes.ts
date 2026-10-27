import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { isDbConnected } from '../config/db';
import { Promotion } from '../models/Promotion';
import { AuthRequest, authenticate, authorize, optionalAuthenticate } from '../middleware/auth';
import { calculateItemPrice, calculatePromotionDiscount } from '../utils/orderPricing';

const router = Router();

function formatOrder(doc: any) {
  const o = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (o._id || o.id)?.toString();
  const subtotal = Math.round(Number(o.subtotal || 0));
  const discount = Math.round(Number(o.discount || 0));
  const total = Math.round(Number(o.total ?? o.totalAmount ?? subtotal - discount));

  return {
    id,
    _id: id,
    orderNumber: o.orderNumber || id,
    customerId: o.customerId,
    customerName: o.customerName || 'Khách hàng',
    customerPhone: o.customerPhone || '',
    tableNumber: o.tableNumber ?? 1,
    orderType: o.orderType || 'dine_in',
    items: (o.items || []).map((it: any) => ({
      productId: it.productId,
      qty: Number(it.qty ?? it.quantity ?? 1),
      quantity: Number(it.quantity ?? it.qty ?? 1),
      unitPrice: Math.round(Number(it.unitPrice || 0)),
      amount: Math.round(Number(it.amount ?? (it.unitPrice || 0) * (it.qty ?? it.quantity ?? 1))),
      name: it.name,
      sugar: it.sugar || '100%',
      ice: it.ice || 'regular',
      size: it.size || 'medium',
      boosters: it.boosters || [],
      note: it.note || it.notes || '',
      notes: it.notes || it.note || '',
    })),
    subtotal,
    discount,
    total,
    totalAmount: total,
    status: o.status || 'pending',
    payment: o.payment || 'cash',
    paymentMethod: o.paymentMethod || 'cash',
    paymentStatus: o.paymentStatus || 'paid',
    notes: o.notes || '',
    createdAt: o.createdAt,
  };
}

// GET /api/orders
// Filter by: status, customerId, phone, page, limit
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, customerId, phone, page, limit = '100' } = req.query;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const query: any = {};
    if (req.user?.role === 'CUSTOMER') query.customerId = req.user.userId;
    else if (!['MANAGER', 'STAFF', 'BARISTA'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền xem danh sách đơn hàng' });
      return;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (customerId && req.user?.role !== 'CUSTOMER') {
      query.customerId = customerId;
    }
    if (phone) {
      query.customerPhone = phone;
    }

    const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : 1;
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders.map(formatOrder),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', optionalAuthenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    let order = await Order.findOne({
      $or: [{ _id: id }, { id }, { orderNumber: id }],
    });

    if (!order && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }

    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      return;
    }

    const staffRoles = ['MANAGER', 'STAFF', 'BARISTA'];
    if (!req.user) {
      const suppliedPhone = String(req.query.phone || '').replace(/\D/g, '');
      const orderPhone = String(order.customerPhone || '').replace(/\D/g, '');
      if (!suppliedPhone || !orderPhone || suppliedPhone !== orderPhone) {
        res.status(403).json({ success: false, message: 'Cần số điện thoại đặt hàng để xem đơn này' });
        return;
      }
    }
    if (req.user?.role === 'CUSTOMER' && String(order.customerId || '') !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' });
      return;
    }
    if (req.user && req.user.role !== 'CUSTOMER' && !staffRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' });
      return;
    }

    res.json({
      success: true,
      data: formatOrder(order),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders
// Backend Price Calculation & Validation (Section 13)
// 1. Validate customer if customerId exists.
// 2. Validate every productId.
// 3. Retrieve real prices from products.
// 4. Calculate subtotal on backend.
// 5. Apply discount.
// 6. Calculate total.
// 7. Save the order.
// 8. Return the saved order.
router.post('/', optionalAuthenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      tableNumber = 1,
      orderType = 'dine_in',
      items,
      promotionCode,
      payment = 'cash',
      paymentMethod = 'cash',
      paymentStatus = 'paid',
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Đơn hàng phải chứa ít nhất 1 món uống',
      });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    // 1. Validate customer if customerId exists
    let verifiedCustomerName = customerName || 'Khách hàng';
    let verifiedCustomerPhone = customerPhone || '';

    const effectiveCustomerId = req.user?.role === 'CUSTOMER' ? req.user.userId : customerId;
    if (effectiveCustomerId) {
      const customer = await Customer.findOne({
        $or: [{ _id: effectiveCustomerId }, { id: effectiveCustomerId }],
      });
      if (customer) {
        verifiedCustomerName = customer.name;
        verifiedCustomerPhone = customer.phone || verifiedCustomerPhone;
      }
    }

    // 2 & 3. Validate every productId and retrieve real prices from MongoDB
    const validatedItems: any[] = [];
    let calculatedSubtotal = 0;

    for (const rawItem of items) {
      const pId = rawItem.productId || rawItem.drinkId || rawItem.id;
      if (!pId) {
        res.status(400).json({ success: false, message: 'Thiếu thông tin productId trong món uống' });
        return;
      }

      // Query database for authentic price
      const product = await Product.findOne({
        $or: [{ _id: pId }, { id: pId }],
      });

      if (!product) {
        res.status(400).json({ success: false, message: `Sản phẩm với ID ${pId} không tồn tại` });
        return;
      }

      let priced;
      try {
        priced = calculateItemPrice(Number(product.price ?? product.basePrice ?? 45000), rawItem.size, rawItem.boosters || []);
      } catch (error: any) {
        res.status(400).json({ success: false, message: `${product.name}: ${error.message}` });
        return;
      }
      const realUnitPrice = priced.unitPrice;
      const qty = Math.max(1, Math.floor(Number(rawItem.qty ?? rawItem.quantity ?? 1)));
      const itemAmount = realUnitPrice * qty;
      calculatedSubtotal += itemAmount;

      validatedItems.push({
        productId: (product._id || product.id).toString(),
        name: product.name,
        qty,
        quantity: qty,
        unitPrice: realUnitPrice,
        amount: itemAmount,
        sugar: rawItem.sugar || '100%',
        ice: rawItem.ice || 'regular',
        size: priced.size,
        boosters: priced.boosters,
        note: rawItem.note || rawItem.notes || '',
        notes: rawItem.notes || rawItem.note || '',
      });
    }

    // 4, 5, 6. Backend Subtotal, Discount & Total Calculation
    let cleanDiscount = 0;
    let appliedPromotionCode: string | undefined;
    if (promotionCode) {
      const code = String(promotionCode).trim().toUpperCase();
      const promotion = await Promotion.findOne({ code });
      if (!promotion || promotion.isActive === false || promotion.status === 'inactive') {
        res.status(400).json({ success: false, message: 'Mã khuyến mãi không tồn tại hoặc đã ngừng áp dụng' });
        return;
      }
      cleanDiscount = calculatePromotionDiscount(promotion, calculatedSubtotal);
      if (cleanDiscount <= 0) {
        res.status(400).json({ success: false, message: `Đơn hàng chưa đạt tối thiểu ${Number(promotion.minOrderAmount || 0).toLocaleString('vi-VN')} ₫` });
        return;
      }
      appliedPromotionCode = code;
    }
    const calculatedTotal = Math.max(0, calculatedSubtotal - cleanDiscount);

    // 7. Save Order to MongoDB with collision-resistant ID
    let orderSeq = 1;
    const lastOrder = await Order.findOne({ _id: /^ORD\d+$/ }).sort({ _id: -1 }).select('_id');
    if (lastOrder && typeof lastOrder._id === 'string') {
      const match = lastOrder._id.match(/^ORD(\d+)$/);
      if (match) {
        orderSeq = parseInt(match[1], 10) + 1;
      }
    } else {
      const orderCount = await Order.countDocuments();
      orderSeq = orderCount + 1;
    }
    let orderId = `ORD${String(orderSeq).padStart(6, '0')}`;
    const collisionCheck = await Order.findOne({ _id: orderId });
    if (collisionCheck) {
      orderId = `ORD${Date.now().toString().slice(-8)}`;
    }

    const newOrder = new Order({
      _id: orderId,
      orderNumber: orderId,
      customerId: effectiveCustomerId || undefined,
      customerName: verifiedCustomerName,
      customerPhone: verifiedCustomerPhone,
      tableNumber,
      orderType,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      discount: cleanDiscount,
      total: calculatedTotal,
      totalAmount: calculatedTotal,
      status: 'pending', // Order starts as pending for KDS
      payment,
      paymentMethod,
      paymentStatus,
      notes: [notes, appliedPromotionCode ? `Mã khuyến mãi: ${appliedPromotionCode}` : ''].filter(Boolean).join(' | '),
      createdAt: new Date().toISOString(),
    });

    await newOrder.save();

    // Update customer points / order count if customer registered
    if (verifiedCustomerPhone) {
      const earnedPoints = Math.floor(calculatedTotal / 10000);
      await Customer.findOneAndUpdate(
        { phone: verifiedCustomerPhone },
        {
          $inc: { totalOrders: 1, totalSpent: calculatedTotal, points: earnedPoints, loyaltyPoints: earnedPoints },
          $setOnInsert: { name: verifiedCustomerName },
        },
        { upsert: true }
      );
    }

    // 8. Return the saved order
    res.status(201).json({
      success: true,
      data: formatOrder(newOrder),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo đơn hàng' });
  }
});

// PUT /api/orders/:id/status
// Statuses: pending, preparing, completed, cancelled
router.put('/:id/status', authenticate, authorize('MANAGER', 'STAFF', 'BARISTA'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Cho phép: ${validStatuses.join(', ')}`,
      });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const updated = await Order.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { orderNumber: id }] },
      { status },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng để cập nhật trạng thái' });
      return;
    }

    res.json({
      success: true,
      data: formatOrder(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
