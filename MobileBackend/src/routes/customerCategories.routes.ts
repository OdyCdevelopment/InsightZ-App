import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = Router();

// GET /api/v1/categories - Hierarchical category tree with counts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const rootCategories: any[] = [];
    const categoryMap = new Map<number, any>();

    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id,
        level: cat.level,
        product_count: cat._count.products,
        subcategories: [],
      });
    });

    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).subcategories.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    return apiSuccess(res, rootCategories, 'Categories fetched successfully', 200, {
      total: categories.length,
    });
  } catch (error: any) {
    console.error('Categories error:', error);
    return apiError(res, 'Failed to fetch categories', 500);
  }
});

// GET /api/v1/categories/:id - Category detail with top products
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return apiError(res, 'Invalid category ID', 400);
    }

    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        children: {
          select: { id: true, name: true, slug: true, level: true },
        },
      },
    });

    if (!category) {
      return apiError(res, 'Category not found', 404);
    }

    const products = await prisma.insightz_products.findMany({
      where: {
        category_id: id,
        available: true,
      },
      take: 20,
      orderBy: [{ is_offer: 'desc' }, { discount_percentage: 'desc' }],
      select: {
        id: true,
        title: true,
        source: true,
        price: true,
        compare_at_price: true,
        discount_percentage: true,
        currency: true,
        image_url: true,
        available: true,
      },
    });

    return apiSuccess(res, {
      ...category,
      products: products.map((p) => ({
        id: Number(p.id),
        title: p.title,
        store: p.source,
        price: Number(p.price),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        discount_percentage: p.discount_percentage ? Number(p.discount_percentage) : null,
        currency: p.currency,
        image_url: p.image_url,
      })),
    });
  } catch (error: any) {
    return apiError(res, 'Failed to fetch category', 500);
  }
});

export default router;
