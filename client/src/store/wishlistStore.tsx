import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';
import type { Product } from '@insightz/shared';

interface WishlistState {
  items: Product[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleWishlist: (product: Product) => void;
  removeItem: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      toggleWishlist: (product: Product) => {
        const { items } = get();
        const exists = items.some((item) => item.insightz_product_id === product.insightz_product_id);

        if (exists) {
          set({ items: items.filter((item) => item.insightz_product_id !== product.insightz_product_id) });
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              } max-w-sm w-full bg-white rounded-2xl p-3.5 flex items-center gap-3.5 transition-all duration-300 shadow-xl`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">Removed from Wishlist</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{product.title}</p>
              </div>
            </div>
          ), { duration: 2500, id: `wishlist-${product.insightz_product_id}` });
        } else {
          set({ items: [product, ...items] });
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              } max-w-sm w-full bg-white rounded-2xl p-3.5 flex items-center gap-3.5 transition-all duration-300 shadow-xl`}
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">Added to Wishlist</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{product.title}</p>
              </div>
            </div>
          ), { duration: 2500, id: `wishlist-${product.insightz_product_id}` });
        }
      },

      removeItem: (id: number) => {
        set({ items: get().items.filter((item) => item.insightz_product_id !== id) });
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            } max-w-sm w-full bg-white rounded-2xl p-3.5 flex items-center gap-3 transition-all duration-300 shadow-xl`}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-900">Item removed from wishlist</p>
          </div>
        ), { duration: 2000, id: `remove-${id}` });
      },

      isInWishlist: (id: number) => {
        return get().items.some((item) => item.insightz_product_id === id);
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'insightz-wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
