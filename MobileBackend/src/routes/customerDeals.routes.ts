import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = Router();

// GET /api/v1/deals - Curated hot deals and highest discounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 100));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.insightz_products.findMany({
        where: {
          available: true,
          OR: [
            { is_offer: true },
            { discount_percentage: { gte: 10 } },
          ],
        },
        orderBy: [
          { discount_percentage: 'desc' },
          { updated_at: 'desc' },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          insightz_product_id: true,
          title: true,
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
      }),
      prisma.insightz_products.count({
        where: {
          available: true,
          OR: [
            { is_offer: true },
            { discount_percentage: { gte: 10 } },
          ],
        },
      }),
    ]);

    const formatted = products.map((p) => {
      const price = Number(p.price);
      const compareAt = p.compare_at_price ? Number(p.compare_at_price) : null;
      const savings = compareAt && compareAt > price ? compareAt - price : 0;

      return {
        id: Number(p.id),
        insightz_product_id: p.insightz_product_id,
        title: p.title,
        store: p.source,
        store_domain: p.source_domain,
        vendor: p.vendor,
        price,
        compare_at_price: compareAt,
        discount_percentage: p.discount_percentage ? Number(p.discount_percentage) : null,
        savings: Number(savings.toFixed(2)),
        currency: p.currency,
        image_url: p.image_url,
        product_url: p.product_url,
        available: p.available,
      };
    });

    return apiSuccess(res, formatted, 'Deals fetched successfully', 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error: any) {
    console.error('Deals fetch error:', error);
    return apiError(res, 'Failed to fetch deals', 500);
  }
});

// GET /api/v1/deals/coupons - Active store coupons and vouchers
router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupons.findMany({
      where: {
        status: { not: 'expired' },
      },
      orderBy: { created_at: 'desc' },
      take: 30,
    }).catch(() => []);

    return apiSuccess(res, coupons, 'Coupons fetched successfully');
  } catch (error: any) {
    return apiError(res, 'Failed to fetch coupons', 500);
  }
});

export default router;
