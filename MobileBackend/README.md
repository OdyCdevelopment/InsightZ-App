# InsightZ Mobile Backend API

Dedicated, high-performance customer and mobile application backend for **InsightZ**. Powered by **Node.js, Express, TypeScript, and Prisma ORM**, connecting directly to PostgreSQL (`insight_db`).

---

## 📖 Interactive Swagger API Documentation & Testing

When the server is running, open the interactive Swagger UI in your browser to inspect schemas and execute test requests live:

- **Swagger UI**: [http://localhost:5001/api-docs](http://localhost:5001/api-docs)
- **Alternative Docs**: [http://localhost:5001/docs](http://localhost:5001/docs)
- **OpenAPI JSON Spec**: [http://localhost:5001/api-docs.json](http://localhost:5001/api-docs.json)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## ⚙️ Configuration (.env)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5001` | Server port (runs alongside admin backend on 5000) |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://.../insight_db` | PostgreSQL connection string |
| `JWT_SECRET` | `...` | Secret key for signing customer JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `CORS_ORIGIN` | `*` | Allowed origins (mobile apps, emulators, web) |

---

## 📚 API Endpoints Summary

Base URL: `http://localhost:5001/api/v1`

### 1. Customer Authentication (`/api/v1/auth` & `/api/v1/customers`)
- `POST /register`: Create a customer account (`first_name`, `last_name`, `email`, `phone`).
- `POST /login`: Log in customer with email address.
- `GET /me`: Get current customer profile, stats, wishlist count, and loyalty balance.
- `PUT /me`: Update profile information (`first_name`, `last_name`, `phone`, `avatar_url`).
- `GET /activity`: View recent customer activity history.

### 2. Home Feed (`/api/v1/home`)
- `GET /`: Aggregated mobile home payload containing active promotional hero banners, top categories with product counts, flash deals, trending products, and featured stores.

### 3. Products Catalog & Price Comparison (`/api/v1/products`)
- `GET /`: Paginated product feed with filters (`search`, `category`, `store`, `vendor`, `offer`, `min_price`, `max_price`, `sort`).
- `GET /:id`: Full product detail with image gallery, specifications, and option variants (size, color, sku).
- `GET /:id/compare`: Real-time cross-store price comparison. Shows cheapest store, price differences, max savings, and direct product store links.
- `GET /:id/price-history`: Price trend data over time for historical price charts.
- `GET /:id/similar`: Recommended products in the same category or brand.

### 4. Wishlist / Saved Items (`/api/v1/wishlist`) *(Auth Required)*
- `GET /`: List all saved products with current prices and alert triggers.
- `POST /`: Add product to wishlist (with optional `price_alert_threshold`).
- `DELETE /:productId`: Remove product from wishlist.
- `GET /check/:productId`: Check if a product is in the customer's wishlist.

### 5. Price Drop Alerts (`/api/v1/alerts`) *(Auth Required)*
- `GET /`: List all active price alert thresholds and flag if target has been met.
- `POST /`: Set target price alert threshold for a product.
- `DELETE /:productId`: Cancel price drop alert.

### 6. Categories (`/api/v1/categories`)
- `GET /`: Hierarchical category tree with subcategories and live product count.
- `GET /:id`: Category detail with top products.

### 7. Search & Autocomplete (`/api/v1/search`)
- `GET /`: Fast debounced search across product titles, tags, and vendors.
- `GET /suggest`: Autocomplete suggestions as user types in the mobile search bar.
- `GET /trending`: Popular searches and trending category tags.

### 8. Deals & Coupons (`/api/v1/deals`)
- `GET /`: Curated flash sales and highest discounts.
- `GET /coupons`: Active merchant promo codes and vouchers.

### 9. Reviews & Ratings (`/api/v1/reviews`)
- `GET /product/:productId`: Product reviews, average rating, and star breakdown.
- `POST /product/:productId`: Submit verified product review and rating (1–5).

### 10. Store Outlink Tracking (`/api/v1/clicks`)
- `POST /`: Record merchant redirect clicks for analytics and return store URL.

### 11. Loyalty Wallet (`/api/v1/wallet`) *(Auth Required)*
- `GET /`: Wallet balance, tier level (Bronze, Silver, Gold, Platinum), and cashback transaction history.

### 12. Support & FAQs (`/api/v1/support`)
- `GET /faqs`: Shopping and price comparison FAQs.
- `POST /contact`: Submit support question or ticket.
