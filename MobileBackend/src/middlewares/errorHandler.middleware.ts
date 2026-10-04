import { Request, Response, NextFunction } from 'express';
import { apiError } from '../utils/apiResponse.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[MobileBackend Error]:', err);

  if (err.name === 'ZodError') {
    return apiError(res, 'Validation error', 422, err.errors);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected server error occurred';

  return apiError(res, message, statusCode);
}
