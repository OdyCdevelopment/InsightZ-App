import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { requireCustomerAuth, CustomerAuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireCustomerAuth);

// GET /api/v1/wallet - Customer loyalty wallet & transaction history
router.get('/', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;

    let wallet = await prisma.loyalty_wallets.findUnique({
      where: { customer_id: customerId },
      include: {
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.loyalty_wallets.create({
        data: {
          customer_id: customerId,
          tier: 'Bronze',
          balance: 0.0,
          lifetime_cashback: 0.0,
        },
        include: {
          transactions: true,
        },
      });
    }

    return apiSuccess(res, {
      id: wallet.id,
      tier: wallet.tier,
      balance: Number(wallet.balance),
      lifetime_cashback: Number(wallet.lifetime_cashback),
      last_redemption_at: wallet.last_redemption_at,
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        direction: t.direction,
        amount: Number(t.amount),
        reason: t.reason,
        created_at: t.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Wallet error:', error);
    return apiError(res, 'Failed to fetch loyalty wallet', 500);
  }
});

export default router;
