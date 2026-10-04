import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = Router();

// GET /api/v1/products - Mobile product catalog with filters and infinite scroll
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      store,
      vendor,
      offer,
      min_price,
      max_price,
      sort = 'newest',
    } = req.query;

    const where: any = {
      available: true,
    };

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { vendor: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
        { product_type: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      const catId = parseInt(category as string, 10);
      if (!isNaN(catId)) {
        where.category_id = catId;
      }
    }

    if (store && store !== 'all') {
      where.source = { equals: store as string, mode: 'insensitive' };
    }

    if (vendor && vendor !== 'all') {
      where.vendor = { equals: vendor as string, mode: 'insensitive' };
    }

    if (offer === 'true') {
      where.is_offer = true;
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price.gte = parseFloat(min_price as string);
      if (max_price) where.price.lte = parseFloat(max_price as string);
    }

    const orderByMap: Record<string, any> = {
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      discount_desc: { discount_percentage: 'desc' },
      newest: { updated_at: 'desc' },
    };

    const orderBy = orderByMap[sort as string] || { updated_at: 'desc' };

    const [products, total] = await Promise.all([
      prisma.insightz_products.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          insightz_product_id: true,
          source: true,
          source_domain: true,
          title: true,
          handle: true,
          vendor: true,
          product_type: true,
          category_id: true,
          price: true,
          compare_at_price: true,
          currency: true,
          available: true,
          is_offer: true,
          discount_percentage: true,
          image_url: true,
          product_url: true,
          updated_at: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.insightz_products.count({ where }),
    ]);

    const formatted = products.map((p) => ({
      id: Number(p.id),
      insightz_product_id: p.insightz_product_id,
      title: p.title,
      store: p.source,
      store_domain: p.source_domain,
      vendor: p.vendor,
      category: p.category,
      price: Number(p.price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      discount_percentage: p.discount_percentage ? Number(p.discount_percentage) : null,
      currency: p.currency,
      image_url: p.image_url,
      product_url: p.product_url,
      available: p.available,
      is_offer: p.is_offer,
    }));

    return apiSuccess(res, formatted, 'Products fetched successfully', 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return apiError(res, 'Failed to retrieve products', 500);
  }
});

