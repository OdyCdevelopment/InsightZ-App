import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { optionalCustomerAuth, CustomerAuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/v1/support/faqs - Customer FAQs
router.get('/faqs', async (_req: Request, res: Response) => {
  try {
    const faqs = await prisma.faqs.findMany({
      where: { is_published: true },
      orderBy: { sort_order: 'asc' },
    }).catch(() => []);

    const defaultFaqs = faqs.length > 0 ? faqs : [
      {
        id: 1,
        question: 'How does InsightZ price comparison work?',
        answer: 'InsightZ continuously scrapes and indexes product catalogs from multiple verified Shopify merchants to help you find the lowest price and best discounts.',
        category: 'General',
      },
      {
        id: 2,
        question: 'Are the prices updated in real-time?',
        answer: 'Yes! Our scraper engine updates store catalogs regularly, ensuring accurate availability, prices, and active coupon codes.',
        category: 'Pricing',
      },
      {
        id: 3,
        question: 'How do Price Drop Alerts work?',
        answer: 'Add any item to your Wishlist and set your target threshold price. As soon as the price falls to or below your target, we notify you immediately.',
        category: 'Alerts',
      },
    ];

    return apiSuccess(res, defaultFaqs);
  } catch (error: any) {
    return apiError(res, 'Failed to fetch FAQs', 500);
  }
});

// POST /api/v1/support/contact - Submit customer contact inquiry
router.post('/contact', optionalCustomerAuth, async (req: CustomerAuthRequest, res: Response) => {
  try {
    const { subject, message, email, sender_name } = req.body;

    if (!subject || !message) {
      return apiError(res, 'Subject and message are required', 400);
    }

    const name = req.customer ? `${req.customer.first_name} ${req.customer.last_name}` : (sender_name?.trim() || 'Mobile User');
    const contactEmail = req.customer?.email || email || 'customer@mobile.app';

    const contact = await prisma.contact_messages.create({
      data: {
        sender_name: name,
        email: contactEmail,
        subject: subject.trim(),
        message: message.trim(),
        status: 'new',
      },
    });

    return apiSuccess(res, contact, 'Message received. Our support team will get back to you shortly.', 201);
  } catch (error: any) {
    console.error('Contact message error:', error);
    return apiError(res, 'Failed to submit message', 500);
  }
});

export default router;
