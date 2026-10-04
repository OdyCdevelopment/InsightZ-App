import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { formatPrice, getProductPrice, getProductDiscount } from '../../utils';

export const WishlistDrawer: React.FC = () => {
  const { items, isDrawerOpen, closeDrawer, removeItem, clearWishlist } = useWishlistStore();

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white flex flex-col h-full shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100/60">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Wishlist</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded-full">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-slate-500 hover:text-black transition-colors"
                  aria-label="Close Wishlist"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-slate-100">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                      <Heart size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Your wishlist is empty</h3>
                    <p className="text-xs text-slate-500 max-w-xs mb-6">
                      Click the heart icon on any product to save it here for quick access and price tracking.
                    </p>
                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors inline-flex items-center gap-2"
                    >
                      <ShoppingBag size={14} />
                      Explore Catalog
                    </button>
                  </div>
                ) : (
                  items.map((product) => (
                    <div key={product.insightz_product_id} className="py-4 flex gap-3.5 items-center group">
                      {/* Product Thumbnail with fixed constrained sizing */}
                      <Link
                        to={`/product/${product.insightz_product_id}`}
                        onClick={closeDrawer}
                        className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg bg-slate-50 overflow-hidden shrink-0 block relative"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                            No Image
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-2">
                        <Link
                          to={`/product/${product.insightz_product_id}`}
                          onClick={closeDrawer}
                          className="text-xs font-bold text-slate-900 hover:underline line-clamp-2 leading-snug block"
                        >
                          {product.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                          {product.vendor || product.source}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {formatPrice(getProductPrice(product))}
                          </span>
                          {getProductDiscount(product) > 0 ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              {getProductDiscount(product)}% OFF
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(product.insightz_product_id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Actions */}
              {items.length > 0 && (
                <div className="p-6 bg-white border-t border-slate-100/60 space-y-2.5">
                  <Link
                    to="/wishlist"
                    onClick={closeDrawer}
                    className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>VIEW FULL WISHLIST PAGE</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={clearWishlist}
                    className="w-full py-2 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors text-center block"
                  >
                    Clear All Items
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
