import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = Router();

// GET /api/v1/home
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [banners, categories, trendingProducts, flashDeals, stores] = await Promise.all([
      // 1. Active CMS Hero Banners
      prisma.cms_banners.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        take: 5,
      }).catch(() => []),

      // 2. Top categories with products
      prisma.categories.findMany({
        orderBy: { sort_order: 'asc' },
        take: 8,
        include: {
          _count: { select: { products: true } },
        },
      }),

      // 3. Trending / Featured products
      prisma.insightz_products.findMany({
        where: { available: true },
        orderBy: [
          { is_offer: 'desc' },
          { discount_percentage: 'desc' },
          { updated_at: 'desc' },
        ],
        distinct: ['title'],
        take: 10,
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

      // 4. Flash deals and active offers
      prisma.offers.findMany({
        where: { status: 'active' },
        orderBy: { discount_pct: 'desc' },
        take: 6,
        include: {
          store: {
            select: { name: true, domain: true, logo_url: true },
          },
        },
      }).catch(() => []),

      // 5. Featured stores / merchant directory
      prisma.stores.findMany({
        where: { status: 'active' },
        orderBy: { name: 'asc' },
        take: 6,
        select: {
          id: true,
          name: true,
          domain: true,
          logo_url: true,
          currency: true,
        },
      }),
    ]);

    const formattedBanners = banners.length > 0 ? banners : [
      {
        id: 1,
        title: 'Compare Prices Across All Stores',
        subtitle: 'Save up to 50% on your favorite products today',
        image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
        link_url: '/products?offer=true',
        position: 'homepage_hero',
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        title: 'Real-time Price Drop Alerts',
        subtitle: 'Get notified instantly when prices drop on your wishlist',
        image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80',
        link_url: '/wishlist',
        position: 'homepage_hero',
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      product_count: cat._count.products,
    }));

    const mapProduct = (p: any) => ({
      id: Number(p.id),
      insightz_product_id: p.insightz_product_id,
      title: p.title,
      store: p.source,
      store_domain: p.source_domain,
      vendor: p.vendor,
      price: Number(p.price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      discount_percentage: p.discount_percentage ? Number(p.discount_percentage) : null,
      currency: p.currency,
      image_url: p.image_url,
      product_url: p.product_url,
      available: p.available,
      is_offer: p.is_offer,
    });

    const [topOffers, womenProducts, menProducts] = await Promise.all([
      prisma.insightz_products.findMany({
        where: {
          available: true,
          OR: [
            { is_offer: true },
            { discount_percentage: { gt: 15 } },
          ],
        },
        orderBy: [
          { discount_percentage: 'desc' },
          { updated_at: 'desc' },
        ],
        distinct: ['title'],
        take: 12,
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
      prisma.insightz_products.findMany({
        where: {
          available: true,
          OR: [
            { title: { contains: 'Akasi', mode: 'insensitive' } },
            { title: { contains: 'Engage Long Sleeve', mode: 'insensitive' } },
            { title: { contains: 'Tendenza Lace', mode: 'insensitive' } },
            { title: { contains: 'Tendenza Teen', mode: 'insensitive' } },
            { title: { contains: 'Skirt', mode: 'insensitive' } },
            { title: { contains: 'Dress', mode: 'insensitive' } },
            { title: { contains: 'Top', mode: 'insensitive' } },
          ],
          NOT: [
            { title: { contains: 'Deodorant', mode: 'insensitive' } },
            { title: { contains: 'Bra', mode: 'insensitive' } },
            { title: { contains: 'Watch', mode: 'insensitive' } },
            { title: { contains: 'Cushion', mode: 'insensitive' } },
            { title: { contains: 'Camera', mode: 'insensitive' } },
            { title: { contains: 'Mouse', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ id: 'asc' }],
        distinct: ['title'],
        take: 12,
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
      prisma.insightz_products.findMany({
        where: {
          available: true,
          OR: [
            { title: { contains: 'Men', mode: 'insensitive' } },
            { title: { contains: 'Shirt', mode: 'insensitive' } },
            { title: { contains: 'Polo', mode: 'insensitive' } },
            { title: { contains: 'Jogger', mode: 'insensitive' } },
            { title: { contains: 'Jean', mode: 'insensitive' } },
          ],
          NOT: [
            { title: { contains: 'Bra', mode: 'insensitive' } },
            { title: { contains: 'Skirt', mode: 'insensitive' } },
            { title: { contains: 'Dress', mode: 'insensitive' } },
            { title: { contains: 'Watch', mode: 'insensitive' } },
            { title: { contains: 'Women', mode: 'insensitive' } },
            { title: { contains: 'Deodorant', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ id: 'asc' }],
        distinct: ['title'],
        take: 12,
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
    ]);

    return apiSuccess(res, {
      banners: formattedBanners,
      categories: formattedCategories,
      trending_products: trendingProducts.map(mapProduct),
      top_offers: topOffers.map(mapProduct),
      new_in_women: womenProducts.map(mapProduct),
      new_in_men: menProducts.map(mapProduct),
      flash_deals: flashDeals.map((f) => ({
        id: f.id,
        title: f.title,
        discount_pct: f.discount_pct ? Number(f.discount_pct) : 0,
        coupon_code: f.coupon_code,
        description: f.description,
        is_flash_sale: f.is_flash_sale,
        store: f.store,
      })),
      featured_stores: stores,
    });
  } catch (error: any) {
    console.error('Home feed error:', error);
    return apiError(res, 'Failed to fetch customer home feed', 500);
  }
});

export default router;
