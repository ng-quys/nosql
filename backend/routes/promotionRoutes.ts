import { Router, Request, Response } from 'express';
import { Promotion } from '../models/Promotion';
import { isDbConnected } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';
import { calculatePromotionDiscount } from '../utils/orderPricing';

const router = Router();

function formatPromotion(doc: any) {
  const p = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (p._id || p.id || p.code)?.toString();
  const discountVal = Number(p.discount ?? p.discountValue ?? 10000);
  const discType = p.type || p.discountType || 'fixed';
  const statusVal = p.status || (p.isActive !== false ? 'active' : 'inactive');

  return {
    id,
    _id: id,
    code: p.code,
    title: p.title || `Khuyến mãi ${p.code} (-${discType === 'percentage' ? `${discountVal}%` : `${discountVal.toLocaleString('vi-VN')} ₫`})`,
    description: p.description || 'Ưu đãi dành cho đồ uống FreshLeaf',
    discount: discountVal,
    discountValue: discountVal,
    type: discType,
    discountType: discType,
    minOrderAmount: Number(p.minOrderAmount || 0),
    maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : undefined,
    status: statusVal,
    isActive: statusVal === 'active',
  };
}

// GET /api/promotions
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { active } = req.query;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const query: any = {};
    if (active === 'true') {
      query.$or = [{ status: 'active' }, { isActive: true }];
    }

    const promotions = await Promotion.find(query);

    res.json({
      success: true,
      data: promotions.map(formatPromotion),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const subtotal = Math.max(0, Math.round(Number(req.body.subtotal || 0)));
  const promotion = await Promotion.findOne({ code });
  if (!promotion || promotion.isActive === false || promotion.status === 'inactive') {
    res.status(404).json({ success: false, message: 'Mã khuyến mãi không tồn tại hoặc đã hết hiệu lực' });
    return;
  }
  const discount = calculatePromotionDiscount(promotion, subtotal);
  if (discount <= 0) {
    res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${Number(promotion.minOrderAmount || 0).toLocaleString('vi-VN')} ₫` });
    return;
  }
  res.json({ success: true, data: { promotion: formatPromotion(promotion), discount } });
});

// POST /api/promotions
router.post('/', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, title, description, discount, discountValue, type, discountType, minOrderAmount } = req.body;

    if (!code || (discount === undefined && discountValue === undefined)) {
      res.status(400).json({
        success: false,
        message: 'Mã khuyến mãi và giá trị giảm giá là bắt buộc',
      });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const promoCode = code.trim().toUpperCase();
    const existing = await Promotion.findOne({
      $or: [{ code: promoCode }, { _id: promoCode }],
    });
    if (existing) {
      res.status(409).json({ success: false, message: `Mã khuyến mãi ${promoCode} đã tồn tại` });
      return;
    }

    const disc = Number(discount ?? discountValue);
    const t = type || discountType || 'fixed';

    const promo = new Promotion({
      _id: `PROMO_${promoCode}`,
      code: promoCode,
      title: title || `Khuyến mãi ${promoCode}`,
      description: description || '',
      discount: disc,
      discountValue: disc,
      type: t,
      discountType: t,
      minOrderAmount: Number(minOrderAmount || 0),
      status: 'active',
      isActive: true,
    });

    await promo.save();

    res.status(201).json({
      success: true,
      data: formatPromotion(promo),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/promotions/:id
router.put('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.discount !== undefined || updates.discountValue !== undefined) {
      const d = Number(updates.discount ?? updates.discountValue);
      updates.discount = d;
      updates.discountValue = d;
    }
    if (updates.type || updates.discountType) {
      const t = updates.type || updates.discountType;
      updates.type = t;
      updates.discountType = t;
    }
    if (updates.status || updates.isActive !== undefined) {
      const s = updates.status || (updates.isActive ? 'active' : 'inactive');
      updates.status = s;
      updates.isActive = s === 'active';
    }

    const updated = await Promotion.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { code: id.toUpperCase() }] },
      updates,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy mã khuyến mãi' });
      return;
    }

    res.json({
      success: true,
      data: formatPromotion(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/promotions/:id
router.delete('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Promotion.findOneAndDelete({
      $or: [{ _id: id }, { id }, { code: id.toUpperCase() }],
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi để xóa' });
      return;
    }

    res.json({
      success: true,
      data: { message: `Đã xóa mã khuyến mãi ${id} thành công` },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
