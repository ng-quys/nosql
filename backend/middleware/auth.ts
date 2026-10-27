import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET chưa được cấu hình hoặc ngắn hơn 32 ký tự');
  }
  return secret;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    username?: string;
    email?: string;
    tokenVersion?: number;
  };
}

export function generateToken(user: { id?: string; _id?: string; role: string; username?: string; email?: string; tokenVersion?: number }): string {
  const userId = (user.id || user._id || '').toString();
  return jwt.sign(
    {
      userId,
      role: (user.role || 'CUSTOMER').toUpperCase(),
      username: user.username,
      email: user.email,
      tokenVersion: Number(user.tokenVersion || 0),
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để tiếp tục (Thiếu token xác thực)',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const account = await User.findOne({ _id: decoded.userId }).select('role username email isActive tokenVersion');
    if (!account || account.isActive === false) {
      res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
      return;
    }
    if (Number(account.tokenVersion || 0) !== Number(decoded.tokenVersion || 0)) {
      res.status(401).json({ success: false, message: 'Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại' });
      return;
    }
    req.user = {
      userId: String(account._id),
      role: (account.role || 'CUSTOMER').toUpperCase(),
      username: account.username,
      email: account.email,
      tokenVersion: Number(account.tokenVersion || 0),
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ',
    });
  }
}

export async function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.headers.authorization) {
    next();
    return;
  }
  await authenticate(req, res, next);
}

export function authorize(...allowedRoles: string[]) {
  const normalized = allowedRoles.map((r) => r.toUpperCase());
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      return;
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (!normalized.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    next();
  };
}
