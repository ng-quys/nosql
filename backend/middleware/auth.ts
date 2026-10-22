import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'freshleaf_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    username?: string;
    email?: string;
  };
}

export function generateToken(user: { id?: string; _id?: string; role: string; username?: string; email?: string }): string {
  const userId = (user.id || user._id || '').toString();
  return jwt.sign(
    {
      userId,
      role: (user.role || 'CUSTOMER').toUpperCase(),
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId || decoded.id,
      role: (decoded.role || 'CUSTOMER').toUpperCase(),
      username: decoded.username,
      email: decoded.email,
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ',
    });
  }
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
