import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Check } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 4000);
  };

  return (
    <footer className="w-full bg-white text-neutral-900 pt-16 pb-12 mt-16 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
          {/* Column 1: Shop By Category */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            <h4 className="text-sm font-bold text-black tracking-tight mb-4">
              Shop By Category
            </h4>
            <ul className="space-y-3 text-xs font-medium text-neutral-700 uppercase tracking-wide">
              <li>
                <Link to="/products?sort=newest" className="hover:text-black transition-colors block">
                  NEW IN
                </Link>
              </li>
              <li>
                <Link to="/products?search=women" className="hover:text-black transition-colors block">
                  WOMEN
                </Link>
              </li>
              <li>
                <Link to="/products?search=men" className="hover:text-black transition-colors block">
                  MEN
                </Link>
              </li>
              <li>
                <Link to="/products?search=kids" className="hover:text-black transition-colors block">
                  KIDS
                </Link>
              </li>
              <li>
                <Link to="/products?search=accessories" className="hover:text-black transition-colors block">
                  ACCESSORIES
                </Link>
              </li>
              <li>
                <Link to="/products?search=jewellery" className="hover:text-black transition-colors block">
                  JEWELLERY
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-black transition-colors block">
                  SALE
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-black transition-colors block">
                  GIFT VOUCHERS
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Information */}
          <div className="md:col-span-4 lg:col-span-4 space-y-4">
            <h4 className="text-sm font-bold text-black tracking-tight mb-4">
              Information
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-700">
              <li>
                <Link to="/products" className="hover:text-black transition-colors block">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-black transition-colors block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-black transition-colors block">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-black transition-colors block">
                  Returns & Exchanges Policy
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-black transition-colors block">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter */}
          <div className="md:col-span-4 lg:col-span-5 space-y-4">
            <h4 className="text-xs sm:text-sm font-bold text-black uppercase tracking-wider mb-2">
              JOIN OUR NEWSLETTER
            </h4>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Be the first to discover new collections & exclusive offers
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 bg-neutral-100 rounded-full px-5 py-3 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-neutral-200/60 transition-colors"
                required
              />
              <button
                type="submit"
                className="px-7 py-3 bg-black hover:bg-neutral-800 text-white font-bold uppercase text-[11px] tracking-widest rounded-full transition-colors shrink-0 flex items-center justify-center gap-1.5"
              >
                <span>SUBSCRIBE</span>
                <span className="text-[10px]">•</span>
              </button>
            </form>

            {submitted && (
              <p className="text-xs text-emerald-600 flex items-center gap-1.5 pt-1">
                <Check size={14} />
                Thank you for subscribing!
              </p>
            )}

            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full border border-neutral-300 hover:border-black text-neutral-800 flex items-center justify-center transition-colors hover:scale-105"
              >
                <Facebook size={14} />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full border border-neutral-300 hover:border-black text-neutral-800 flex items-center justify-center transition-colors hover:scale-105"
              >
                <Instagram size={14} />
              </a>

              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-8 h-8 rounded-full border border-neutral-300 hover:border-black text-neutral-800 flex items-center justify-center transition-colors hover:scale-105"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  viewBox="0 0 24 24"
                  aria-label="TikTok"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.88-4.47V8.84a8.28 8.28 0 0 0 4.89 1.59V7c-.34 0-.68-.11-1-.31z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
