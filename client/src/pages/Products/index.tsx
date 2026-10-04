import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Heart, ShoppingBag, X,
  ChevronDown, ChevronUp, Check, ArrowUpDown
} from 'lucide-react';
import { ProductService } from '../../services/productService';
import type { Product, ProductFilters, SortOption } from '@insightz/shared';
import { SORT_OPTIONS } from '@insightz/shared';
import { ProductCard } from '../../components/cards/ProductCard';
import { formatPrice, capitalize } from '../../utils';

const DEFAULT_CATEGORIES = [
  'Clothing', 'Shoes', 'Bags', 'Accessories', 'Casual', 'Formal', 'Teen'
];

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [store, setStore] = useState(searchParams.get('store') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [offerOnly, setOfferOnly] = useState(searchParams.get('offer') !== 'false');
  const [minPrice, setMinPrice] = useState<number | undefined>(
    searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined
  );
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest'
  );
  const [page, setPage] = useState(Number(searchParams.get('page') || '1'));

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // UI States
  const [brandSearch, setBrandSearch] = useState('');
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Stores available in our scraper database
  const availableStores = [
    { id: 'all', name: 'All Stores' },
    { id: 'hameedia', name: 'Hameedia' },
    { id: 'thilakawardhana', name: 'Thilakawardhana' },
    { id: 'coolplanet', name: 'Cool Planet' },
    { id: 'daydream', name: 'Daydream' },
  ];

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProductService.getProducts({
        search: search || undefined,
        store: store !== 'all' ? store : undefined,
        category: category !== 'all' ? category : undefined,
        offer: offerOnly || undefined,
        min_price: minPrice,
        max_price: maxPrice,
        sort,
        page,
        limit: 20,
      });
      setProducts(Array.isArray(res?.products) ? res.products : []);
      setTotal(typeof res?.total === 'number' ? res.total : 0);
      setTotalPages(typeof res?.pages === 'number' ? res.pages : 1);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, store, category, offerOnly, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    ProductService.getCategories()
      .then(cats => setAllCategories(Array.isArray(cats) ? cats : []))
      .catch(() => setAllCategories([]));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync search param when external search triggers
  useEffect(() => {
    const q = searchParams.get('search');
    const off = searchParams.get('offer');
    if (q !== null && q !== search) setSearch(q);
    if (off !== null && (off === 'true') !== offerOnly) setOfferOnly(off === 'true');
  }, [searchParams]);

  const clearAllFilters = () => {
    setSearch('');
    setStore('all');
    setCategory('all');
    setOfferOnly(false);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSort('newest');
    setPage(1);
    setSearchParams({});
  };

  const filteredStores = useMemo(() => {
    if (!brandSearch) return availableStores;
    return availableStores.filter(s =>
      s.name.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [brandSearch]);

  const categoryList = (Array.isArray(allCategories) && allCategories.length > 0)
    ? allCategories.slice(0, 8)
    : DEFAULT_CATEGORIES;

  return (
    <div className="w-full pb-16">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Products Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Searching products...' : `${total.toLocaleString()} curated items found`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-sm font-medium text-slate-700"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-slate-400 hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setPage(1);
              }}
              className="bg-white rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Sidebar + Product Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-8 items-start">
        {/* ── Desktop Filter Sidebar ── */}
        <aside className="hidden lg:block lg:col-span-1 pr-3 space-y-6 pb-12">
          <div className="flex items-center justify-between pb-3">
            <span className="text-lg font-bold text-slate-900">Filters</span>
            {(store !== 'all' || category !== 'all' || offerOnly || minPrice || maxPrice || search) && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-black hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Category Pills Grid */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              {categoryList.map((cat) => {
                const active = category.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(active ? 'all' : cat);
                      setPage(1);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium text-center transition-all ${
                      active
                        ? 'bg-black text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands / Stores Collapsible Section */}
          <div className="pt-2">
            <button
              onClick={() => setBrandsOpen(!brandsOpen)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-900"
            >
              <span>Brands & Stores</span>
              {brandsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {brandsOpen && (
              <div className="mt-2 space-y-3">
                {/* Brand Search Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Brand"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Checkbox List */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 pt-1">
                  {filteredStores.map((s) => {
                    const checked = store === s.id;
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 hover:text-slate-900 font-medium select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setStore(checked ? 'all' : s.id);
                            setPage(1);
                          }}
                          className="w-4 h-4 rounded accent-black cursor-pointer"
                        />
                        <span>{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Price Filter Section */}
          <div className="pt-2">
            <button
              onClick={() => setPriceOpen(!priceOpen)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-900"
            >
              <span>Price (Rs.)</span>
              {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {priceOpen && (
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium block mb-1">From</label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice ?? ''}
                      onChange={(e) => {
                        setMinPrice(e.target.value ? Number(e.target.value) : undefined);
                        setPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium block mb-1">To</label>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice ?? ''}
                      onChange={(e) => {
                        setMaxPrice(e.target.value ? Number(e.target.value) : undefined);
                        setPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={offerOnly}
                      onChange={(e) => {
                        setOfferOnly(e.target.checked);
                        setPage(1);
                      }}
                      className="w-4 h-4 rounded accent-violet-600"
                    />
                    <span>Special Deals & Offers Only</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Product Grid Area ── */}
        <main className="lg:col-span-3 xl:col-span-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
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
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-slate-800 text-lg font-semibold">No matching products found</p>
              <p className="text-slate-400 text-sm mt-1">Try resetting or broadening your filters.</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div>
              {/* 4-Column Luxury Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {products.map((product, i) => (
                  <ProductCard
                    key={product.insightz_product_id}
                    product={product}
                    index={i}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => {
                    const p = i + Math.max(1, page - 2);
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                          p === page
                            ? 'bg-black text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex justify-end lg:hidden backdrop-blur-xs"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-80 max-w-full h-full bg-white p-6 overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-3">
                <span className="text-lg font-bold text-slate-900">Filters</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Categories */}
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                  Category
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {categoryList.map((cat) => {
                    const active = category.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategory(active ? 'all' : cat);
                          setPage(1);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all ${
                          active
                            ? 'bg-black text-white'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stores */}
              <div className="pt-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                  Store
                </span>
                <div className="space-y-2">
                  {availableStores.map((s) => (
                    <label key={s.id} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={store === s.id}
                        onChange={() => {
                          setStore(store === s.id ? 'all' : s.id);
                          setPage(1);
                        }}
                        className="w-4 h-4 rounded accent-black"
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-2">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsPage;
