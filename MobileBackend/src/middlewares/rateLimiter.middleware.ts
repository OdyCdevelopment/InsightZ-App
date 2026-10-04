import { Request, Response, NextFunction } from 'express';
import { apiError } from '../utils/apiResponse.js';

interface RequestBucket {
  count: number;
  resetTime: number;
}

const ipBuckets = new Map<string, RequestBucket>();

export function rateLimiter(limit: number = 200, windowMs: number = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = ipBuckets.get(ip);

    if (!bucket || now > bucket.resetTime) {
      ipBuckets.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (bucket.count >= limit) {
      return apiError(res, 'Too many requests. Please slow down and try again shortly.', 429);
    }

    bucket.count++;
    next();
  };
}
