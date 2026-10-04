import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = Router();

// GET /api/v1/search - Fast debounced search
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    if (!q) {
      return apiSuccess(res, [], 'Empty query', 200, { total: 0 });
    }

    // Log query in search_queries table
    await prisma.search_queries.create({
      data: { query: q, results_count: 0 },
    }).catch(() => {});

    const products = await prisma.insightz_products.findMany({
      where: {
        available: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { vendor: { contains: q, mode: 'insensitive' } },
          { tags: { contains: q, mode: 'insensitive' } },
        ],
      },
      distinct: ['title'],
      take: limit,
      orderBy: [{ is_offer: 'desc' }, { updated_at: 'desc' }],
      select: {
        id: true,
        insightz_product_id: true,
        title: true,
        source: true,
        vendor: true,
        price: true,
        compare_at_price: true,
        discount_percentage: true,
        currency: true,
        image_url: true,
        product_url: true,
        available: true,
      },
    });

    return apiSuccess(
      res,
      products.map((p) => ({
        id: Number(p.id),
        title: p.title,
        store: p.source,
        vendor: p.vendor,
        price: Number(p.price),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        discount_percentage: p.discount_percentage ? Number(p.discount_percentage) : null,
        currency: p.currency,
        image_url: p.image_url,
        product_url: p.product_url,
      })),
      'Search results',
      200,
      { total: products.length }
    );
  } catch (error: any) {
    console.error('Search error:', error);
    return apiError(res, 'Search request failed', 500);
  }
});

// GET /api/v1/search/suggest - Mobile search bar autocomplete
router.get('/suggest', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q || q.length < 2) {
      return apiSuccess(res, { suggestions: [], categories: [], brands: [] });
    }

    const [products, categories, brands] = await Promise.all([
      prisma.insightz_products.findMany({
        where: {
          available: true,
          title: { contains: q, mode: 'insensitive' },
        },
        distinct: ['title'],
        take: 5,
        select: { id: true, title: true, price: true, image_url: true },
      }),
      prisma.categories.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        take: 3,
        select: { id: true, name: true, slug: true },
      }),
      prisma.brands.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        take: 3,
        select: { id: true, name: true, slug: true },
      }).catch(() => []),
    ]);

    return apiSuccess(res, {
      suggestions: products.map((p) => ({
        id: Number(p.id),
        title: p.title,
        price: Number(p.price),
        image_url: p.image_url,
      })),
      categories,
      brands,
    });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch suggestions', 500);
  }
});

// GET /api/v1/search/trending - Trending search tags and popular categories
router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const popularQueries = await prisma.search_queries.findMany({
      orderBy: { searched_at: 'desc' },
      take: 10,
      distinct: ['query'],
      select: { query: true },
    }).catch(() => []);

    const tags = popularQueries.map((q) => q.query).filter(Boolean);

    const defaultTrending = tags.length > 0 ? tags : [
      'Wireless Earbuds',
      'Hoodies',
      'Smart Watch',
      'Running Shoes',
      'Gaming Keyboard',
      'Serum',
      'Oversized T-shirt',
    ];

    return apiSuccess(res, {
      trending_searches: defaultTrending,
    });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch trending searches', 500);
  }
});

export default router;
