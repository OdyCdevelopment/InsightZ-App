import React from 'react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { WishlistDrawer } from '../components/wishlist/WishlistDrawer';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />
      <div className="flex-1 w-full min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-8"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
      <Footer />
      <WishlistDrawer />
    </div>
  );
};

export default MainLayout;
