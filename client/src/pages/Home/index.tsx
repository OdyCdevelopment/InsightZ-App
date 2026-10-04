import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProductCard } from '../../components/cards/ProductCard';
import { ProductService } from '../../services/productService';
import type { Product } from '@insightz/shared';
import { LuxuryHero } from '../../components/home/LuxuryHero';
import { CategoryShowcase } from '../../components/home/CategoryShowcase';

const ProductSection = ({ title, fetchConfig, viewAllLink }: { title: string, fetchConfig: any, viewAllLink: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    ProductService.getProducts({ ...fetchConfig, limit: 4 })
      .then(res => setProducts(Array.isArray(res?.products) ? res.products.slice(0, 4) : []))
      .catch(() => { setProducts([]); })
      .finally(() => setLoading(false));
  }, [fetchConfig]);

  return (
    <div className="py-12 border-t border-slate-100 first:border-t-0">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] bg-slate-100 rounded-sm mb-3" />
              <div className="h-3 bg-slate-100 w-3/4 mb-2 rounded" />
              <div className="h-4 bg-slate-100 w-1/4 rounded" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p, i) => <ProductCard key={p.insightz_product_id} product={p} index={i} />)}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No products found.</div>
      )}

      {products.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate(viewAllLink)}
            className="px-8 py-3 bg-black hover:bg-slate-800 text-white text-[11px] font-bold tracking-widest uppercase rounded-full transition-colors flex items-center gap-2 cursor-pointer"
          >
            VIEW ALL <span className="text-[10px]">•</span>
          </button>
        </div>
      )}
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <LuxuryHero
        onShopNow={() => navigate('/products')}
        onExploreOffers={() => navigate('/products?offer=true')}
      />

      <div className="mt-4">
        {/* Category Showcase Section */}
        <CategoryShowcase />

        {/* Curated Product Carousels */}
        <ProductSection
          title="Top Offers & Discounts"
          fetchConfig={{ offer: true, sort: 'discount_desc' }}
          viewAllLink="/products?offer=true"
        />
        <ProductSection
          title="New In • Women Offers"
          fetchConfig={{ offer: true, search: 'women', sort: 'newest' }}
          viewAllLink="/products?search=women&offer=true"
        />
        <ProductSection
          title="New In • Men Offers"
          fetchConfig={{ offer: true, search: 'men', sort: 'newest' }}
          viewAllLink="/products?search=men&offer=true"
        />
      </div>
    </div>
  );
};

export default Home;
