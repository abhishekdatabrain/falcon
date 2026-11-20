'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop';

/**
 * Extracts all unique image URLs from a product object (including gallery and variants)
 */
export const extractProductImages = (product) => {
  if (!product) return [];
  const list = [];
  const seen = new Set();

  const add = (raw) => {
    if (!raw) return;
    const url = typeof raw === 'string' ? raw : (raw.image_url || raw.url || raw.src);
    if (url && typeof url === 'string') {
      const clean = url.trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        list.push(clean);
      }
    }
  };

  // 1. Primary images
  if (product.image) add(product.image);
  if (product.image_url) add(product.image_url);
  if (product.img) add(product.img);

  // 2. Product gallery images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach(add);
  }

  // 3. Variant images
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    product.variants.forEach((v) => {
      if (v.image_url) add(v.image_url);
      if (Array.isArray(v.images)) {
        v.images.forEach(add);
      }
    });
  }

  return list;
};

/**
 * Reusable Product Image Carousel with hover-triggered automatic sliding (every 1.5–2s),
 * instant reset to image 0 on mouse leave, mobile touch swipe, smooth transitions,
 * navigation arrows, pagination dots, and reduced-motion accessibility.
 */
export default function ProductImageCarousel({
  product,
  images: customImages,
  alt = '',
  className = '',
  imageClassName = '',
  isOutOfStock = false,
  aspectRatio = 'aspect-[4/3]',
  interval = 1800, // 1.5 - 2.0s per slide
  isCardHovered = undefined, // Optional external hover control
  children,
}) {
  const { locale } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [internalHover, setInternalHover] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // References
  const containerRef = useRef(null);
  const autoplayTimerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Effective hover state: respects external prop if supplied, else uses internal state
  const isHovered = isCardHovered !== undefined ? Boolean(isCardHovered) : internalHover;

  // Resolve image list using useMemo to avoid re-extraction on every render
  const images = useMemo(() => {
    if (Array.isArray(customImages) && customImages.length > 0) {
      return customImages;
    }
    const extracted = extractProductImages(product);
    return extracted.length > 0 ? extracted : [DEFAULT_FALLBACK_IMAGE];
  }, [customImages, product]);

  const hasMultipleImages = images.length > 1;

  const resolveUrl = useCallback((raw) => {
    if (!raw) return DEFAULT_FALLBACK_IMAGE;
    if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:'))) {
      return raw;
    }
    return getImageUrl(raw) || DEFAULT_FALLBACK_IMAGE;
  }, []);

  // Listen to prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else if (mql.addListener) {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  // Bind hover listener to parent product card element (e.g. .group container)
  useEffect(() => {
    // If externally controlled, parent manages hover state
    if (isCardHovered !== undefined) return;

    const currentEl = containerRef.current;
    if (!currentEl) return;

    // Find the enclosing product card container (standard .group or parent element)
    const cardEl = currentEl.closest('.group, [class*="group"], [data-card="true"]') || currentEl;

    const handleMouseEnter = () => {
      setInternalHover(true);
    };

    const handleMouseLeave = () => {
      setInternalHover(false);
      // Immediately stop autoplay & reset to the first image without reverse animation
      setIsResetting(true);
      setCurrentIndex(0);
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      setTimeout(() => {
        setIsResetting(false);
      }, 60);
    };

    cardEl.addEventListener('mouseenter', handleMouseEnter);
    cardEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cardEl.removeEventListener('mouseenter', handleMouseEnter);
      cardEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isCardHovered]);

  // Handle external hover changes (when isCardHovered prop changes from true to false)
  useEffect(() => {
    if (isCardHovered === false) {
      setIsResetting(true);
      setCurrentIndex(0);
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      const t = setTimeout(() => {
        setIsResetting(false);
      }, 60);
      return () => clearTimeout(t);
    }
  }, [isCardHovered]);

  // Navigation handlers with infinite looping
  const goToNext = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((idx, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex(idx);
  }, []);

  // Autoplay Effect:
  // - Default state (no hover): does NOT autoplay, keeps static first image.
  // - On hover: starts sliding every 1.5–2s (default 1800ms) with infinite looping.
  // - On mouse leave: immediately stopped & cleared.
  useEffect(() => {
    // If not hovered, multiple images not available, or reduced motion preferred: do not autoplay
    if (!hasMultipleImages || !isHovered || prefersReducedMotion) {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      return;
    }

    // Set interval for hover sliding
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [hasMultipleImages, isHovered, images.length, interval, prefersReducedMotion]);

  // Preload secondary images when hover starts to avoid slide lag or network flash
  useEffect(() => {
    if (isHovered && hasMultipleImages && typeof window !== 'undefined') {
      images.slice(1).forEach((src) => {
        const fullUrl = resolveUrl(src);
        if (fullUrl && fullUrl !== DEFAULT_FALLBACK_IMAGE) {
          const img = new window.Image();
          img.src = fullUrl;
        }
      });
    }
  }, [isHovered, hasMultipleImages, images, resolveUrl]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 35) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const displayAlt = alt || (locale === 'ar' ? product?.name_ar || product?.name_en : product?.name_en || product?.name_ar) || 'Product image';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden flex items-center justify-center select-none group/carousel bg-[#F8F9FA] ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl pointer-events-none">
          <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {locale === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
          </span>
        </div>
      )}

      {/* Slider Track Container (enforce LTR for identical transform physics across locales) */}
      <div className="w-full h-full overflow-hidden relative" dir="ltr">
        <div
          className="flex h-full w-full will-change-transform motion-reduce:transition-none"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isResetting || prefersReducedMotion ? 'none' : 'transform 500ms ease-out',
          }}
        >
          {images.map((imgSrc, idx) => (
            <div
              key={`${idx}-${imgSrc}`}
              className="w-full h-full shrink-0 flex items-center justify-center p-2 relative"
            >
              <img
                src={resolveUrl(imgSrc)}
                alt={`${displayAlt} - ${idx + 1}`}
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`w-full h-full object-contain pointer-events-none ${
                  isOutOfStock ? 'opacity-50 grayscale' : ''
                } ${imageClassName}`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Left Navigation Arrow (shown on hover or touch when multiple images exist) */}
      {hasMultipleImages && (
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous image"
          className="absolute left-1 sm:left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 active:scale-90"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Right Navigation Arrow (shown on hover or touch when multiple images exist) */}
      {hasMultipleImages && (
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next image"
          className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 active:scale-90"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Bottom Pagination Dots (visible on hover, or subtle on mobile) */}
      {hasMultipleImages && (
        <div
          className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs transition-opacity duration-200 pointer-events-auto ${
            isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0 max-sm:opacity-80'
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {images.map((_, dotIdx) => {
            const isActive = dotIdx === currentIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => goToSlide(dotIdx, e)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-3.5 h-1.5 bg-white shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/90'
                }`}
              />
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}
