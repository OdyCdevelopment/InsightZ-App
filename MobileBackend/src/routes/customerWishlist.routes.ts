import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { requireCustomerAuth, CustomerAuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// All wishlist routes require customer authentication
router.use(requireCustomerAuth);

// GET /api/v1/wishlist - Get customer wishlist items
router.get('/', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;

    const savedItems = await prisma.customer_saved_items.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            insightz_product_id: true,
            title: true,
            handle: true,
            source: true,
            source_domain: true,
            vendor: true,
            price: true,
            compare_at_price: true,
            discount_percentage: true,
            currency: true,
            image_url: true,
            product_url: true,
            available: true,
            is_offer: true,
          },
        },
      },
    });

    const items = savedItems
      .filter((item) => !!item.product)
      .map((item) => {
        const p = item.product;
        const currentPrice = Number(p.price) || 0;
        const targetThreshold = item.price_alert_threshold ? Number(item.price_alert_threshold) : null;
        const isTargetReached = targetThreshold !== null && currentPrice <= targetThreshold;

        return {
          id: item.id,
          product_id: Number(item.product_id),
          saved_at: item.created_at,
          price_alert_threshold: targetThreshold,
          is_target_reached: isTargetReached,
          product: {
            id: Number(p.id),
            insightz_product_id: p.insightz_product_id,
            title: p.title,
            store: p.source || 'InsightZ Store',
            store_domain: p.source_domain,
            vendor: p.vendor,
            price: currentPrice,
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
            discount_percentage: p.discount_percentage ? Number(p.discount_percentage) : null,
            currency: p.currency || 'Rs.',
            image_url: p.image_url,
            product_url: p.product_url,
            available: p.available,
            is_offer: p.is_offer,
          },
        };
      });

    return apiSuccess(res, items, 'Wishlist retrieved successfully', 200, {
      total: items.length,
    });
  } catch (error: any) {
    console.error('Wishlist fetch error:', error);
    return apiError(res, 'Failed to retrieve wishlist', 500);
  }
});

// POST /api/v1/wishlist - Add product to wishlist
router.post('/', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;
    const { product_id, price_alert_threshold } = req.body;

    if (!product_id) {
      return apiError(res, 'Product ID is required', 400);
    }

    const numericProductId = parseInt(product_id, 10);
    if (isNaN(numericProductId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    // Verify product exists
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

    const threshold = price_alert_threshold ? parseFloat(price_alert_threshold) : null;

    // Upsert saved item
    const saved = await prisma.customer_saved_items.upsert({
      where: {
        customer_id_product_id: {
          customer_id: customerId,
          product_id: product.id,
        },
      },
      update: {
        price_alert_threshold: threshold,
      },
      create: {
        customer_id: customerId,
        product_id: product.id,
        price_alert_threshold: threshold,
      },
    });

    // Log activity
    await prisma.customer_activity_log.create({
      data: {
        customer_id: customerId,
        action: `Added "${product.title.slice(0, 50)}" to Wishlist`,
        device: 'Mobile App',
      },
    }).catch(() => {});

    return apiSuccess(
      res,
      {
        id: saved.id,
        product_id: Number(saved.product_id),
        price_alert_threshold: saved.price_alert_threshold ? Number(saved.price_alert_threshold) : null,
      },
      'Product added to wishlist',
      201
    );
  } catch (error: any) {
    console.error('Add to wishlist error:', error);
    return apiError(res, 'Failed to save product to wishlist', 500);
  }
});

// DELETE /api/v1/wishlist/:productId - Remove item from wishlist
router.delete('/:productId', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;
    const numericProductId = parseInt(req.params.productId, 10);
    if (isNaN(numericProductId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    // Delete matching row
    const deleteResult = await prisma.customer_saved_items.deleteMany({
      where: {
        customer_id: customerId,
        OR: [
          { product_id: BigInt(numericProductId) },
          { product: { insightz_product_id: numericProductId } },
        ],
      },
    });

    if (deleteResult.count === 0) {
      return apiError(res, 'Item was not in your wishlist', 404);
    }

    return apiSuccess(res, null, 'Product removed from wishlist');
  } catch (error: any) {
    console.error('Delete from wishlist error:', error);
    return apiError(res, 'Failed to remove product from wishlist', 500);
  }
});

// GET /api/v1/wishlist/check/:productId - Check if item is saved
router.get('/check/:productId', async (req: CustomerAuthRequest, res: Response) => {
  try {
    const customerId = req.customer!.id;
    const numericProductId = parseInt(req.params.productId, 10);
    if (isNaN(numericProductId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const saved = await prisma.customer_saved_items.findFirst({
      where: {
        customer_id: customerId,
        OR: [
          { product_id: BigInt(numericProductId) },
          { product: { insightz_product_id: numericProductId } },
        ],
      },
    });

    return apiSuccess(res, {
      is_saved: !!saved,
      price_alert_threshold: saved?.price_alert_threshold ? Number(saved.price_alert_threshold) : null,
    });
  } catch (error: any) {
    return apiError(res, 'Failed to check wishlist status', 500);
  }
});

export default router;
