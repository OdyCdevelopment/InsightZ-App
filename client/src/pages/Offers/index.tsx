import React, { useState, useEffect, useCallback } from 'react';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductService } from '../../services/productService';
import type { Product, SortOption } from '@insightz/shared';
import { Tag, TrendingDown } from 'lucide-react';

const STORES = [
  { label: 'All Stores', value: 'all' },
  { label: 'Daraz', value: 'daraz' },
  { label: 'Hameedia', value: 'hameedia' },
  { label: 'Thilakawardhana', value: 'thilakawardhana' },
  { label: 'Mimosa', value: 'mimosa' },
];

const DISCOUNT_TIERS = [
  { label: 'All Discounts', minDiscount: 0 },
  { label: '30%+ OFF', minDiscount: 30 },
  { label: '40%+ OFF', minDiscount: 40 },
  { label: '50%+ OFF', minDiscount: 50 },
];

export const Offers: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedTier, setSelectedTier] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProductService.getProducts({
        offer: true,
        store: selectedStore !== 'all' ? selectedStore : undefined,
        sort: 'discount_desc',
        page,
        limit: 16,
      });

      // Filter client-side by discount tier if selected
      let filtered = res.products;
      if (selectedTier > 0) {
        filtered = filtered.filter((p) => {
          const pct = p.max_discount_percentage ? Number(p.max_discount_percentage) : 0;
          return pct >= selectedTier;
        });
      }

      setProducts(filtered);
      setTotalPages(res.pages);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStore, selectedTier, page]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="pb-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
            VERIFIED DEALS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Price Drops
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mt-1">
          Today's Best Offers
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 max-w-2xl">
          Discover verified deals, seasonal discounts, and price cuts across Sri Lanka's leading retail stores.
        </p>
      </div>

      {/* Filter Row: Discount Tiers & Stores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        {/* Discount Tiers */}
        <div className="flex items-center gap-2 flex-wrap">
          {DISCOUNT_TIERS.map((tier) => (
            <button
              key={tier.label}
              type="button"
              onClick={() => {
                setSelectedTier(tier.minDiscount);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                selectedTier === tier.minDiscount
                  ? 'bg-neutral-900 text-white'
                  : 'bg-slate-50 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Store Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STORES.map((store) => (
            <button
              key={store.value}
              type="button"
              onClick={() => {
                setSelectedStore(store.value);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                selectedStore === store.value
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {store.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
              <div className="aspect-square bg-slate-100 rounded-xl mb-3" />
              <div className="space-y-2 px-1">
                <div className="h-3 bg-slate-100 rounded w-2/3 mx-auto" />
                <div className="h-2.5 bg-slate-50 rounded w-4/5 mx-auto" />
                <div className="h-3 bg-slate-100 rounded w-1/3 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 rounded-xl p-8 max-w-md mx-auto">
          <Tag size={20} className="mx-auto text-neutral-400 mb-2" />
          <h2 className="text-base font-semibold text-neutral-900 mb-1">No offers found</h2>
          <p className="text-xs text-neutral-500">
            No discounted items matched your selected filters right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product, idx) => (
            <ProductCard key={product.insightz_product_id} product={product} index={idx} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3.5 py-1.5 rounded text-xs font-medium text-neutral-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-neutral-500 px-2 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3.5 py-1.5 rounded text-xs font-medium text-neutral-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Offers;
