import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || 'Lỗi xử lý yêu cầu máy chủ';

  // Do not expose MongoDB URI, secrets, or internal stack traces
  res.status(statusCode).json({
    success: false,
    message,
  });
}
