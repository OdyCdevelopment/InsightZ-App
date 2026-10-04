import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { optionalCustomerAuth, CustomerAuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/clicks - Record store redirect click
router.post('/', optionalCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { product_id, store_id } = req.body;

    if (!product_id) {
      return apiError(res, 'Product ID is required', 400);
    }

    const numericProductId = parseInt(product_id, 10);
    if (isNaN(numericProductId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const product = await prisma.insightz_products.findFirst({
      where: {
        OR: [
          { id: BigInt(numericProductId) },
          { insightz_product_id: numericProductId },
        ],
      },
      select: {
        id: true,
        product_url: true,
        source: true,
      },
    });

    if (!product || !product.product_url) {
      return apiError(res, 'Product URL not found', 404);
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
    const userAgent = (req.headers['user-agent'] as string) || 'Mobile App';

    // Record outlink click
    await prisma.clicks.create({
      data: {
        product_id: product.id,
        store_id: store_id ? parseInt(store_id, 10) : null,
        customer_id: req.customer?.id || null,
        ip_address: ip,
        user_agent: userAgent,
      },
    }).catch(() => {});

    return apiSuccess(res, {
      product_id: Number(product.id),
      redirect_url: product.product_url,
      store: product.source,
    });
  } catch (error: any) {
    console.error('Click tracking error:', error);
    return apiError(res, 'Failed to process click', 500);
  }
});

export default router;
