import { api } from './api';
import type { Product, ProductFilters, ProductsResponse } from '@insightz/shared';

export class ProductService {
  static async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.store && filters.store !== 'all') params.set('store', filters.store);
    if (filters.offer) params.set('offer', 'true');
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.min_price != null) params.set('min_price', String(filters.min_price));
    if (filters.max_price != null) params.set('max_price', String(filters.max_price));
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const { data } = await api.get<ProductsResponse>(`/api/products?${params}`);
    return data;
  }

  static async getProduct(id: number): Promise<Product> {
    const { data } = await api.get<{ success: boolean; product: Product }>(`/api/products/${id}`);
    return data.product;
  }

  static async getCategories(): Promise<string[]> {
    try {
      const { data } = await api.get<any>('/api/categories');
      if (!data) return [];
      if (Array.isArray(data.categories)) return data.categories;
      if (Array.isArray(data.data)) {
        const extractNames = (items: any[]): string[] => {
          const names: string[] = [];
          for (const item of items) {
            if (typeof item === 'string') {
              names.push(item);
            } else if (item && typeof item.name === 'string') {
              names.push(item.name);
              if (Array.isArray(item.children)) {
                names.push(...extractNames(item.children));
              }
            }
          }
          return Array.from(new Set(names));
        };
        return extractNames(data.data);
      }
      if (Array.isArray(data)) {
        return data.map((d: any) => (typeof d === 'string' ? d : d?.name)).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  }

  static async getStores(): Promise<{ name: string; domain: string }[]> {
    try {
      const { data } = await api.get<any>('/api/stores');
      if (Array.isArray(data?.stores)) return data.stores;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  }
}