// GET /api/v1/products/:id - Product detail with variants & categories
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const numericId = parseInt(rawId, 10);
    if (isNaN(numericId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const product = await prisma.insightz_products.findFirst({
      where: {
        OR: [
          { id: BigInt(numericId) },
          { insightz_product_id: numericId },
        ],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      return apiError(res, 'Product not found', 404);
    }

    const allVariants = await prisma.insightz_products.findMany({
      where: {
        source: product.source,
        insightz_product_id: product.insightz_product_id,
      },
      orderBy: { variant_id: 'asc' },
      select: {
        id: true,
        variant_id: true,
        variant_title: true,
        sku: true,
        option1_name: true,
        option1: true,
        option2_name: true,
        option2: true,
        option3_name: true,
        option3: true,
        price: true,
        compare_at_price: true,
        available: true,
        is_offer: true,
        discount_percentage: true,
        image_url: true,
      },
    });

    // Record product view
    await prisma.product_views.create({
      data: { product_id: product.id },
    }).catch(() => {});

    // Ratings & reviews summary
    const reviewsAggregate = await prisma.reviews.aggregate({
      where: { product_id: product.id },
      _avg: { rating: true },
      _count: { id: true },
    }).catch(() => ({ _avg: { rating: null }, _count: { id: 0 } }));

    return apiSuccess(res, {
      id: Number(product.id),
      insightz_product_id: product.insightz_product_id,
      title: product.title,
      handle: product.handle,
      source: product.source,
      source_domain: product.source_domain,
      vendor: product.vendor,
      product_type: product.product_type,
      category: product.category,
      description: product.description,
      tags: product.tags ? product.tags.split(',').map((t) => t.trim()) : [],
      price: Number(product.price),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      discount_percentage: product.discount_percentage ? Number(product.discount_percentage) : null,
      currency: product.currency,
      image_url: product.image_url,
      product_url: product.product_url,
      available: product.available,
      is_offer: product.is_offer,
      rating: reviewsAggregate._avg.rating ? Number(reviewsAggregate._avg.rating.toFixed(1)) : 4.5,
      review_count: reviewsAggregate._count.id || 0,
      variants: allVariants.map((v) => ({
        id: Number(v.id),
        variant_id: v.variant_id,
        title: v.variant_title,
        sku: v.sku,
        option1_name: v.option1_name,
        option1: v.option1,
        option2_name: v.option2_name,
        option2: v.option2,
        option3_name: v.option3_name,
        option3: v.option3,
        price: Number(v.price),
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
        discount_percentage: v.discount_percentage ? Number(v.discount_percentage) : null,
        available: v.available,
        image_url: v.image_url || product.image_url,
      })),
    });
  } catch (error: any) {
    console.error('Product detail error:', error);
    return apiError(res, 'Failed to fetch product details', 500);
  }
});

// GET /api/v1/products/:id/compare - Multi-store price comparison
router.get('/:id/compare', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const numericId = parseInt(rawId, 10);
    if (isNaN(numericId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const current = await prisma.insightz_products.findFirst({
      where: {
        OR: [
          { id: BigInt(numericId) },
          { insightz_product_id: numericId },
        ],
      },
    });

    if (!current) {
      return apiError(res, 'Product not found', 404);
    }

    const cleanTitle = current.title.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(' ').slice(0, 4).join(' ');

    const competitorStores = await prisma.insightz_products.findMany({
      where: {
        available: true,
        title: { contains: cleanTitle, mode: 'insensitive' },
      },
      distinct: ['source'],
      take: 10,
      orderBy: { price: 'asc' },
      select: {
        id: true,
        title: true,
        source: true,
        source_domain: true,
        price: true,
        compare_at_price: true,
        currency: true,
        available: true,
        product_url: true,
        image_url: true,
      },
    });

    const lowestPrice = competitorStores.length > 0
      ? Math.min(...competitorStores.map((s) => Number(s.price)))
      : Number(current.price);

    const highestPrice = competitorStores.length > 0
      ? Math.max(...competitorStores.map((s) => Number(s.price)))
      : Number(current.price);

    const comparisonList = competitorStores.map((store) => {
      const storePrice = Number(store.price);
      const isLowest = storePrice === lowestPrice;
      const difference = storePrice - lowestPrice;

      return {
        product_id: Number(store.id),
        store_name: store.source,
        store_domain: store.source_domain,
        title: store.title,
        price: storePrice,
        currency: store.currency,
        is_lowest_price: isLowest,
        price_diff_from_lowest: Number(difference.toFixed(2)),
        product_url: store.product_url,
        in_stock: store.available,
      };
    });

    return apiSuccess(res, {
      product_id: Number(current.id),
      product_title: current.title,
      summary: {
        lowest_price: lowestPrice,
        highest_price: highestPrice,
        max_savings: Number((highestPrice - lowestPrice).toFixed(2)),
        stores_compared: comparisonList.length,
      },
      stores: comparisonList,
    });
  } catch (error: any) {
    console.error('Price comparison error:', error);
    return apiError(res, 'Failed to compare product prices', 500);
  }
});

// GET /api/v1/products/:id/price-history - Price trends
router.get('/:id/price-history', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const numericId = parseInt(rawId, 10);
    if (isNaN(numericId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const history = await prisma.price_history.findMany({
      where: { product_id: BigInt(numericId) },
      orderBy: { scraped_at: 'asc' },
      take: 60,
      select: {
        price: true,
        currency: true,
        scraped_at: true,
      },
    });

    return apiSuccess(res, history.map((h) => ({
      price: Number(h.price),
      currency: h.currency,
      date: h.scraped_at,
    })));
  } catch (error: any) {
    return apiError(res, 'Failed to load price history', 500);
  }
});

// GET /api/v1/products/:id/similar - Related / recommended products
router.get('/:id/similar', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const numericId = parseInt(rawId, 10);
    if (isNaN(numericId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const current = await prisma.insightz_products.findFirst({
      where: {
        OR: [
          { id: BigInt(numericId) },
          { insightz_product_id: numericId },
        ],
      },
    });

    if (!current) {
      return apiError(res, 'Product not found', 404);
    }

    const similar = await prisma.insightz_products.findMany({
      where: {
        available: true,
        id: { not: current.id },
        OR: [
          ...(current.category_id ? [{ category_id: current.category_id }] : []),
          ...(current.vendor ? [{ vendor: current.vendor }] : []),
        ],
      },
      distinct: ['title'],
      take: 8,
      select: {
        id: true,
        title: true,
        source: true,
        vendor: true,
        price: true,
        compare_at_price: true,
        discount_percentage: true,
        currency: true,
        image_url: true,
      },
    });

    return apiSuccess(res, similar.map((p) => ({
      id: Number(p.id),
      title: p.title,
      store: p.source,
      vendor: p.vendor,
      price: Number(p.price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      discount_percentage: p.discount_percentage ? Number(p.discount_percentage) : null,
      currency: p.currency,
      image_url: p.image_url,
    })));
  } catch (error: any) {
    return apiError(res, 'Failed to fetch similar products', 500);
  }
});

export default router;
