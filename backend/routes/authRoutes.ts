import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { isDbConnected } from '../config/db';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
// Supports login with either username or email
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, identifier, usernameOrEmail, password } = req.body;
    const loginId = (username || email || identifier || usernameOrEmail || '').trim();

    if (!loginId || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập hoặc email và mật khẩu',
      });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({
        success: false,
        message: 'Không thể kết nối MongoDB Atlas để xác thực tài khoản',
      });
      return;
    }

    // Search user by username or email
    const user = await User.findOne({
      $or: [
        { username: loginId },
        { email: loginId.toLowerCase() },
        { name: loginId },
      ],
    });

    if (!user) {
      // Do NOT automatically create a new user or fallback to mock
      res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trên hệ thống',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác',
      });
      return;
    }

    const userId = String(user._id ?? (user as any).id ?? 'U001');
    const role = (user.role || 'CUSTOMER').toUpperCase();
    const token = generateToken({
      id: userId,
      _id: userId,
      role,
      username: user.username,
      email: user.email,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          role,
          name: user.name || user.username || 'Thành viên FreshLeaf',
          email: user.email,
          username: user.username,
          phone: user.phone,
          points: user.points || user.loyaltyPoints || 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi đăng nhập' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, email, password, role = 'CUSTOMER', phone } = req.body;

    if (!password) {
      res.status(400).json({ success: false, message: 'Mật khẩu là bắt buộc' });
      return;
    }

    if (!username && !email) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp username hoặc email' });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({
        success: false,
        message: 'Không thể kết nối MongoDB Atlas để tạo tài khoản',
      });
      return;
    }

    // Check if user already exists
    const queryConditions: any[] = [];
    if (username) queryConditions.push({ username });
    if (email) queryConditions.push({ email: email.toLowerCase() });

    const existing = await User.findOne({ $or: queryConditions });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Tài khoản hoặc email này đã tồn tại',
      });
      return;
    }

    const newUser = new User({
      name: name || username || 'Khách hàng FreshLeaf',
      username: username || (email ? email.split('@')[0] : `user_${Date.now()}`),
      email: email ? email.toLowerCase() : undefined,
      password,
      role: role.toUpperCase(),
      phone: phone || '',
      points: 50,
      loyaltyPoints: 50,
      tier: 'Thành viên Mới',
    });

    await newUser.save();

    const userId = (newUser._id || (newUser as any).id).toString();
    const token = generateToken({
      id: userId,
      _id: userId,
      role: newUser.role,
      username: newUser.username,
      email: newUser.email,
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          role: newUser.role,
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
          phone: newUser.phone,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi đăng ký tài khoản' });
  }
});

// GET /api/auth/me
// Returns current authenticated user based on JWT Bearer token
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    if (isDbConnected()) {
      const orConditions: any[] = [];
      if (req.user.userId) {
        orConditions.push({ _id: req.user.userId });
        orConditions.push({ id: req.user.userId });
      }
      if (req.user.username) {
        orConditions.push({ username: req.user.username });
      }
      if (req.user.email) {
        orConditions.push({ email: req.user.email });
      }

      const user = orConditions.length > 0 ? await User.findOne({ $or: orConditions }) : null;

      if (user) {
        res.json({
          success: true,
          data: {
            id: (user._id || (user as any).id).toString(),
            name: user.name || user.username,
            role: (user.role || 'CUSTOMER').toUpperCase(),
            email: user.email,
            username: user.username,
            phone: user.phone,
            points: user.points || user.loyaltyPoints || 0,
            tier: user.tier || 'Thành viên Mới',
          },
        });
        return;
      }
    }

    // Return decoded token info if db is busy or user doc not found
    res.json({
      success: true,
      data: {
        id: req.user.userId,
        role: req.user.role,
        username: req.user.username,
        email: req.user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi xác thực' });
  }
});

// POST /api/auth/token
// Session helper for testing roles
router.post('/token', (req: Request, res: Response): void => {
  const { role = 'CUSTOMER', userId, username } = req.body;
  const targetRole = String(role).toUpperCase();
  const targetUserId = userId || `usr_${targetRole.toLowerCase()}`;
  const targetUsername = username || `user_${targetRole.toLowerCase()}`;

  const token = generateToken({
    id: targetUserId,
    _id: targetUserId,
    role: targetRole,
    username: targetUsername,
    email: `${targetRole.toLowerCase()}@freshleaf.vn`,
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: targetUserId,
        role: targetRole,
        username: targetUsername,
        name: targetRole === 'MANAGER' ? 'Quản lý cửa hàng' : targetRole === 'BARISTA' ? 'Nhân viên pha chế' : targetRole === 'STAFF' ? 'Thu ngân' : 'Khách hàng',
      },
    },
  });
});

export default router;
