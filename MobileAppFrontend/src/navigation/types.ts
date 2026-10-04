import { Product } from '../types/api';

export type TabParamList = {
  Home: undefined;
  Explore: { categoryId?: number; search?: string } | undefined;
  Nearby: undefined;
  Deals: undefined;
  Wishlist: undefined;
  Profile: undefined;
  ProductDetail: { product?: Product; productId?: number } | undefined;
};
