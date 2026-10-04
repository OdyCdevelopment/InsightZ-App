import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Tag } from 'lucide-react';
import { ProductService } from '../../services/productService';

interface CuratedCategory {
  title: string;
  description: string;
  keyword: string;
  stores: string;
}

const FEATURED_CATEGORIES: CuratedCategory[] = [
  {
    title: 'Fashion & Clothing',
    description: "Men's, women's, and formal workwear collections from top boutiques and retail stores.",
    keyword: 'Fashion',
    stores: 'Hameedia, Thilakawardhana, Mimosa',
  },
  {
    title: 'Shoes & Footwear',
    description: 'Casual sneakers, formal leather shoes, sandals, and athletic trainers.',
    keyword: 'Shoes',
    stores: 'Daraz, Hameedia, Thilakawardhana',
  },
  {
    title: 'Electronics & Gadgets',
    description: 'Smart accessories, audio gear, cables, and home essentials with verified price comparisons.',
    keyword: 'Electronics',
    stores: 'Daraz, Department Stores',
  },
  {
    title: 'Beauty & Skincare',
    description: 'Personal care items, wellness cosmetics, fragrances, and daily grooming.',
    keyword: 'Beauty',
    stores: 'Daraz, Mimosa',
  },
  {
    title: 'Accessories & Watches',
    description: 'Leather wallets, belts, designer eyewear, wristwatches, and jewelry.',
    keyword: 'Accessories',
    stores: 'Hameedia, Mimosa, Daraz',
  },
  {
    title: 'Home & Living',
    description: 'Bed linen, home styling accents, and everyday household items.',
    keyword: 'Home',
    stores: 'Thilakawardhana, Daraz',
  },
  {
    title: 'Kids & Baby',
    description: 'Comfortable kids clothing, baby wear, and toys with live availability.',
    keyword: 'Kids',
    stores: 'Thilakawardhana, Mimosa',
  },
];

export const Categories: React.FC = () => {
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProductService.getCategories()
      .then((cats) => setDbCategories(Array.isArray(cats) ? cats.slice(0, 24) : []))
      .catch(() => setDbCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="pb-6">
        <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
          DEPARTMENTS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mt-1">
          Explore Categories
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 max-w-xl">
          Browse verified merchant feeds and price comparison collections by retail category.
        </p>
      </div>

      {/* Featured Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURED_CATEGORIES.map((cat) => (
          <Link
            key={cat.title}
            to={`/products?category=${encodeURIComponent(cat.keyword)}`}
            className="group block p-6 bg-white hover:bg-slate-50 rounded-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Department
              </span>
              <ArrowRight
                size={16}
                className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all"
              />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
              {cat.title}
            </h3>

            <p className="text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
              {cat.description}
            </p>

            <div className="mt-4 pt-4 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Stores: {cat.stores}</span>
              <span className="font-semibold text-neutral-900 group-hover:underline">
                Compare →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Dynamic Database Categories Tags */}
      {loading ? (
        <div className="pt-8 space-y-4 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-48" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-100 rounded-md w-20" />
            ))}
          </div>
        </div>
      ) : dbCategories.length > 0 ? (
        <div className="pt-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            More Store Categorizations
          </h2>
          <div className="flex flex-wrap gap-2">
            {dbCategories.map((c) => (
              <Link
                key={c}
                to={`/products?category=${encodeURIComponent(c)}`}
                className="px-3 py-1.5 bg-slate-50 hover:bg-neutral-900 hover:text-white rounded-md text-xs font-medium text-neutral-700 transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Categories;
