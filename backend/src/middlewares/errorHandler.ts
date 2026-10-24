import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: (err as any).errors,
    });
  }

  // Mongoose schema validation -> 400 instead of a generic 500
  if (err.name === 'ValidationError') {
    const details = Object.values((err as any).errors || {}).map((e: any) => e?.message).filter(Boolean);
    return res.status(400).json({
      status: 'error',
      message: details[0] || 'البيانات المُرسلة غير صالحة',
      errors: details,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'معرّف غير صالح',
    });
  }

  // Duplicate key (e.g. repeated coupon code / phone number)
  if ((err as any).code === 11000) {
    const fields = Object.keys((err as any).keyValue || {});
    return res.status(400).json({
      status: 'error',
      message: fields.length
        ? `القيمة مستخدمة مسبقاً: ${fields.join(', ')}`
        : 'هذه القيمة مستخدمة مسبقاً',
    });
  }

  console.error('Unhandled Exception:', err);

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
