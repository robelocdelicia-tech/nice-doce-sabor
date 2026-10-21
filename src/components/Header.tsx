"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Store } from "@/types";
import { checkStoreStatus } from "@/lib/utils";
import { Clock, MessageCircle, Heart, Sparkles, MapPin, Moon, Sun } from "lucide-react";

interface HeaderProps {
  store: Store;
  onOpenStory: () => void;
}

export function Header({ store, onOpenStory }: HeaderProps) {
  const status = checkStoreStatus(store);
  const [isDarkLuxury, setIsDarkLuxury] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("nice_theme");
      if (savedTheme === "dark") {
        setIsDarkLuxury(true);
        document.documentElement.classList.add("dark-luxury");
      }
    } catch (e) {}
  }, []);

  const handleToggleTheme = () => {
    const next = !isDarkLuxury;
    setIsDarkLuxury(next);
    if (next) {
      document.documentElement.classList.add("dark-luxury");
      localStorage.setItem("nice_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-luxury");
      localStorage.setItem("nice_theme", "light");
    }
  };

  return (
    <header className="relative w-full bg-gradient-to-b from-[#FFF0F7] via-[#FFF8FC] to-[#FFF5FA] pt-6 pb-4 px-4 border-b border-pink-100">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-2 left-6 text-pink-300 opacity-40 animate-float pointer-events-none">
        <Heart className="w-5 h-5 fill-current" />
      </div>
      <div className="absolute top-6 right-8 text-nice-gold opacity-40 animate-pulseGlow pointer-events-none">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Logo Oficial com anel duplo pontilhado */}
        <div className="relative mb-3 group cursor-pointer" onClick={onOpenStory}>
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-white shadow-luxury relative flex items-center justify-center">
            {/* Anel com borda pontilhada característica da marca */}
            <div className="w-full h-full rounded-full border-2 border-dashed border-nice-pink flex items-center justify-center overflow-hidden relative">
              <Image
                src={store.logo_url || "/logo.jpg"}
                alt={store.name}
                width={128}
                height={128}
                className="object-cover w-full h-full rounded-full transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            {/* Ícone de coração no canto da logo */}
            <div className="absolute bottom-1 right-1 bg-nice-pink text-white p-1.5 rounded-full shadow-md">
              <Heart className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Nome e Tipografia de Luxo */}
        <h1 className="font-script text-4xl sm:text-5xl text-nice-pink leading-tight drop-shadow-sm">
          {store.name}
        </h1>
        <p className="text-nice-wine font-medium text-xs sm:text-sm tracking-wide uppercase mt-1">
          Confeitaria Artesanal por {store.owner_name}
        </p>
        <p className="flex items-center justify-center gap-1 text-nice-wine/70 text-xs mt-0.5">
          <MapPin className="w-3 h-3 text-nice-pink" />
          {store.city} • Quarta a Segunda das 12h às 19h (Terça Fechado)
        </p>

        {/* Badge de Horário em Tempo Real */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
              status.isOpen
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <Clock className="w-3 h-3" />
            <span>{status.statusLabel}</span>
            <span className="text-gray-400">•</span>
            <span className="font-normal">{status.detailMessage}</span>
          </div>

          <button
            onClick={onOpenStory}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-nice-pink-light text-nice-wine border border-pink-200 hover:bg-nice-pink-soft transition"
          >
            <Sparkles className="w-3 h-3 text-nice-gold" />
            <span>Nossa História</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTheme}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              isDarkLuxury
                ? "bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm"
                : "bg-white text-nice-wine border border-pink-200 hover:bg-pink-50"
            }`}
            title={isDarkLuxury ? "Mudar para Modo Claro" : "Ativar Modo Escuro Luxo (Vinho & Dourado)"}
          >
            {isDarkLuxury ? (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-nice-pink" />
                <span>Modo Luxo ✨</span>
              </>
            )}
          </button>
        </div>

        {/* Botão de Contato Rápido WhatsApp */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <a
            href={`https://wa.me/${store.phone_whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition transform active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Chamar no WhatsApp</span>
          </a>

          <a
            href={`https://instagram.com/${store.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white text-xs sm:text-sm font-semibold shadow-sm hover:opacity-90 transition transform active:scale-95"
          >
            <span>{store.instagram}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
