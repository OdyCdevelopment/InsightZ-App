import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { rateLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { apiError, apiSuccess } from './utils/apiResponse.js';
import { swaggerDocument } from './docs/swagger.js';
import apiV1Router from './routes/index.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter(300, 60_000)); // 300 req/min for mobile clients

// Swagger API Documentation UI (Interactive Testing)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'InsightZ Mobile API Docs & Testing',
  customCss: '.swagger-ui .topbar { background-color: #0f172a; } .swagger-ui .topbar .topbar-wrapper img { content: url("https://insightz.com/logo.png"); height: 40px; }',
}));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// OpenAPI JSON endpoint (for Postman / Insomnia import)
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  return apiSuccess(res, {
    status: 'healthy',
    service: 'insightz-mobile-backend',
    version: '1.0.0',
    swagger: 'http://localhost:5001/api-docs',
    timestamp: new Date().toISOString(),
  }, 'InsightZ Mobile Backend is running');
});

// Root welcome
app.get('/', (_req: Request, res: Response) => {
  return apiSuccess(res, {
    name: 'InsightZ Mobile Backend API',
    version: '1.0.0',
    swagger_docs: 'http://localhost:5001/api-docs',
    endpoints: {
      swagger: '/api-docs',
      swagger_json: '/api-docs.json',
      health: '/api/health',
      auth: '/api/v1/auth',
      home: '/api/v1/home',
      products: '/api/v1/products',
      search: '/api/v1/search',
      categories: '/api/v1/categories',
      wishlist: '/api/v1/wishlist',
      alerts: '/api/v1/alerts',
      deals: '/api/v1/deals',
      reviews: '/api/v1/reviews',
      clicks: '/api/v1/clicks',
      wallet: '/api/v1/wallet',
      support: '/api/v1/support',
    },
  }, 'Welcome to InsightZ Mobile API. Open /api-docs for interactive Swagger UI.');
});

// Mount Versioned API Routes
app.use('/api/v1', apiV1Router);

// 404 handler
app.use((_req: Request, res: Response) => {
  return apiError(res, 'Endpoint not found. Visit /api-docs for available endpoints.', 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
