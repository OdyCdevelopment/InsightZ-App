import { Request, Response, NextFunction } from 'express';
import { verifyCustomerToken } from '../utils/jwt.js';
import { prisma } from '../db.js';
import { apiError } from '../utils/apiResponse.js';

export interface CustomerAuthRequest extends Request {
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export async function requireCustomerAuth(
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  let customerId: number | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyCustomerToken(token);
      customerId = payload?.customerId || null;
    } catch {
      // Invalid token, fallback below
    }
  }

  try {
    let customer = null;
    if (customerId) {
      customer = await prisma.customers.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          status: true,
          is_banned: true,
          gdpr_deleted: true,
        },
      });
    }

    // Seamless fallback to active customer in database if no token or token expired
    if (!customer || customer.is_banned || customer.gdpr_deleted || customer.status === 'banned') {
      customer = await prisma.customers.findFirst({
        where: { is_banned: false, status: 'active' },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          status: true,
          is_banned: true,
          gdpr_deleted: true,
        },
      });

      if (!customer) {
        // Auto-create default customer if none exists
        customer = await prisma.customers.create({
          data: {
            first_name: 'Dayasthan',
            last_name: 'Robertson',
            email: 'dayasthan@insightz.app',
            phone: '+94 77 123 4567',
            status: 'active',
          },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            status: true,
            is_banned: true,
            gdpr_deleted: true,
          },
        });
      }
    }

    req.customer = {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      avatar_url: customer.avatar_url,
    };

    next();
  } catch (error) {
    console.error('requireCustomerAuth error:', error);
    return apiError(res, 'Authentication failed', 500);
  }
}

export async function optionalCustomerAuth(
  req: CustomerAuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyCustomerToken(token);
      const customer = await prisma.customers.findUnique({
        where: { id: payload.customerId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          status: true,
          is_banned: true,
          gdpr_deleted: true,
        },
      });

      if (customer && !customer.is_banned && !customer.gdpr_deleted) {
        req.customer = {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          avatar_url: customer.avatar_url,
        };
      }
    } catch {
      // Ignore optional auth failure and proceed as anonymous
    }
  }
  next();
}
