import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface CustomerJwtPayload {
  customerId: number;
  email: string;
}

export function signCustomerToken(payload: CustomerJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function verifyCustomerToken(token: string): CustomerJwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as CustomerJwtPayload;
}
