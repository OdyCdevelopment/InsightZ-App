import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductService } from '../../services/productService';
import { formatPrice, getProductPrice, getProductDiscount } from '../../utils';
import type { Product } from '@insightz/shared';

// Crisp Line Icons matching reference design
const JacketIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 3 L10 7 L14 7 L17 3 L20 8 L18 13 L16 12 L16 21 L8 21 L8 12 L6 13 L4 8 Z" />
    <line x1="12" y1="7" x2="12" y2="21" />
    <line x1="7" y1="8" x2="10" y2="10" />
    <line x1="17" y1="8" x2="14" y2="10" />
    <line x1="9.5" y1="14" x2="11.5" y2="14" />
    <line x1="12.5" y1="14" x2="14.5" y2="14" />
  </svg>
);

const ShirtIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 3 C9 5 15 5 15 3 L20 6 L18 11 L16 10 L16 21 L8 21 L8 10 L6 11 L4 6 Z" />
    <path d="M9 3 C10.5 4.5 13.5 4.5 15 3" />
  </svg>
);

const PantsIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 3 L18 3 L19 21 L13 21 L12 10 L11 21 L5 21 Z" />
    <line x1="6" y1="6" x2="18" y2="6" />
    <line x1="12" y1="6" x2="12" y2="10" />
    <line x1="8" y1="9" x2="9" y2="9" />
    <line x1="15" y1="9" x2="16" y2="9" />
  </svg>
);

const ShoesIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 15 C3 12 4.5 10 8.5 10 C10 10 11.5 11 13 12.5 C16 13 18.5 13 20.5 14 L22 16.5 C22 18.5 21.5 19.5 19.5 19.5 L4.5 19.5 C3.5 19.5 3 18 3 15 Z" />
    <line x1="3" y1="17.5" x2="22" y2="17.5" />
    <path d="M12 12 L11 8.5 L14 8 L15 12" />
    <circle cx="11.5" cy="10.5" r="0.8" fill="currentColor" />
  </svg>
);

const DressIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 3 L7 8.5 C7 10.5 9 11.5 10 12.5 L5 21 L19 21 L14 12.5 C15 11.5 17 10.5 17 8.5 L15 3 C14 5 10 5 9 3 Z" />
    <line x1="9.5" y1="12.5" x2="14.5" y2="12.5" />
  </svg>
);

const AccessoriesIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <ellipse cx="12" cy="12" rx="8" ry="5.5" />
    <ellipse cx="12" cy="12" rx="4.5" ry="3" />
    <path d="M17 13 L20 18" />
    <path d="M19 14 L22 17" />
    <rect x="9.5" y="8" width="5" height="8" rx="1" />
  </svg>
);

interface CategoryItem {
  id: string;
  name: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'jacket', name: 'Jacket', query: 'Jacket', icon: JacketIcon },
  { id: 'shirt', name: 'Shirt', query: 'Shirt', icon: ShirtIcon },
  { id: 'pants', name: 'Pants', query: 'Pants', icon: PantsIcon },
  { id: 'shoes', name: 'Shoes', query: 'Shoes', icon: ShoesIcon },
  { id: 'dress', name: 'Dress', query: 'Dress', icon: DressIcon },
  { id: 'accessories', name: 'Accessories', query: 'Accessories', icon: AccessoriesIcon },
];

interface RealDisplayProduct {
  id: number;
  title: string;
  price: number;
  originalPrice?: number;
  discountPct?: number;
  image: string;
}

