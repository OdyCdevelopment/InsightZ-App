import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '@insightz/shared';
import { formatPrice, getProductPrice, getProductDiscount } from '../../utils';
import { useWishlistStore } from '../../store/wishlistStore';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isFav = isInWishlist(product.insightz_product_id);

  const displayPrice = getProductPrice(product);
  const bestVariant =
    product.variants?.find((v) => v.discount_percentage && Number(v.discount_percentage) > 0) ??
    product.variants?.find((v) => v.compare_at_price && Number(v.compare_at_price) > Number(v.price)) ??
    product.variants?.[0];

  const rawCompareAtPrice =
    (product as any).compare_at_price != null && Number((product as any).compare_at_price) > 0
      ? Number((product as any).compare_at_price)
      : bestVariant?.compare_at_price != null && Number(bestVariant.compare_at_price) > 0
      ? Number(bestVariant.compare_at_price)
      : null;

  let discountPct = getProductDiscount(product);

  if (rawCompareAtPrice && rawCompareAtPrice > displayPrice && discountPct === 0) {
    discountPct = Math.round(((rawCompareAtPrice - displayPrice) / rawCompareAtPrice) * 100);
  }

  let finalCompareAtPrice = rawCompareAtPrice;
  if ((!finalCompareAtPrice || finalCompareAtPrice <= displayPrice) && discountPct > 0 && displayPrice > 0) {
    finalCompareAtPrice = Math.round(displayPrice / (1 - discountPct / 100));
  }

  if (product.is_offer && (!finalCompareAtPrice || finalCompareAtPrice <= displayPrice)) {
    const rawDiscAmount = (product as any).discount_amount ? Number((product as any).discount_amount) : 0;
    if (rawDiscAmount > 0) {
      finalCompareAtPrice = displayPrice + rawDiscAmount;
      discountPct = Math.round((rawDiscAmount / finalCompareAtPrice) * 100);
    } else {
      discountPct = discountPct || 20;
      finalCompareAtPrice = Math.round(displayPrice / (1 - discountPct / 100));
    }
  }

  const hasDiscount =
    (finalCompareAtPrice != null && finalCompareAtPrice > displayPrice) || discountPct > 0 || product.is_offer;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3 }}
      className="h-full"
    >
      <Link
        to={`/product/${product.insightz_product_id}`}
        className="group flex flex-col h-full relative cursor-pointer"
      >
        {/* Image Frame - Borderless, minimal rounding */}
        <div className="aspect-[4/5] bg-slate-50 overflow-hidden relative flex items-center justify-center rounded-sm">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-xs text-slate-400">No Image</span>
          )}

          {/* Top Left Badge */}
          {discountPct > 0 ? (
            <span className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs shadow-sm">
              {discountPct}% Off
            </span>
          ) : product.is_offer ? (
            <span className="absolute top-2 left-2 px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xs shadow-sm">
              Offer
            </span>
          ) : null}

          {/* Action Icons Container (Wishlist & Bag) */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              type="button"
              onClick={handleWishlistClick}
              className="w-8 h-8 bg-white flex items-center justify-center text-slate-900 hover:bg-slate-100 hover:text-red-500 transition-all rounded-full active:scale-90"
              aria-label="Wishlist"
            >
              <Heart
                size={14}
                className={isFav ? 'text-red-500 fill-red-500' : 'text-slate-700'}
              />
            </button>
            <button
              type="button"
              className="w-8 h-8 bg-white flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-all rounded-full active:scale-90"
              title="View Product"
            >
              <ShoppingBag size={14} />
            </button>
          </div>
        </div>

        {/* Info - Left aligned, clean */}
        <div className="pt-3 pb-1 flex flex-col flex-1 text-left">
          <p className="text-[11px] sm:text-[13px] text-slate-800 line-clamp-1 mb-1">
            {product.title}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[13px] sm:text-sm font-bold text-slate-900">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && finalCompareAtPrice && finalCompareAtPrice > displayPrice && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatPrice(finalCompareAtPrice)}
              </span>
            )}
            {hasDiscount && discountPct > 0 && (
              <span className="text-[10px] font-bold text-red-600 ml-auto">
                Save {discountPct}%
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
