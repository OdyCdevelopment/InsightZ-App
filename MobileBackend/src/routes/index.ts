import { Router } from 'express';
import customerAuthRoutes from './customerAuth.routes.js';
import customerHomeRoutes from './customerHome.routes.js';
import customerProductsRoutes from './customerProducts.routes.js';
import customerSearchRoutes from './customerSearch.routes.js';
import customerCategoriesRoutes from './customerCategories.routes.js';
import customerWishlistRoutes from './customerWishlist.routes.js';
import customerAlertsRoutes from './customerAlerts.routes.js';
import customerDealsRoutes from './customerDeals.routes.js';
import customerReviewsRoutes from './customerReviews.routes.js';
import customerClicksRoutes from './customerClicks.routes.js';
import customerWalletRoutes from './customerWallet.routes.js';
import customerSupportRoutes from './customerSupport.routes.js';
import customerNearbyRoutes from './customerNearby.routes.js';

const router = Router();

// Mount Customer / Mobile App Endpoints
router.use('/auth', customerAuthRoutes);
router.use('/customers', customerAuthRoutes);
router.use('/home', customerHomeRoutes);
router.use('/products', customerProductsRoutes);
router.use('/search', customerSearchRoutes);
router.use('/categories', customerCategoriesRoutes);
router.use('/wishlist', customerWishlistRoutes);
router.use('/alerts', customerAlertsRoutes);
router.use('/deals', customerDealsRoutes);
router.use('/nearby', customerNearbyRoutes);
router.use('/reviews', customerReviewsRoutes);
router.use('/clicks', customerClicksRoutes);
router.use('/wallet', customerWalletRoutes);
router.use('/support', customerSupportRoutes);

export default router;
