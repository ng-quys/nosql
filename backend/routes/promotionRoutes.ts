import { Router, Request, Response } from 'express';
import { Promotion } from '../models/Promotion';
import { Order } from '../models/Order';
import { isDbConnected } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';
import { calculatePromotionDiscount, getPromotionTerms } from '../utils/orderPricing';

const router = Router();
const TYPES = ['fixed', 'percentage'];
const SCOPES = ['all', 'category', 'products'];

function actualStatus(p: any, now = new Date()) {
  if (p.archivedAt || p.isActive === false || p.status === 'inactive') return 'disabled';
  if (p.startAt && new Date(p.startAt) > now) return 'upcoming';
  if (p.endAt && new Date(p.endAt) < now) return 'expired';
  if (Number(p.usageLimit || 0) > 0 && Number(p.usedCount || 0) >= Number(p.usageLimit)) return 'exhausted';
  return 'active';
}

function formatPromotion(doc: any) {
  const p = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (p._id || p.id || p.code)?.toString();
  const { value, type } = getPromotionTerms(p);
  return {
    id, code: p.code, title: p.title || `Khuyến mãi ${p.code}`, description: p.description || '',
    discountType: type, discountValue: value, minOrderAmount: Number(p.minOrderAmount || 0),
    maxDiscount: Number(p.maxDiscount || 0), startAt: p.startAt, endAt: p.endAt,
    usageLimit: Number(p.usageLimit || 0), perCustomerLimit: Number(p.perCustomerLimit || 0),
    usedCount: Number(p.usedCount || 0), scope: p.scope || 'all', categoryIds: p.categoryIds || [],
    productIds: p.productIds || [], isActive: p.isActive !== false && p.status !== 'inactive',
    status: actualStatus(p), archivedAt: p.archivedAt,
  };
}

