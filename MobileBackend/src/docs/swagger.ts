export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'InsightZ Mobile Backend API',
    version: '1.0.0',
    description: `
### 🚀 InsightZ Mobile & Customer API Documentation
Interactive API docs for testing mobile application endpoints, including:
- **Customer Authentication & Profile**
- **Mobile Home Feed**
- **Catalog, Cross-Store Price Comparison & Price History**
- **Customer Wishlist & Price Drop Alerts**
- **Hierarchical Categories**
- **Curated Deals & Promo Coupons**
- **Search & Instant Autocomplete**
- **Product Reviews & Ratings**
- **Loyalty Wallet & Cashback**
- **Merchant Outlink Click Tracking**

#### 🔑 Authorization
To test protected endpoints:
1. Call \`POST /api/v1/auth/register\` or \`POST /api/v1/auth/login\`
2. Copy the \`token\` from the response
3. Click the **Authorize 🔓** button at the top right, and paste the token as: \`Bearer <your_token>\` or just \`<your_token>\`
    `,
  },
  servers: [
    {
      url: 'http://localhost:5001',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your customer JWT token to authenticate',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      CustomerRegisterRequest: {
        type: 'object',
        required: ['first_name', 'last_name', 'email'],
        properties: {
          first_name: { type: 'string', example: 'Sarah' },
          last_name: { type: 'string', example: 'Silva' },
          email: { type: 'string', format: 'email', example: 'sarah.silva@example.com' },
          phone: { type: 'string', example: '+94771234567' },
        },
      },
      CustomerLoginRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'sarah.silva@example.com' },
        },
      },
      WishlistAddRequest: {
        type: 'object',
        required: ['product_id'],
        properties: {
          product_id: { type: 'integer', example: 6823, description: 'ID of the product to add' },
          price_alert_threshold: { type: 'number', example: 1200.0, description: 'Optional target price drop threshold' },
        },
      },
      PriceAlertRequest: {
        type: 'object',
        required: ['product_id', 'target_price'],
        properties: {
          product_id: { type: 'integer', example: 6823 },
          target_price: { type: 'number', example: 1200.0, description: 'Target price to trigger alert' },
        },
      },
      ReviewSubmitRequest: {
        type: 'object',
        required: ['rating', 'comment'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comment: { type: 'string', example: 'Great product, verified fast shipping!' },
        },
      },
      ClickTrackRequest: {
        type: 'object',
        required: ['product_id'],
        properties: {
          product_id: { type: 'integer', example: 6823 },
          store_id: { type: 'integer', example: 1 },
        },
      },
      ContactSupportRequest: {
        type: 'object',
        required: ['subject', 'message'],
        properties: {
          subject: { type: 'string', example: 'Price discrepancy question' },
          message: { type: 'string', example: 'I noticed a price difference on store X' },
          email: { type: 'string', example: 'shopper@example.com' },
          sender_name: { type: 'string', example: 'Sarah Silva' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API service health',
        responses: {
          200: {
            description: 'Service is operational',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Customer Auth'],
        summary: 'Register a new customer account',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRegisterRequest' } } },
        },
        responses: {
          201: { description: 'Registration successful, returns customer object and JWT token' },
          400: { description: 'Missing required fields' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Customer Auth'],
        summary: 'Log in customer with email',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerLoginRequest' } } },
        },
        responses: {
          200: { description: 'Login successful, returns customer profile and JWT token' },
          404: { description: 'Customer not found' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Customer Auth'],
        summary: 'Get current logged-in customer profile and stats',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Returns customer details, wishlist count, and loyalty balance' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Customer Auth'],
        summary: 'Update current customer profile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  phone: { type: 'string' },
                  avatar_url: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/auth/activity': {
      get: {
        tags: ['Customer Auth'],
        summary: 'View recent customer activity log',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of recent activities' },
        },
      },
    },
    '/api/v1/home': {
      get: {
        tags: ['Home Feed'],
        summary: 'Get aggregated mobile home feed (Banners, Categories, Trending, Deals)',
        responses: {
          200: { description: 'Unified home feed for the mobile app homepage' },
        },
      },
    },
    '/api/v1/products': {
      get: {
        tags: ['Products Catalog'],
        summary: 'Filterable product catalog with pagination and sorting',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search keywords' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category ID or slug' },
          { name: 'store', in: 'query', schema: { type: 'string' }, description: 'Merchant store name' },
          { name: 'vendor', in: 'query', schema: { type: 'string' }, description: 'Brand or vendor' },
          { name: 'offer', in: 'query', schema: { type: 'boolean' }, description: 'Only show on-sale/discounted products' },
          { name: 'min_price', in: 'query', schema: { type: 'number' }, description: 'Minimum price filter' },
          { name: 'max_price', in: 'query', schema: { type: 'number' }, description: 'Maximum price filter' },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'discount_desc'] },
            description: 'Sorting criteria',
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page' },
        ],
        responses: {
          200: { description: 'List of products with pagination metadata' },
        },
      },
    },
    '/api/v1/products/{id}': {
      get: {
        tags: ['Products Catalog'],
        summary: 'Get product details with all variant options',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        responses: {
          200: { description: 'Detailed product information with variants and gallery' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/api/v1/products/{id}/compare': {
      get: {
        tags: ['Products Catalog'],
        summary: 'Cross-store price comparison for a product',
        description: 'Searches all scraped stores for this product, identifies the lowest price, calculates savings, and returns direct merchant store links.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        responses: {
          200: { description: 'Comparison matrix of all stores offering this product' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/api/v1/products/{id}/price-history': {
      get: {
        tags: ['Products Catalog'],
        summary: 'Get historical price tracking trends for charts',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        responses: {
          200: { description: 'Array of date-stamped price points' },
        },
      },
    },
    '/api/v1/products/{id}/similar': {
      get: {
        tags: ['Products Catalog'],
        summary: 'Get related / recommended products in the same category',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        responses: {
          200: { description: 'List of similar products' },
        },
      },
    },
    '/api/v1/wishlist': {
      get: {
        tags: ['Customer Wishlist'],
        summary: 'List saved items with current prices and alert thresholds',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Wishlist items' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Customer Wishlist'],
        summary: 'Add a product to wishlist with optional target price alert threshold',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WishlistAddRequest' } } },
        },
        responses: {
          201: { description: 'Product added to wishlist' },
          400: { description: 'Invalid product ID' },
        },
      },
    },
    '/api/v1/wishlist/{productId}': {
      delete: {
        tags: ['Customer Wishlist'],
        summary: 'Remove a product from wishlist',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Product removed' },
          404: { description: 'Item not in wishlist' },
        },
      },
    },
    '/api/v1/wishlist/check/{productId}': {
      get: {
        tags: ['Customer Wishlist'],
        summary: 'Check if a specific product is saved in wishlist',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Returns boolean is_saved and price_alert_threshold' },
        },
      },
    },
    '/api/v1/alerts': {
      get: {
        tags: ['Price Drop Alerts'],
        summary: 'Get all active price drop alert thresholds for the customer',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of configured price drop alerts' },
        },
      },
      post: {
        tags: ['Price Drop Alerts'],
        summary: 'Set or update price alert threshold for a product',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PriceAlertRequest' } } },
        },
        responses: {
          200: { description: 'Price drop alert configured' },
        },
      },
    },
    '/api/v1/alerts/{productId}': {
      delete: {
        tags: ['Price Drop Alerts'],
        summary: 'Cancel price drop alert for a product',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Alert cancelled' },
        },
      },
    },
    '/api/v1/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Get hierarchical category tree with live product counts',
        responses: {
          200: { description: 'Tree of categories with subcategories' },
        },
      },
    },
    '/api/v1/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category details with subcategories and top products',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Category details and products' },
          404: { description: 'Category not found' },
        },
      },
    },
    '/api/v1/deals': {
      get: {
        tags: ['Deals & Coupons'],
        summary: 'Curated hot deals and highest discount products',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Deals feed' },
        },
      },
    },
    '/api/v1/deals/coupons': {
      get: {
        tags: ['Deals & Coupons'],
        summary: 'List active merchant discount coupons and promo codes',
        responses: {
          200: { description: 'List of coupon codes' },
        },
      },
    },
    '/api/v1/search': {
      get: {
        tags: ['Search'],
        summary: 'Fast debounced product search',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search term' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Search results' },
        },
      },
    },
    '/api/v1/search/suggest': {
      get: {
        tags: ['Search'],
        summary: 'Search bar autocomplete suggestions (products, categories, brands)',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Autocomplete suggestions' },
        },
      },
    },
    '/api/v1/search/trending': {
      get: {
        tags: ['Search'],
        summary: 'Trending search keywords and tags',
        responses: {
          200: { description: 'List of trending search strings' },
        },
      },
    },
    '/api/v1/reviews/product/{productId}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get product reviews and rating distribution',
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Reviews and breakdown' },
        },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Submit a product review and star rating',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewSubmitRequest' } } },
        },
        responses: {
          201: { description: 'Review submitted' },
        },
      },
    },
    '/api/v1/clicks': {
      post: {
        tags: ['Clicks & Outlinks'],
        summary: 'Track merchant redirect click and return destination URL',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ClickTrackRequest' } } },
        },
        responses: {
          200: { description: 'Returns redirect_url to merchant store' },
        },
      },
    },
    '/api/v1/wallet': {
      get: {
        tags: ['Loyalty Wallet'],
        summary: 'Get loyalty points, tier level, and transaction history',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Wallet balance and cashback history' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/support/faqs': {
      get: {
        tags: ['Support'],
        summary: 'Get frequently asked questions',
        responses: {
          200: { description: 'FAQ items' },
        },
      },
    },
    '/api/v1/support/contact': {
      post: {
        tags: ['Support'],
        summary: 'Submit contact message or customer inquiry',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ContactSupportRequest' } } },
        },
        responses: {
          201: { description: 'Inquiry submitted' },
        },
      },
    },
  },
};