export const CategoryShowcase: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('jacket');
  const [products, setProducts] = useState<RealDisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const activeCat = CATEGORIES.find((c) => c.id === selectedCategory);
    const query = activeCat ? activeCat.query : 'Jacket';

    ProductService.getProducts({ search: query, offer: true, limit: 6 })
      .then((res) => {
        if (!isMounted) return;
        let rawProducts: Product[] = Array.isArray(res?.products) ? res.products : [];

        // If no products found under specific search with offer=true, fallback to general offer products
        if (rawProducts.length === 0) {
          ProductService.getProducts({ offer: true, limit: 6 })
            .then((fallbackRes) => {
              if (!isMounted) return;
              if (Array.isArray(fallbackRes?.products)) {
                formatAndSetProducts(fallbackRes.products);
              }
            })
            .catch(() => {});
          return;
        }

        formatAndSetProducts(rawProducts);
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const formatAndSetProducts = (rawProducts: Product[]) => {
      const formatted: RealDisplayProduct[] = rawProducts.map((p) => {
        const displayPrice = getProductPrice(p);
        let discount = getProductDiscount(p);

        const bestVariant =
          p.variants?.find((v) => v.discount_percentage && Number(v.discount_percentage) > 0) ??
          p.variants?.find((v) => v.compare_at_price && Number(v.compare_at_price) > Number(v.price)) ??
          p.variants?.[0];

        let origPrice =
          (p as any).compare_at_price && Number((p as any).compare_at_price) > displayPrice
            ? Number((p as any).compare_at_price)
            : bestVariant?.compare_at_price && Number(bestVariant.compare_at_price) > displayPrice
            ? Number(bestVariant.compare_at_price)
            : undefined;

        if (origPrice && (!discount || discount === 0)) {
          discount = Math.round(((origPrice - displayPrice) / origPrice) * 100);
        } else if (!origPrice && discount > 0) {
          origPrice = Math.round(displayPrice / (1 - discount / 100));
        }

        if (p.is_offer && (!origPrice || origPrice <= displayPrice)) {
          const rawDiscAmount = (p as any).discount_amount ? Number((p as any).discount_amount) : 0;
          if (rawDiscAmount > 0) {
            origPrice = displayPrice + rawDiscAmount;
            discount = Math.round((rawDiscAmount / origPrice) * 100);
          }
        }

        const hasRealOffer = Boolean(
          (origPrice && origPrice > displayPrice) ||
          (discount > 0) ||
          p.is_offer ||
          (p as any).is_offer
        );

        return {
          id: p.insightz_product_id,
          title: p.title,
          price: displayPrice,
          originalPrice: hasRealOffer && origPrice && origPrice > displayPrice ? origPrice : undefined,
          discountPct: hasRealOffer && discount > 0 ? discount : undefined,
          image: p.image_url || '',
        };
      });

      setProducts(formatted);
    };

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleProductNavigate = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const featuredProduct = products[0];
  const gridProducts = products.slice(1, 5);

  return (
    <div className="py-6 sm:py-8 space-y-10 sm:space-y-12">
      {/* 1. CATEGORIES SECTION (Real Data, Sharp Edges, No Border Radius) */}
      <section>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Categories
          </h2>
          <button
            type="button"
            onClick={() => navigate('/products?offer=true')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors border-0 bg-transparent cursor-pointer rounded-none"
          >
            <span>View all offers</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 6 Category Tiles - Sharp / No Border Radius */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 border-0 rounded-none cursor-pointer min-h-[105px] sm:min-h-[120px] select-none transition-colors ${
                  isSelected
                    ? 'bg-[#2A2E39] text-white shadow-none'
                    : 'bg-[#F7F8FA] hover:bg-[#EEF0F5] text-slate-400 hover:text-slate-700 shadow-none'
                }`}
              >
                <div className={`mb-2.5 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                  <IconComponent className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>
                <span
                  className={`text-xs sm:text-[13px] tracking-tight ${
                    isSelected ? 'text-white font-bold' : 'text-slate-400 font-medium'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. NEW ARRIVALS SECTION (Real Data, Sharp Edges, No Border Radius) */}
      <section>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            New Arrivals
          </h2>
          <button
            type="button"
            onClick={() => navigate(`/products?search=${encodeURIComponent(selectedCategory)}`)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors border-0 bg-transparent cursor-pointer rounded-none"
          >
            <span>View all</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          /* Loading Skeletons - Sharp / No Border Radius */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            <div className="lg:col-span-6 bg-[#F7F8FA] p-8 min-h-[340px] animate-pulse rounded-none" />
            <div className="lg:col-span-6 grid grid-cols-2 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#F7F8FA] p-6 min-h-[160px] animate-pulse rounded-none" />
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          /* Layout: Large Left Card + Right 2x2 Grid - All Sharp / No Border Radius */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            {/* Featured Large Card (Left) */}
            {featuredProduct && (
              <div
                onClick={() => handleProductNavigate(featuredProduct.id)}
                className="lg:col-span-6 bg-[#F7F8FA] hover:bg-[#F2F4F8] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 cursor-pointer border-0 rounded-none select-none relative transition-colors"
              >
                {/* Red Discount Offer Badge */}
                {featuredProduct.discountPct && featuredProduct.discountPct > 0 && (
                  <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#EF4444] text-white text-[10px] font-bold uppercase tracking-wider rounded-none">
                    {featuredProduct.discountPct}% OFF
                  </span>
                )}

                {/* Product Image */}
                <div className="w-full sm:w-1/2 aspect-square flex items-center justify-center overflow-hidden bg-white p-2 rounded-none">
                  {featuredProduct.image ? (
                    <img
                      src={featuredProduct.image}
                      alt={featuredProduct.title}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No Image</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left justify-center w-full sm:w-1/2 space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                    {featuredProduct.title}
                  </h3>

                  {/* Price & Offer Row */}
                  <div className="flex items-baseline gap-2 flex-wrap justify-center sm:justify-start">
                    <span className="text-base sm:text-lg font-bold text-slate-900">
                      {formatPrice(featuredProduct.price)}
                    </span>
                    {featuredProduct.originalPrice && featuredProduct.originalPrice > featuredProduct.price && (
                      <span className="text-xs sm:text-sm font-medium text-slate-400 line-through">
                        {formatPrice(featuredProduct.originalPrice)}
                      </span>
                    )}
                    {featuredProduct.discountPct && featuredProduct.discountPct > 0 && (
                      <span className="text-xs font-bold text-red-600">
                        -{featuredProduct.discountPct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2x2 Grid (Right) */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
              {gridProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleProductNavigate(prod.id)}
                  className="bg-[#F7F8FA] hover:bg-[#F2F4F8] p-4 sm:p-5 flex flex-col items-center justify-between cursor-pointer border-0 rounded-none select-none relative transition-colors"
                >
                  {/* Red Discount Offer Badge */}
                  {prod.discountPct && prod.discountPct > 0 && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#EF4444] text-white text-[9px] font-bold uppercase tracking-wider rounded-none">
                      {prod.discountPct}% OFF
                    </span>
                  )}

                  {/* Product Image */}
                  <div className="w-full aspect-square flex items-center justify-center p-1 mb-2 overflow-hidden bg-white rounded-none">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No Image</span>
                    )}
                  </div>

                  {/* Product Title, Price & Offer Row */}
                  <div className="text-center w-full mt-auto">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                      {prod.title}
                    </h4>
                    <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {formatPrice(prod.price)}
                      </span>
                      {prod.originalPrice && prod.originalPrice > prod.price && (
                        <span className="text-[11px] font-medium text-slate-400 line-through">
                          {formatPrice(prod.originalPrice)}
                        </span>
                      )}
                      {prod.discountPct && prod.discountPct > 0 && (
                        <span className="text-[10px] font-bold text-red-600">
                          -{prod.discountPct}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 font-medium">
            No products found for this category.
          </div>
        )}
      </section>
    </div>
  );
};
