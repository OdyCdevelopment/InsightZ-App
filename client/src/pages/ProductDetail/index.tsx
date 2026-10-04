import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Tag, Package, Layers, ChevronRight, Heart } from 'lucide-react';
import { ProductService } from '../../services/productService';
import type { Product, ProductVariant } from '@insightz/shared';
import { formatPrice, capitalize, getProductPrice, getProductDiscount } from '../../utils';
import { useWishlistStore } from '../../store/wishlistStore';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    ProductService.getProduct(Number(id))
      .then(setProduct)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const dimensions = useMemo(() => {
    if (!product?.variants) return [];
    const dims: { name: string; values: string[] }[] = [];
    const optionNames = new Set<string>();
    product.variants.forEach(v => {
      if (v.option1_name) optionNames.add(v.option1_name);
      if (v.option2_name) optionNames.add(v.option2_name);
      if (v.option3_name) optionNames.add(v.option3_name);
    });

    optionNames.forEach(name => {
      const values = new Set<string>();
      product.variants.forEach(v => {
        if (v.option1_name === name && v.option1) values.add(v.option1);
        if (v.option2_name === name && v.option2) values.add(v.option2);
        if (v.option3_name === name && v.option3) values.add(v.option3);
      });
      dims.push({ name, values: Array.from(values) });
    });
    return dims;
  }, [product]);

  const hasVariantSelector = dimensions.length > 0;

  useEffect(() => {
    if (dimensions.length > 0 && Object.keys(selectedOptions).length === 0) {
      const initial: Record<string, string> = {};
      dimensions.forEach(dim => {
        initial[dim.name] = dim.values[0];
      });
      setSelectedOptions(initial);
    }
  }, [dimensions, selectedOptions]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find(v => {
      let matches = true;
      if (v.option1_name && selectedOptions[v.option1_name] !== v.option1) matches = false;
      if (v.option2_name && selectedOptions[v.option2_name] !== v.option2) matches = false;
      if (v.option3_name && selectedOptions[v.option3_name] !== v.option3) matches = false;
      return matches;
    }) || product.variants[0];
  }, [product, selectedOptions]);

  const handleOptionSelect = (name: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [name]: value }));
  };

  const isOptionValueAvailable = (variants: ProductVariant[], name: string, value: string, currentSelections: Record<string, string>) => {
    return variants.some(v =>
      ((v.option1_name === name && v.option1 === value) ||
        (v.option2_name === name && v.option2 === value) ||
        (v.option3_name === name && v.option3 === value)) && v.available
    );
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square bg-slate-100 rounded-2xl" />
        <div className="space-y-6">
          <div className="h-6 bg-slate-100 rounded w-20" />
          <div className="h-8 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-50 rounded w-1/3" />
          <div className="h-10 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-50 rounded w-1/4" />
          <div className="h-32 bg-slate-50 rounded-xl" />
          <div className="h-14 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
  if (error || !product) return (
    <div className="text-center py-24">
      <p className="text-red-400 mb-4">Product not found.</p>
      <Link to="/" className="text-violet-400 hover:text-violet-300">← Back to Catalog</Link>
    </div>
  );

  const displayImage = selectedVariant?.image_url || product.image_url;
  const displayPrice = selectedVariant?.price != null ? Number(selectedVariant.price) : getProductPrice(product);

  const bestVariant =
    product.variants?.find((v) => v.discount_percentage && Number(v.discount_percentage) > 0) ??
    product.variants?.find((v) => v.compare_at_price && Number(v.compare_at_price) > Number(v.price)) ??
    product.variants?.[0];

  const rawCompareAtPrice =
    selectedVariant?.compare_at_price != null && Number(selectedVariant.compare_at_price) > 0
      ? Number(selectedVariant.compare_at_price)
      : (product as any).compare_at_price != null && Number((product as any).compare_at_price) > 0
        ? Number((product as any).compare_at_price)
        : bestVariant?.compare_at_price != null && Number(bestVariant.compare_at_price) > 0
          ? Number(bestVariant.compare_at_price)
          : null;

  let discountPct =
    selectedVariant?.discount_percentage != null && Number(selectedVariant.discount_percentage) > 0
      ? Number(selectedVariant.discount_percentage)
      : getProductDiscount(product);

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

  const displayDiscount = discountPct;
  const displayCompare = finalCompareAtPrice;
  const displayIsOffer = hasDiscount || product.is_offer || Boolean(selectedVariant?.is_offer);
  const displayAvailable = selectedVariant?.available ?? product.variants?.some(v => v.available) ?? true;
  const displaySku = selectedVariant?.sku ?? (product as any).sku ?? 'N/A';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors font-medium">
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Image ── */}
        <div className="rounded-2xl overflow-hidden aspect-square bg-white relative">
          <AnimatePresence mode="wait">
            {displayImage ? (
              <motion.img
                key={displayImage}
                src={displayImage}
                alt={product.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <Package size={48} className="opacity-30" />
                <span className="text-sm">No Image</span>
              </div>
            )}
          </AnimatePresence>

          {/* Offer badge overlay */}
          {hasDiscount && displayDiscount > 0 ? (
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm">
                {Math.round(displayDiscount)}% OFF
              </span>
            </div>
          ) : displayIsOffer ? (
            <div className="absolute top-4 left-4 z-10">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm">
                <Tag size={13} /> OFFER
              </span>
            </div>
          ) : null}

          {/* Wishlist button */}
          <button
            type="button"
            onClick={() => product && toggleWishlist(product)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center text-slate-700 hover:text-red-500 hover:scale-110 active:scale-95 transition-all z-10"
            aria-label="Wishlist"
          >
            <Heart
              size={18}
              className={product && isInWishlist(product.insightz_product_id) ? 'text-red-500 fill-red-500' : ''}
            />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mb-3">
              {capitalize(product.source)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">{product.title}</h1>
            {product.vendor && <p className="text-slate-500 text-sm mt-2 font-medium">by {product.vendor}</p>}
          </div>

          {/* Price */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${displayPrice}-${displayCompare}`}
              className="flex items-baseline gap-3 flex-wrap"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-3xl font-extrabold text-slate-900">{formatPrice(displayPrice)}</span>
              {hasDiscount && displayCompare && displayCompare > displayPrice && (
                <>
                  <span className="text-xl text-slate-400 line-through font-medium">{formatPrice(displayCompare)}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-sm font-bold">
                    {Math.round(displayDiscount)}% OFF
                  </span>
                  <span className="text-xs font-bold text-red-600">
                    -{Math.round(displayDiscount)}%
                  </span>
                </>
              )}
              {!hasDiscount && displayIsOffer && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-sm font-bold">
                  <Tag size={12} /> OFFER
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Availability */}
          <AnimatePresence mode="wait">
            <motion.div
              key={String(displayAvailable)}
              className={`flex items-center gap-2 text-sm font-semibold ${displayAvailable ? 'text-emerald-600' : 'text-slate-400'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {displayAvailable ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {displayAvailable ? 'In Stock — Available for purchase' : 'Out of Stock'}
            </motion.div>
          </AnimatePresence>

          {/* ── Variant Selector ── */}
          {hasVariantSelector && (
            <div className="space-y-4">
              {dimensions.map(dim => (
                <div key={dim.name}>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={14} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">{dim.name}</span>
                    {selectedOptions[dim.name] && (
                      <>
                        <ChevronRight size={12} className="text-slate-400" />
                        <span className="text-sm text-black font-semibold">{selectedOptions[dim.name]}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dim.values.map(value => {
                      const isSelected = selectedOptions[dim.name] === value;
                      const available = isOptionValueAvailable(product.variants, dim.name, value, selectedOptions);
                      return (
                        <button
                          key={value}
                          onClick={() => available && handleOptionSelect(dim.name, value)}
                          disabled={!available}
                          className={`
                            relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150
                            ${isSelected
                              ? 'bg-black text-white scale-105'
                              : available
                                ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            }
                          `}
                        >
                          {value}
                          {!available && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="w-full h-px bg-slate-300 absolute rotate-[12deg]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="rounded-xl p-4 bg-slate-50 space-y-3">
            {product.product_type && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Category</span>
                <span className="text-slate-900 font-medium">{product.product_type}</span>
              </div>
            )}
            {displaySku && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">SKU</span>
                <span className="text-slate-900 font-mono">{displaySku}</span>
              </div>
            )}
            {hasVariantSelector && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Variants</span>
                <span className="text-slate-900 font-medium">{product.variants.length} options</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Last Updated</span>
              <span className="text-slate-900 font-medium">{product.updated_at?.slice(0, 10)}</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="rounded-xl p-4 bg-slate-50">
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{product.description}</p>
            </div>
          )}

          {/* CTA */}
          {product.product_url && (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-full justify-center px-8 py-4 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95"
            >
              View on {capitalize(product.source)} <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetail;
                    <span>Sign in to view on {capitalize(product.source)}</span>
                    <ExternalLink size={16} />
                  </>
                ) : (
  <>
    <span>View on {capitalize(product.source)}</span>
    <ExternalLink size={18} />
  </>
)}
              </button >

  {!isAuthenticated && (
    <p className="text-[11px] text-center text-slate-500 font-medium">
      🔒 Login is required to claim this direct offer link.
    </p>
  )}
            </div >
          )}
        </div >
      </div >
    </motion.div >
  );
};

export default ProductDetail;
