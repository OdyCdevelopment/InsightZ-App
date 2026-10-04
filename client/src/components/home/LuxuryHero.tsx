import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Tag, ShieldCheck } from 'lucide-react';

interface LuxuryHeroProps {
  onShopNow?: () => void;
  onExploreOffers?: () => void;
}

export const LuxuryHero: React.FC<LuxuryHeroProps> = ({
  onShopNow,
  onExploreOffers,
}) => {
  const handleShopNowClick = () => {
    if (onShopNow) {
      onShopNow();
    } else {
      const el = document.getElementById('catalog-search') || document.getElementById('stores');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full overflow-hidden bg-[#0d0d12]"
    >
      {/* Background Image with Responsive Focal Point */}
      <div className="absolute inset-0 z-0">
        <img
          src="/luxury_hero_banner.jpg"
          alt="Luxury Fashion Hero Campaign"
          className="w-full h-full object-cover object-[70%_center] sm:object-right md:object-center transform scale-105 transition-transform duration-1000 ease-out hover:scale-100"
        />
        {/* Cinematic Multi-Stop Gradient Overlays for Crystal Clear Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent sm:via-black/60 sm:to-black/10 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-10 sm:hidden" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#dfba73]/10 rounded-full blur-3xl pointer-events-none z-10" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 px-6 sm:px-12 md:px-16 py-12 sm:py-16 md:py-20 lg:py-24 max-w-2xl lg:max-w-3xl flex flex-col justify-center">
        {/* Brand Kicker / Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-2 mb-3 sm:mb-4"
        >
          <span className="text-[#dfba73] tracking-[0.28em] text-xs sm:text-sm font-semibold uppercase flex items-center gap-2">
            LUXURY WITHIN REACH
          </span>
          <span className="inline-block w-8 h-[1px] bg-[#dfba73]/60" />
          <Sparkles className="w-3.5 h-3.5 text-[#dfba73]" />
        </motion.div>

        {/* Huge Luxury Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-4 sm:mb-6"
        >
          <div className="text-[#dfba73]/90 text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-1">
            UP TO
          </div>
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-bold tracking-tight bg-gradient-to-br from-[#fff3cf] via-[#dfba73] to-[#986c22] bg-clip-text text-transparent drop-shadow-md">
              60%
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-serif tracking-[0.18em] text-[#dfba73] uppercase font-light">
              OFF
            </span>
          </div>
        </motion.div>

        {/* Editorial Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-slate-300 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-xl mb-6 sm:mb-8 drop-shadow"
        >
          Curated premium collections, designer wear & seasonal discounts synchronized across top stores in real time.
        </motion.p>

        {/* Buttons matching Luxury Editorial Look */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center gap-3 sm:gap-4 flex-wrap"
        >
          <button
            onClick={handleShopNowClick}
            className="group border border-[#dfba73] bg-black/40 hover:bg-[#dfba73] text-[#dfba73] hover:text-black font-semibold text-xs sm:text-sm tracking-[0.22em] uppercase px-8 py-3.5 transition-all duration-300 active:scale-95 flex items-center gap-2.5 backdrop-blur-sm"
          >
            <span>SHOP NOW</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {onExploreOffers && (
            <button
              onClick={onExploreOffers}
              className="bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm tracking-[0.15em] uppercase px-6 py-3.5 backdrop-blur-md border border-white/15 transition-all active:scale-95 flex items-center gap-2"
            >
              <Tag className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>VIEW OFFERS</span>
            </button>
          )}
        </motion.div>

        {/* Highlight Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-4 sm:gap-6 mt-8 sm:mt-10 pt-6 border-t border-white/10 text-xs text-slate-400 flex-wrap"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#dfba73]" />
            <span>16,000+ Products Compared</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dfba73]" />
            <span>100+ Trusted Stores</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Prices Updated Live</span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
