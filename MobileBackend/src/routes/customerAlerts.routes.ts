import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { requireCustomerAuth, CustomerAuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// Price alerts require customer authentication
router.use(requireCustomerAuth);

// GET /api/v1/alerts - Get all active price alerts for customer
router.get('/', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;

    const alertItems = await prisma.customer_saved_items.findMany({
      where: {
        customer_id: customerId,
        price_alert_threshold: { not: null },
      },
      include: {
        product: {
          select: {
            id: true,
            insightz_product_id: true,
            title: true,
            source: true,
            vendor: true,
            price: true,
            compare_at_price: true,
            currency: true,
            image_url: true,
            product_url: true,
            available: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = alertItems.map((item) => {
      const p = item.product;
      const currentPrice = Number(p.price);
      const targetPrice = Number(item.price_alert_threshold);
      const difference = currentPrice - targetPrice;
      const isTargetMet = currentPrice <= targetPrice;

      return {
        id: item.id,
        product_id: Number(item.product_id),
        target_price: targetPrice,
        current_price: currentPrice,
        is_target_met: isTargetMet,
        difference_to_target: Number(difference.toFixed(2)),
        product: {
          id: Number(p.id),
          insightz_product_id: p.insightz_product_id,
          title: p.title,
          store: p.source,
          vendor: p.vendor,
          price: currentPrice,
          currency: p.currency,
          image_url: p.image_url,
          product_url: p.product_url,
          available: p.available,
        },
      };
    });

    return apiSuccess(res, formatted, 'Price alerts retrieved successfully', 200, {
      total: formatted.length,
      alerts_triggered: formatted.filter((a) => a.is_target_met).length,
    });
  } catch (error: any) {
    console.error('Alerts fetch error:', error);
    return apiError(res, 'Failed to retrieve price alerts', 500);
  }
});

// POST /api/v1/alerts - Create or update a price drop alert
router.post('/', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;
    const { product_id, target_price } = req.body;

    if (!product_id || target_price === undefined) {
      return apiError(res, 'Product ID and target price are required', 400);
    }

    const numericProductId = parseInt(product_id, 10);
    const parsedTarget = parseFloat(target_price);

    if (isNaN(numericProductId) || isNaN(parsedTarget) || parsedTarget <= 0) {
      return apiError(res, 'Valid product ID and positive target price are required', 400);
    }

    const product = await prisma.insightz_products.findFirst({
      where: {
        OR: [
          { id: BigInt(numericProductId) },
          { insightz_product_id: numericProductId },
        ],
      },
    });

    if (!product) {
      return apiError(res, 'Product not found', 404);
    }

    const saved = await prisma.customer_saved_items.upsert({
      where: {
        customer_id_product_id: {
          customer_id: customerId,
          product_id: product.id,
        },
      },
      update: {
        price_alert_threshold: parsedTarget,
      },
      create: {
        customer_id: customerId,
        product_id: product.id,
        price_alert_threshold: parsedTarget,
      },
    });

    return apiSuccess(
      res,
      {
        id: saved.id,
        product_id: Number(saved.product_id),
        target_price: Number(saved.price_alert_threshold),
        current_price: Number(product.price),
      },
      `Price alert set for ${product.currency} ${parsedTarget}`
    );
  } catch (error: any) {
    return apiError(res, 'Failed to set price alert', 500);
  }
});

// DELETE /api/v1/alerts/:productId - Remove price alert
router.delete('/:productId', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;
    const numericProductId = parseInt(req.params.productId, 10);

    if (isNaN(numericProductId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    // Set threshold to null or remove
    await prisma.customer_saved_items.updateMany({
      where: {
        customer_id: customerId,
        OR: [
          { product_id: BigInt(numericProductId) },
          { product: { insightz_product_id: numericProductId } },
        ],
      },
      data: {
        price_alert_threshold: null,
      },
    });

    return apiSuccess(res, null, 'Price alert cancelled successfully');
  } catch (error: any) {
    return apiError(res, 'Failed to cancel price alert', 500);
  }
});

export default router;
