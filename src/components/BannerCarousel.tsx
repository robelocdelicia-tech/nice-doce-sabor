"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PromoBanner } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Flame } from "lucide-react";

interface BannerCarouselProps {
  banners: PromoBanner[];
  onSelectSection?: (sectionId: string) => void;
}

export function BannerCarousel({ banners, onSelectSection }: BannerCarouselProps) {
  const activeBanners = banners.filter((b) => b.is_active);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  if (!activeBanners || activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleActionClick = () => {
    if (current.target_section_id && onSelectSection) {
      onSelectSection(current.target_section_id);
    } else if (current.target_section_id) {
      const el = document.getElementById(current.target_section_id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative max-w-4xl mx-auto w-full px-4 pt-2 pb-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-56 sm:h-64 md:h-72 rounded-3xl overflow-hidden shadow-xl border-2 border-pink-200/80 bg-neutral-900 group">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Foto de Fundo */}
            <Image
              src={current.image_url}
              alt={current.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />

            {/* Gradientes de Luxo para Legibilidade dos Anúncios */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

            {/* Conteúdo do Anúncio Promocional */}
            <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-7 max-w-lg text-white">
              {/* Tag Promocional */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-500 text-nice-wine shadow-md shadow-amber-500/20">
                  <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-900" />
                  {current.tag}
                </span>

                {current.badge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {current.badge}
                  </span>
                )}
              </div>

              {/* Título e Subtítulo */}
              <div className="space-y-1.5 my-auto">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {current.title}
                </h3>
                <p className="text-xs sm:text-sm text-pink-100/90 line-clamp-2 max-w-md font-medium leading-relaxed drop-shadow">
                  {current.subtitle}
                </p>
              </div>

              {/* Botão de Ação do Anúncio */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-gradient-to-r from-nice-pink to-pink-500 hover:from-pink-600 hover:to-nice-pink text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/30 active:scale-95 transition-all"
                >
                  <span>Ver Oferta no Cardápio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Setas de Navegação (Desktop) */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Anúncio anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Próximo anúncio"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicadores de Bolinhas (Dots) */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {activeBanners.map((banner, idx) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir para anúncio ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? "w-5 h-1.5 bg-amber-400"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