function validatePayload(body: any) {
  const errors: string[] = [];
  const type = String(body.discountType || body.type || 'fixed');
  const value = Number(body.discountValue ?? body.discount);
  const min = Number(body.minOrderAmount || 0), max = Number(body.maxDiscount || 0);
  const usage = Number(body.usageLimit || 0), perCustomer = Number(body.perCustomerLimit || 0);
  const scope = String(body.scope || 'all');
  if (!String(body.code || '').trim()) errors.push('Mã giảm giá là bắt buộc');
  if (!Number.isFinite(value) || value <= 0) errors.push('Giá trị giảm phải lớn hơn 0');
  if (!TYPES.includes(type)) errors.push('Loại giảm giá không hợp lệ');
  if (type === 'percentage' && (value < 1 || value > 100)) errors.push('Phần trăm giảm phải từ 1 đến 100');
  if (min < 0 || max < 0) errors.push('Giá trị tiền không được âm');
  if (usage < 0 || perCustomer < 0 || (usage > 0 && perCustomer > usage)) errors.push('Giới hạn sử dụng không hợp lệ');
  if (body.startAt && body.endAt && new Date(body.startAt) >= new Date(body.endAt)) errors.push('Ngày bắt đầu phải trước ngày kết thúc');
  if (!SCOPES.includes(scope)) errors.push('Phạm vi áp dụng không hợp lệ');
  if (scope === 'category' && !body.categoryIds?.length) errors.push('Hãy chọn ít nhất một danh mục');
  if (scope === 'products' && !body.productIds?.length) errors.push('Hãy chọn ít nhất một sản phẩm');
  return errors;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) { res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' }); return; }
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 100)));
    const search = String(req.query.search || '').trim(), type = String(req.query.type || '');
    const status = String(req.query.status || ''), from = String(req.query.from || ''), to = String(req.query.to || '');
    const query: any = { archivedAt: { $exists: false } };
    if (search) query.$or = [{ code: new RegExp(search, 'i') }, { title: new RegExp(search, 'i') }];
    if (from || to) query.startAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
    const docs = await Promotion.find(query).sort({ createdAt: -1 });
    const filtered = docs.filter((doc: any) => (!status || actualStatus(doc) === status) && (!TYPES.includes(type) || getPromotionTerms(doc).type === type));
    const total = filtered.length;
    const data = filtered.slice((page - 1) * limit, page * limit).map(formatPromotion);
    res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const subtotal = Math.max(0, Math.round(Number(req.body.subtotal || 0)));
  const promotion: any = await Promotion.findOne({ code, archivedAt: { $exists: false } });
  if (!promotion) { res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' }); return; }
  const state = actualStatus(promotion);
  const messages: Record<string, string> = { disabled: 'Mã giảm giá đã bị tắt', upcoming: 'Mã giảm giá chưa có hiệu lực', expired: 'Mã giảm giá đã hết hạn', exhausted: 'Mã giảm giá đã hết lượt sử dụng' };
  if (state !== 'active') { res.status(400).json({ success: false, message: messages[state] }); return; }
  const customerKey = req.body.customerKey ? Buffer.from(String(req.body.customerKey)).toString('base64url') : '';
  if (customerKey && Number(promotion.perCustomerLimit || 0) > 0) {
    const used = Number(promotion.usageByCustomer?.get?.(customerKey) ?? promotion.usageByCustomer?.[customerKey] ?? 0);
    if (used >= Number(promotion.perCustomerLimit)) { res.status(400).json({ success: false, message: 'Bạn đã đạt giới hạn sử dụng mã này' }); return; }
  }
  if (subtotal < Number(promotion.minOrderAmount || 0)) { res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${Number(promotion.minOrderAmount).toLocaleString('vi-VN')}đ` }); return; }
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const eligibleSubtotal = items.length && promotion.scope !== 'all' ? items.filter((item: any) => promotion.scope === 'category'
    ? (promotion.categoryIds || []).includes(item.categoryId)
    : (promotion.productIds || []).includes(item.productId)).reduce((sum: number, item: any) => sum + Math.max(0, Number(item.amount || 0)), 0) : subtotal;
  if (eligibleSubtotal <= 0) { res.status(400).json({ success: false, message: 'Giỏ hàng không có sản phẩm thuộc phạm vi áp dụng' }); return; }
  const discount = calculatePromotionDiscount(promotion, eligibleSubtotal);
  res.json({ success: true, data: { promotion: formatPromotion(promotion), discount } });
});

router.post('/', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validatePayload(req.body);
    if (errors.length) { res.status(400).json({ success: false, message: errors[0] }); return; }
    const code = String(req.body.code).trim().toUpperCase();
    if (await Promotion.exists({ code })) { res.status(409).json({ success: false, message: `Mã ${code} đã tồn tại` }); return; }
    const type = req.body.discountType || req.body.type, value = Number(req.body.discountValue ?? req.body.discount);
    const promo = await Promotion.create({ ...req.body, _id: `PROMO_${code}_${Date.now()}`, code,
      type, discountType: type, discount: value, discountValue: value,
      status: req.body.isActive === false ? 'inactive' : 'active',
      startAt: req.body.startAt || undefined, endAt: req.body.endAt || undefined });
    res.status(201).json({ success: true, data: formatPromotion(promo) });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const target: any = await Promotion.findOne({ $or: [{ _id: req.params.id }, { code: req.params.id.toUpperCase() }] });
    if (!target) { res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' }); return; }
    const merged = { ...target.toObject(), ...req.body, code: target.code };
    const errors = validatePayload(merged);
    if (errors.length) { res.status(400).json({ success: false, message: errors[0] }); return; }
    const type = merged.discountType || merged.type, value = Number(merged.discountValue ?? merged.discount);
    Object.assign(target, req.body, { code: target.code, type, discountType: type, discount: value, discountValue: value });
    if (req.body.isActive !== undefined) target.status = req.body.isActive ? 'active' : 'inactive';
    await target.save();
    res.json({ success: true, data: formatPromotion(target) });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const target: any = await Promotion.findOne({ $or: [{ _id: req.params.id }, { code: req.params.id.toUpperCase() }] });
    if (!target) { res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' }); return; }
    const wasUsed = Number(target.usedCount || 0) > 0 || await Order.exists({ promotionCode: target.code });
    if (wasUsed) { target.isActive = false; target.status = 'inactive'; target.archivedAt = new Date(); await target.save(); }
    else await target.deleteOne();
    res.json({ success: true, data: { archived: Boolean(wasUsed) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

export default router;
