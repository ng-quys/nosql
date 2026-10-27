import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { User } from '../models/User';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';

const router = Router();
const ROLES = ['CUSTOMER', 'STAFF', 'BARISTA', 'MANAGER'];

router.use(authenticate, authorize('MANAGER'));

function formatUser(user: any) {
  return {
    id: String(user._id),
    name: user.name || user.username,
    username: user.username,
    email: user.email,
    phone: user.phone || '',
    role: String(user.role || 'CUSTOMER').toUpperCase(),
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const search = String(req.query.search || '').trim();
  const role = String(req.query.role || '').toUpperCase();
  const status = String(req.query.status || '');
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const query: any = {};
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safe, 'i');
    query.$or = [{ name: regex }, { username: regex }, { email: regex }, { phone: regex }];
  }
  if (ROLES.includes(role)) query.role = new RegExp(`^${role}$`, 'i');
  if (status === 'active') query.isActive = { $ne: false };
  if (status === 'locked') query.isActive = false;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query),
  ]);
  res.json({ success: true, data: users.map(formatUser), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, username, email, phone, password, role = 'STAFF' } = req.body;
  const normalizedRole = String(role).toUpperCase();
  if (!name || !username || !password || password.length < 8 || !ROLES.includes(normalizedRole)) {
    res.status(400).json({ success: false, message: 'Cần họ tên, username, mật khẩu từ 8 ký tự và vai trò hợp lệ' });
    return;
  }
  const duplicate = await User.findOne({ $or: [{ username }, ...(email ? [{ email: String(email).toLowerCase() }] : [])] });
  if (duplicate) {
    res.status(409).json({ success: false, message: 'Username hoặc email đã tồn tại' });
    return;
  }
  const user = new User({
    _id: `USR_${randomUUID()}`,
    name: String(name).trim(),
    username: String(username).trim(),
    email: email ? String(email).trim().toLowerCase() : undefined,
    phone: phone ? String(phone).trim() : '',
    password,
    role: normalizedRole,
    isActive: true,
    tokenVersion: 0,
  });
  await user.save();
  res.status(201).json({ success: true, data: formatUser(user) });
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const target = await User.findOne({ _id: req.params.id });
  if (!target) {
    res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    return;
  }
  const currentRole = String(target.role).toUpperCase();
  if (req.body.role !== undefined && String(req.body.role).toUpperCase() !== currentRole) {
    res.status(400).json({ success: false, message: 'Vai trò của tài khoản là cố định và không thể thay đổi' });
    return;
  }
  const nextRole = currentRole;
  const nextActive = req.body.isActive === undefined ? target.isActive !== false : Boolean(req.body.isActive);
  if (!ROLES.includes(nextRole)) {
    res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
    return;
  }
  if (String(target._id) === req.user?.userId && (nextRole !== 'MANAGER' || !nextActive)) {
    res.status(400).json({ success: false, message: 'Không thể tự hạ quyền hoặc khóa tài khoản đang đăng nhập' });
    return;
  }
  if (String(target.role).toUpperCase() === 'MANAGER' && (nextRole !== 'MANAGER' || !nextActive)) {
    const managerCount = await User.countDocuments({ role: /^MANAGER$/i, isActive: { $ne: false } });
    if (managerCount <= 1) {
      res.status(400).json({ success: false, message: 'Phải giữ lại ít nhất một tài khoản quản lý đang hoạt động' });
      return;
    }
  }
  ['name', 'phone'].forEach((field) => {
    if (req.body[field] !== undefined) (target as any)[field] = String(req.body[field]).trim();
  });
  target.role = nextRole;
  target.isActive = nextActive;
  target.tokenVersion = Number(target.tokenVersion || 0) + 1;
  await target.save();
  res.json({ success: true, data: formatUser(target) });
});

router.put('/:id/password', async (req: AuthRequest, res: Response): Promise<void> => {
  const password = String(req.body.password || '');
  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
    return;
  }
  const target = await User.findOne({ _id: req.params.id });
  if (!target) {
    res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    return;
  }
  target.password = password;
  target.tokenVersion = Number(target.tokenVersion || 0) + 1;
  await target.save();
  res.json({ success: true, data: { message: 'Đã đặt lại mật khẩu và thu hồi các phiên đăng nhập cũ' } });
});

export default router;
