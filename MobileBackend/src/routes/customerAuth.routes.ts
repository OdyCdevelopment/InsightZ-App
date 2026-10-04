import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { signCustomerToken } from '../utils/jwt.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { requireCustomerAuth, CustomerAuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/customers/register
router.post('/register', async (req, res: Response) => {
  try {
    const { first_name, last_name, email, phone } = req.body;

    if (!first_name || !last_name || !email) {
      return apiError(res, 'Please provide first name, last name, and email.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.customers.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return apiError(res, 'An account with this email address already exists. Please log in.', 409);
    }

    const customer = await prisma.customers.create({
      data: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        status: 'active',
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        status: true,
        created_at: true,
      },
    });

    // Auto-create initial loyalty wallet
    await prisma.loyalty_wallets.create({
      data: {
        customer_id: customer.id,
        tier: 'Bronze',
        balance: 0.0,
        lifetime_cashback: 0.0,
      },
    }).catch(() => {});

    // Log registration activity
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
    await prisma.customer_activity_log.create({
      data: {
        customer_id: customer.id,
        action: 'Account Registered via Mobile App',
        device: (req.headers['user-agent'] as string) || 'Mobile App',
        ip_address: ip,
      },
    }).catch(() => {});

    const token = signCustomerToken({ customerId: customer.id, email: customer.email });

    return apiSuccess(
      res,
      {
        customer,
        token,
      },
      'Account created successfully',
      201
    );
  } catch (error: any) {
    console.error('Customer registration error:', error);
    return apiError(res, error.message || 'Registration failed', 500);
  }
});

// POST /api/v1/customers/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return apiError(res, 'Email address is required.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const customer = await prisma.customers.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      return apiError(res, 'Account not found with this email. Please sign up.', 404);
    }

    if (customer.is_banned || customer.gdpr_deleted || customer.status === 'banned') {
      return apiError(res, 'This account has been deactivated or suspended.', 403);
    }

    // Update last active
    await prisma.customers.update({
      where: { id: customer.id },
      data: { last_active_at: new Date() },
    });

    // Log login activity
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
    await prisma.customer_activity_log.create({
      data: {
        customer_id: customer.id,
        action: 'Logged In via Mobile App',
        device: (req.headers['user-agent'] as string) || 'Mobile App',
        ip_address: ip,
      },
    }).catch(() => {});

    const token = signCustomerToken({ customerId: customer.id, email: customer.email });

    return apiSuccess(
      res,
      {
        customer: {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          avatar_url: customer.avatar_url,
          status: customer.status,
        },
        token,
      },
      'Login successful'
    );
  } catch (error: any) {
    console.error('Customer login error:', error);
    return apiError(res, 'Login failed', 500);
  }
});

// GET /api/v1/customers/me
router.get('/me', requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;

    const [customer, savedCount, reviewsCount, wallet] = await Promise.all([
      prisma.customers.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          avatar_url: true,
          status: true,
          orders: true,
          total_spent: true,
          created_at: true,
        },
      }),
      prisma.customer_saved_items.count({
        where: { customer_id: customerId },
      }),
      prisma.reviews.count({
        where: { customer_id: customerId },
      }),
      prisma.loyalty_wallets.findUnique({
        where: { customer_id: customerId },
      }),
    ]);

    if (!customer) {
      return apiError(res, 'Customer not found', 404);
    }

    return apiSuccess(res, {
      ...customer,
      stats: {
        wishlist_count: savedCount,
        reviews_count: reviewsCount,
        loyalty_tier: wallet?.tier || 'Bronze',
        loyalty_balance: wallet?.balance ? Number(wallet.balance) : 0,
        lifetime_cashback: wallet?.lifetime_cashback ? Number(wallet.lifetime_cashback) : 0,
      },
    });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch customer profile', 500);
  }
});

// PUT /api/v1/customers/me
router.put('/me', requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;
    const { first_name, last_name, phone, avatar_url } = req.body;

    const updated = await prisma.customers.update({
      where: { id: customerId },
      data: {
        ...(first_name ? { first_name: first_name.trim() } : {}),
        ...(last_name ? { last_name: last_name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(avatar_url !== undefined ? { avatar_url } : {}),
        updated_at: new Date(),
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        updated_at: true,
      },
    });

    return apiSuccess(res, updated, 'Profile updated successfully');
  } catch (error: any) {
    return apiError(res, 'Failed to update customer profile', 500);
  }
});

// GET /api/v1/customers/activity
router.get('/activity', requireCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;
    const logs = await prisma.customer_activity_log.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return apiSuccess(res, logs);
  } catch (error: any) {
    return apiError(res, 'Failed to fetch customer activity', 500);
  }
});

export default router;
