import { apiClient } from './client';
import {
  ApiResponse,
  HomeFeedData,
  Product,
  ProductDetail,
  PriceComparisonResult,
  StoreComparisonItem,
  DealProduct,
  Coupon,
  WishlistItem,
  PriceAlertItem,
  Category,
  LoyaltyWallet,
  Customer,
  FAQItem,
  NearbyOffer,
} from '../types/api';

// 1. Home Feed API (Direct to MobileBackend GET /api/v1/home)
export const homeApi = {
  getFeed: async (): Promise<HomeFeedData> => {
    const res = await apiClient.get<ApiResponse<HomeFeedData>>('/home');
    return res.data;
  },
};

// 2. Products & Price Comparison API (Direct to MobileBackend GET /api/v1/products)
export const productsApi = {
  getProducts: async (params?: {
    search?: string;
    category?: number | string;
    store?: string;
    vendor?: string;
    offer?: boolean;
    min_price?: number;
    max_price?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> => {
    const res = await apiClient.get<ApiResponse<Product[]>>('/products', params);
    return {
      products: res.data || [],
      total: res.meta?.total || (res.data ? res.data.length : 0),
    };
  },

  getProductDetail: async (id: number): Promise<ProductDetail> => {
    const res = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${id}`);
    return res.data;
  },

  comparePrices: async (id: number): Promise<PriceComparisonResult> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/products/${id}/compare`);
      const raw = res?.data;
      if (!raw) return null as any;
      const stores: StoreComparisonItem[] = raw.stores || raw.comparison || [];
      const summary = raw.summary || {};
      const lowest_price = summary.lowest_price ?? raw.lowest_price ?? 0;
      const highest_price = summary.highest_price ?? raw.highest_price ?? 0;
      const max_savings = summary.max_savings ?? raw.max_savings ?? 0;
      const stores_count = summary.stores_compared ?? raw.stores_count ?? stores.length;
      const cheapest_store =
        stores.find((s) => s.is_lowest_price)?.store_name || raw.cheapest_store || '';
      const currency = stores[0]?.currency || raw.currency || 'LKR';

      return {
        product_id: raw.product_id || id,
        title: raw.product_title || raw.title || '',
        lowest_price,
        highest_price,
        max_savings,
        stores_count,
        cheapest_store,
        currency,
        stores,
        comparison: stores,
      };
    } catch {
      return null as any;
    }
  },
};

// 3. Search & Autocomplete API (Direct to MobileBackend /api/v1/search)
export const searchApi = {
  suggest: async (q: string): Promise<string[]> => {
    if (!q || q.trim().length === 0) return [];
    try {
      const res = await apiClient.get<ApiResponse<string[]>>('/search/suggest', { q });
      return res.data || [];
    } catch {
      return [];
    }
  },

  trending: async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<ApiResponse<string[]>>('/search/trending');
      return res.data || [];
    } catch {
      return [];
    }
  },
};

// 4. Categories API (Direct to MobileBackend GET /api/v1/categories)
export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return res.data || [];
  },
};

// 5. Deals & Coupons API (Direct to MobileBackend /api/v1/deals)
export const dealsApi = {
  getDeals: async (params?: { page?: number; limit?: number }): Promise<DealProduct[]> => {
    const res = await apiClient.get<ApiResponse<DealProduct[]>>('/deals', params);
    return res.data || [];
  },

  getCoupons: async (): Promise<Coupon[]> => {
    const res = await apiClient.get<ApiResponse<Coupon[]>>('/deals/coupons');
    return res.data || [];
  },
};

// 6. Wishlist API (Direct to MobileBackend /api/v1/wishlist)
export const wishlistApi = {
  getWishlist: async (): Promise<WishlistItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<WishlistItem[]>>('/wishlist');
      return res.data || [];
    } catch {
      return [];
    }
  },

  addToWishlist: async (productId: number, priceAlertThreshold?: number): Promise<boolean> => {
    await apiClient.post('/wishlist', {
      product_id: productId,
      price_alert_threshold: priceAlertThreshold,
    });
    return true;
  },

  removeFromWishlist: async (productId: number): Promise<boolean> => {
    await apiClient.delete(`/wishlist/${productId}`);
    return true;
  },
};

// 7. Price Drop Alerts API (Direct to MobileBackend /api/v1/alerts)
export const alertsApi = {
  getAlerts: async (): Promise<PriceAlertItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<PriceAlertItem[]>>('/alerts');
      return res.data || [];
    } catch {
      return [];
    }
  },

  setAlert: async (productId: number, targetPrice: number): Promise<boolean> => {
    await apiClient.post('/alerts', {
      product_id: productId,
      target_price: targetPrice,
    });
    return true;
  },

  deleteAlert: async (productId: number): Promise<boolean> => {
    await apiClient.delete(`/alerts/${productId}`);
    return true;
  },
};

// 8. Loyalty Wallet API (Direct to MobileBackend /api/v1/wallet)
export const walletApi = {
  getWallet: async (): Promise<LoyaltyWallet | null> => {
    try {
      const res = await apiClient.get<ApiResponse<LoyaltyWallet>>('/wallet');
      return res.data;
    } catch {
      return null;
    }
  },
};

// 9. Customer Auth API (Direct to MobileBackend /api/v1/auth)
export const customerApi = {
  login: async (email: string): Promise<{ customer: Customer; token: string }> => {
    const res = await apiClient.post<ApiResponse<{ customer: Customer; token: string }>>('/auth/login', { email });
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res.data;
  },

  getProfile: async (): Promise<Customer | null> => {
    try {
      const res = await apiClient.get<ApiResponse<Customer>>('/auth/me');
      return res.data;
    } catch {
      return null;
    }
  },

  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
  }): Promise<Customer | null> => {
    try {
      const res = await apiClient.put<ApiResponse<Customer>>('/auth/me', data);
      return res.data;
    } catch {
      return null;
    }
  },
};

// 10. Support & FAQs (Direct to MobileBackend /api/v1/support/faqs)
export const supportApi = {
  getFaqs: async (): Promise<FAQItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<FAQItem[]>>('/support/faqs');
      return res.data || [];
    } catch {
      return [];
    }
  },
};

// 11. Clicks Outlink Analytics (Direct to MobileBackend /api/v1/clicks)
export const clicksApi = {
  trackClick: async (productId: number, store: string, url: string): Promise<void> => {
    try {
      await apiClient.post('/clicks', { product_id: productId, store, outlink_url: url });
    } catch {}
  },
};

// 12. Location-Based Nearby Offers API (Direct to MobileBackend /api/v1/nearby)
export const nearbyApi = {
  getNearbyOffers: async (params?: {
    radiusKm?: number;
    lat?: number;
    lng?: number;
    category?: string;
  }): Promise<NearbyOffer[]> => {
    try {
      const res = await apiClient.get<ApiResponse<NearbyOffer[]>>('/nearby', params);
      return res.data || [];
    } catch (err) {
      console.error('nearbyApi error:', err);
      return [];
    }
  },
};
