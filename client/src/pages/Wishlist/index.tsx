import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { ProductCard } from '../../components/cards/ProductCard';

export const Wishlist: React.FC = () => {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              My Wishlist
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Save items to track price fluctuations, discounts, and cross-store availability.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-600 transition-colors self-start sm:self-auto py-1"
          >
            <Trash2 size={14} />
            <span>Clear Wishlist</span>
          </button>
        )}
      </div>

      {/* Items Content */}
      {items.length === 0 ? (
        <div className="text-center py-20 rounded-xl p-8 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-neutral-50 text-neutral-400 flex items-center justify-center mx-auto mb-4">
            <Heart size={20} />
          </div>
          <h2 className="text-base font-semibold text-neutral-900 mb-1">Your wishlist is empty</h2>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Click the heart icon on any product in the catalog to save it here for price tracking and side-by-side comparison.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded hover:bg-neutral-800 transition-colors"
          >
            <ShoppingBag size={14} />
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((product) => (
            <ProductCard key={product.insightz_product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
