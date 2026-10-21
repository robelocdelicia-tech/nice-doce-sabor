"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Sparkles } from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageSrc: string;
  title: string;
  onClose: () => void;
}

export function ImageLightboxModal({
  isOpen,
  imageSrc,
  title,
  onClose,
}: ImageLightboxModalProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageSrc]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-200"
      >
        {/* Botão Fechar no Topo */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:top-3 sm:right-3 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white shadow-lg backdrop-blur-sm transition"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Imagem Ampliada */}
        <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 flex items-center justify-center">
          {hasError ? (
            <div className="flex flex-col items-center justify-center text-center p-6 text-white space-y-2">
              <Sparkles className="w-10 h-10 text-nice-pink animate-pulse" />
              <p className="font-bold text-sm">Imagem temporariamente indisponível</p>
              <p className="text-xs text-gray-400">Nice Doce Sabor Confeitaria Artesanal</p>
            </div>
          ) : (
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-contain"
              priority
              onError={() => setHasError(true)}
            />
          )}
        </div>

        {/* Legenda */}
        <div className="mt-3 text-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-semibold max-w-md truncate">
          {title}
        </div>
      </div>
    </div>
  );
}
