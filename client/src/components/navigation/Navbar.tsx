import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, X, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '../../store/wishlistStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const wishlistItems = useWishlistStore((state) => state.items);
  const openDrawer = useWishlistStore((state) => state.openDrawer);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      navigate(`/products?search=${encodeURIComponent(term)}`);
    } else {
      navigate('/products');
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Near Me', href: '/near-me' },
    { name: 'Offers', href: '/products?offer=true' },
  ];

  const isLinkActive = (link: { name: string; href: string }) => {
    const isOffers = location.search.includes('offer=true');

    if (link.name === 'Offers') return isOffers;
    if (link.name === 'Near Me') return location.pathname === '/near-me';
    if (link.name === 'Home') return location.pathname === '/';
    return location.pathname === link.href;
  };

  return (
    <motion.header
      initial={{ y: -15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-white text-gray-900 px-6 lg:px-12 py-4 transition-all"
    >
      <div className="flex items-center justify-between gap-4 sm:gap-8">
        {/* Left: Brand Icon & Title */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Logo"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 3.25L4.5 19.5H8.2L12 11.2L15.8 19.5H19.5L12 3.25ZM12 7.75L13.8 12.25H10.2L12 7.75Z"
              />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
            InsightZ
          </span>
        </Link>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-10">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium transition-colors ${active
                    ? 'text-black font-semibold'
                    : 'text-gray-500 hover:text-black'
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search Input, Wishlist, User & Get Started Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:flex items-center">
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 md:w-72 lg:w-96 h-10 sm:h-11 pl-11 pr-5 rounded-full bg-neutral-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-neutral-200/60 transition-all"
            />
          </form>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={openDrawer}
            className="relative w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-slate-800 hover:text-black transition-colors"
            title="Wishlist"
          >
            <Heart size={18} />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
          </button>

          {/* User / Profile Button */}
          <button
            type="button"
            className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-slate-800 hover:text-black transition-colors"
            title="User Account"
          >
            <User size={18} />
          </button>



          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden pt-3 mt-3"
          >
            <div className="flex flex-col gap-2 py-1">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center mb-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </form>
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                        ? 'text-black font-semibold bg-gray-50'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openDrawer();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 w-full text-left"
              >
                <span className="flex items-center gap-2">
                  <Heart size={16} /> Wishlist
                </span>
                {wishlistItems.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
