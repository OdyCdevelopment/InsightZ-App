// TypeScript models matching InsightZ MobileBackend REST API

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasMore?: boolean;
    alerts_triggered?: number;
  };
  error?: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  position?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  product_count?: number;
}

export interface Product {
  id: number;
  insightz_product_id?: number | null;
  title: string;
  store: string;
  store_domain?: string | null;
  vendor?: string | null;
  category?: { id: number; name: string; slug: string } | null;
  price: number;
  compare_at_price?: number | null;
  discount_percentage?: number | null;
  currency: string;
  image_url?: string | null;
  product_url?: string | null;
  available: boolean;
  is_offer?: boolean;
}

export interface ProductVariant {
  id: number;
  variant_id?: string | null;
  title?: string | null;
  sku?: string | null;
  option1_name?: string | null;
  option1?: string | null;
  price: number;
  compare_at_price?: number | null;
  discount_percentage?: number | null;
  available: boolean;
  image_url?: string | null;
}

export interface ProductDetail extends Product {
  description?: string | null;
  tags?: string[];
  rating?: number;
  review_count?: number;
  variants?: ProductVariant[];
}

export interface StoreComparisonItem {
  product_id: number;
  store_name: string;
  store_domain?: string | null;
  title: string;
  price: number;
  currency: string;
  is_lowest_price: boolean;
  price_diff_from_lowest: number;
  product_url?: string | null;
  in_stock: boolean;
}

export interface PriceComparisonResult {
  product_id: number;
  title: string;
  lowest_price: number;
  highest_price: number;
  max_savings: number;
  stores_count: number;
  cheapest_store: string;
  currency: string;
  comparison: StoreComparisonItem[];
  stores?: StoreComparisonItem[];
}

export interface FlashDeal {
  id: number;
  title: string;
  discount_pct: number;
  coupon_code?: string | null;
  description?: string | null;
  is_flash_sale?: boolean;
  store?: {
    name: string;
    domain?: string;
    logo_url?: string;
  } | null;
}

export interface Store {
  id: number;
  name: string;
  domain?: string | null;
  logo_url?: string | null;
  currency?: string | null;
}

export interface HomeFeedData {
  banners: Banner[];
  categories: Category[];
  trending_products: Product[];
  top_offers?: Product[];
  new_in_women?: Product[];
  new_in_men?: Product[];
  flash_deals: FlashDeal[];
  featured_stores: Store[];
}

export interface DealProduct extends Product {
  savings?: number;
}

export interface Coupon {
  id: number;
  code: string;
  discount_pct?: number | null;
  description?: string | null;
  store_name?: string | null;
  store_domain?: string | null;
  expires_at?: string | null;
  terms?: string | null;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  saved_at: string;
  price_alert_threshold?: number | null;
  is_target_reached: boolean;
  product: Product;
}

export interface PriceAlertItem {
  id: number;
  product_id: number;
  target_price: number;
  current_price: number;
  is_target_met: boolean;
  difference_to_target: number;
  product: {
    id: number;
    insightz_product_id?: number | null;
    title: string;
    store: string;
    vendor?: string | null;
    price: number;
    currency: string;
    image_url?: string | null;
    product_url?: string | null;
    available: boolean;
  };
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  status: string;
}

export interface WalletTransaction {
  id: number;
  direction: 'credit' | 'debit';
  amount: number;
  reason: string;
  created_at: string;
}

export interface LoyaltyWallet {
  id: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  balance: number;
  lifetime_cashback: number;
  last_redemption_at?: string | null;
  transactions: WalletTransaction[];
}

export interface CustomerActivity {
  id: number;
  action: string;
  device?: string | null;
  created_at: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export interface NearbyOffer {
  id: string;
  productId: number;
  storeName: string;
  storeCategory: string;
  dealTitle: string;
  discount: string;
  discountPct: number;
  distanceMeters: number;
  distanceFormatted: string;
  timeEstimate: string;
  isWalkable: boolean;
  rating: number;
  reviewsCount: number;
  originalPrice: number;
  offerPrice: number;
  currency: string;
  storeImage: string;
  productUrl?: string | null;
  coords: { x: number; y: number };
  isHot?: boolean;
}
