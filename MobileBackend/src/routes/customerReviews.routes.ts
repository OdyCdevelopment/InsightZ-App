import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { optionalCustomerAuth, CustomerAuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/v1/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.productId;
    const numericId = parseInt(rawId, 10);
    if (isNaN(numericId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const reviews = await prisma.reviews.findMany({
      where: {
        product_id: BigInt(numericId),
        status: 'approved',
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
      },
    });

    const total = reviews.length;
    const avgRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 5.0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return apiSuccess(res, {
      summary: {
        average_rating: Number(avgRating.toFixed(1)),
        total_reviews: total,
        rating_breakdown: distribution,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        content: r.body,
        author: r.customer ? `${r.customer.first_name} ${r.customer.last_name.slice(0, 1)}.` : 'Verified Shopper',
        avatar_url: r.customer?.avatar_url || null,
        created_at: r.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Reviews fetch error:', error);
    return apiError(res, 'Failed to fetch reviews', 500);
  }
});

// POST /api/v1/reviews/product/:productId - Submit product review
router.post('/product/:productId', optionalCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const numericId = parseInt(req.params.productId, 10);
    if (isNaN(numericId)) {
      return apiError(res, 'Invalid product ID', 400);
    }

    const { rating, comment, body } = req.body;
    const content = (body || comment || '').trim();
    const parsedRating = parseInt(rating, 10);

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return apiError(res, 'Rating must be an integer between 1 and 5', 400);
    }

    if (!content || content.length < 3) {
      return apiError(res, 'Review content must be at least 3 characters long', 400);
    }

    const customerId = req.customer?.id || null;

    const review = await prisma.reviews.create({
      data: {
        product_id: BigInt(numericId),
        customer_id: customerId,
        rating: parsedRating,
        body: content,
        status: 'approved',
      },
    });

    return apiSuccess(res, review, 'Review submitted successfully', 201);
  } catch (error: any) {
    console.error('Submit review error:', error);
    return apiError(res, 'Failed to submit review', 500);
  }
});

export default router;
