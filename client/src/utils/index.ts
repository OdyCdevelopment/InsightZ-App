import { CURRENCY, LOCALE } from '@insightz/shared';
import type { Product } from '@insightz/shared';

export function formatPrice(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return `${CURRENCY} 0`;
  return `${CURRENCY} ${Number(val).toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function getProductPrice(product: Product | null | undefined): number {
  if (!product) return 0;
  if (product.min_price && Number(product.min_price) > 0) return Number(product.min_price);
  if (product.variants && product.variants.length > 0) {
    const validVariant = product.variants.find((v) => v.price && Number(v.price) > 0);
    if (validVariant && Number(validVariant.price) > 0) return Number(validVariant.price);
    if (product.variants[0]?.price && Number(product.variants[0].price) > 0) return Number(product.variants[0].price);
  }
  if ((product as any).price && Number((product as any).price) > 0) return Number((product as any).price);
  if (product.max_price && Number(product.max_price) > 0) return Number(product.max_price);
  return Number(product.min_price) || 0;
}

export function getProductDiscount(product: Product | null | undefined): number {
  if (!product) return 0;
  if (product.max_discount_percentage && Number(product.max_discount_percentage) > 0) {
    return Math.round(Number(product.max_discount_percentage));
  }
  if (product.variants && product.variants.length > 0) {
    const variantWithDisc = product.variants.find((v) => v.discount_percentage && Number(v.discount_percentage) > 0);
    if (variantWithDisc) return Math.round(Number(variantWithDisc.discount_percentage));
    const variantWithCompare = product.variants.find((v) => v.compare_at_price && Number(v.compare_at_price) > Number(v.price));
    if (variantWithCompare && Number(variantWithCompare.compare_at_price) > 0) {
      const disc = ((Number(variantWithCompare.compare_at_price) - Number(variantWithCompare.price)) / Number(variantWithCompare.compare_at_price)) * 100;
      return Math.round(disc);
    }
  }
  return 0;
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
