import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BannerSlide {
  id: number;
  image: string;
  title: string;
  link: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: 1,
    image: '/banners/hero-banner-1.jpg',
    title: 'Summer Sale • Up to 50% OFF',
    link: '/offers',
  },
  {
    id: 2,
    image: '/banners/hero-banner-2.jpg',
    title: 'New Arrivals • Urban Chic Collection',
    link: '/products?category=Fashion',
  },
  {
    id: 3,
    image: '/banners/hero-banner-3.jpg',
    title: 'Menswear & Tailored Fashion • Verified Stores',
    link: '/products',
  },
  {
    id: 4,
    image: '/banners/hero-banner-4.jpg',
    title: 'Radiance Skincare & Beauty Deals',
    link: '/products?category=Beauty',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1.02,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 240, damping: 28 },
      opacity: { duration: 0.45 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: 'spring', stiffness: 240, damping: 28 },
      opacity: { duration: 0.4 },
    },
  }),
};

export const HeroSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance slide every 3 seconds (3000ms)
  useEffect(() => {
    if (isHovered) return;

    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const handleDragEnd = (_: any, { offset, velocity }: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = offset.x;
    if (swipe < -50 || velocity.x < -400) {
      goToNext();
    } else if (swipe > 50 || velocity.x > 400) {
      goToPrev();
    }
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <div
      className="relative w-full h-[260px] sm:h-[360px] md:h-[460px] lg:h-[520px] xl:h-[580px] 2xl:h-[640px] overflow-hidden bg-neutral-950 select-none group m-0 p-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3-Second Glowing Progress Bar on Top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/30 z-30 overflow-hidden">
        <motion.div
          key={`progress-${currentIndex}-${isHovered}`}
          initial={{ width: '0%' }}
          animate={{ width: isHovered ? '0%' : '100%' }}
          transition={{ duration: 3, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-neutral-200 via-white to-neutral-200 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
        />
      </div>

      {/* Slide Image with Ken Burns Zoom & Spring Motion */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentSlide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        >
          <Link to={currentSlide.link} className="block w-full h-full relative overflow-hidden">
            <motion.img
              src={currentSlide.image}
              alt={currentSlide.title}
              initial={{ scale: 1.06 }}
              animate={{ scale: 1.0 }}
              transition={{ duration: 3.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-cover object-center pointer-events-none"
              loading="eager"
            />
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Floating Glassmorphic Arrow Controls */}
      <div className="absolute inset-x-4 sm:inset-x-8 top-1/2 -translate-y-1/2 z-30 flex items-center justify-between pointer-events-none">
        <motion.button
          whileHover={{ scale: 1.12, backgroundColor: 'rgba(255, 255, 255, 1)' }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            goToPrev();
          }}
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/85 text-neutral-900 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-200 opacity-70 group-hover:opacity-100 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} className="stroke-[2.5]" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.12, backgroundColor: 'rgba(255, 255, 255, 1)' }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            goToNext();
          }}
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/85 text-neutral-900 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-200 opacity-70 group-hover:opacity-100 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          aria-label="Next slide"
        >
          <ChevronRight size={22} className="stroke-[2.5]" />
        </motion.button>
      </div>

      {/* Slide Indicators & Counter Pill at Bottom */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className="group/dot relative p-1 focus:outline-none"
            aria-label={`Go to slide ${idx + 1}`}
          >
            <motion.div
              animate={{
                width: currentIndex === idx ? 32 : 8,
                backgroundColor: currentIndex === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="h-2 rounded-full shadow-sm"
            />
          </button>
        ))}

        <div className="w-[1px] h-3 bg-white/30 ml-1" />

        <span className="text-[11px] font-mono font-semibold text-white/90 pl-1 tracking-wider">
          {String(currentIndex + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default HeroSlider;
