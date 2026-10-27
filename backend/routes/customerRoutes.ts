import { Router, Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { isDbConnected } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

function formatCustomer(doc: any) {
  const c = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (c._id || c.id)?.toString();
  const points = Number(c.points ?? c.loyaltyPoints ?? 0);
  return {
    id,
    _id: id,
    name: c.name,
    phone: c.phone,
    points,
    loyaltyPoints: points,
    email: c.email || '',
    tier: c.tier || 'Thành viên Mới',
    address: c.address || '',
    totalOrders: Number(c.totalOrders ?? 0),
    totalSpent: Number(c.totalSpent ?? 0),
    createdAt: c.createdAt,
  };
}

// GET /api/customers
// Search by: name, phone
router.get('/', authenticate, authorize('MANAGER', 'STAFF'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, name, phone } = req.query;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const query: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { phone: regex }];
    } else {
      if (name && typeof name === 'string') query.name = new RegExp(name.trim(), 'i');
      if (phone && typeof phone === 'string') query.phone = new RegExp(phone.trim(), 'i');
    }

    const pageNum = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
    const limitNum = req.query.limit ? Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10))) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ points: -1, createdAt: -1 }).skip(skip).limit(limitNum),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: customers.map(formatCustomer),
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

// GET /api/customers/:id
router.get('/:id', authenticate, authorize('MANAGER', 'STAFF'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    let customer = await Customer.findOne({
      $or: [{ _id: id }, { id }, { phone: id }],
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
      return;
    }

    res.json({
      success: true,
      data: formatCustomer(customer),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/customers
router.post('/', authenticate, authorize('MANAGER', 'STAFF'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, points, loyaltyPoints, email, address, tier } = req.body;
    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Tên và số điện thoại là bắt buộc' });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const nextId = `C${String(Math.floor(10000 + Math.random() * 90000))}`;
    const pts = Number(points ?? loyaltyPoints ?? 0);

    const customer = new Customer({
      _id: nextId,
      name,
      phone,
      points: pts,
      loyaltyPoints: pts,
      email: email || '',
      address: address || '',
      tier: tier || 'Thành viên Mới',
    });

    await customer.save();
    res.status(201).json({
      success: true,
      data: formatCustomer(customer),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, authorize('MANAGER', 'STAFF'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Customer.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { phone: id }] },
      updates,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng để cập nhật' });
      return;
    }

    res.json({
      success: true,
      data: formatCustomer(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
