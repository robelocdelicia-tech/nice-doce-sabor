"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Store } from "@/types";
import { checkStoreStatus } from "@/lib/utils";
import { Clock, MessageCircle, Heart, Sparkles, MapPin, Moon, Sun, X, Calendar } from "lucide-react";

interface HeaderProps {
  store: Store;
  onOpenStory: () => void;
}

export function Header({ store, onOpenStory }: HeaderProps) {
  const status = checkStoreStatus(store);
  const [isDarkLuxury, setIsDarkLuxury] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoSrc, setLogoSrc] = useState(store.logo_url || "/logo.jpg");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const DAYS_ORDER: { key: string; name: string; dayIndex: number }[] = [
    { key: "monday", name: "Segunda-feira", dayIndex: 1 },
    { key: "tuesday", name: "Terça-feira", dayIndex: 2 },
    { key: "wednesday", name: "Quarta-feira", dayIndex: 3 },
    { key: "thursday", name: "Quinta-feira", dayIndex: 4 },
    { key: "friday", name: "Sexta-feira", dayIndex: 5 },
    { key: "saturday", name: "Sábado", dayIndex: 6 },
    { key: "sunday", name: "Domingo", dayIndex: 0 },
  ];
  const currentDayIndex = new Date().getDay();

  useEffect(() => {
    setLogoSrc(store.logo_url || "/logo.jpg");
    setLogoError(false);
  }, [store.logo_url]);

  const handleLogoError = () => {
    if (logoSrc !== "/logo.jpg") {
      setLogoSrc("/logo.jpg");
    } else {
      setLogoError(true);
    }
  };

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
            <div className="w-full h-full rounded-full border-2 border-dashed border-nice-pink flex items-center justify-center overflow-hidden relative bg-pink-50">
              {logoError ? (
                <div className="w-full h-full bg-gradient-to-tr from-[#5B1F3A] via-[#E0489A] to-[#FDB362] flex flex-col items-center justify-center text-white select-none shadow-inner p-2">
                  <span className="font-script text-3xl sm:text-4xl font-bold tracking-wider drop-shadow-md">
                    NDS
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold opacity-95">
                    Nice Doce Sabor
                  </span>
                </div>
              ) : (
                <Image
                  src={logoSrc}
                  alt={store.name}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full rounded-full transition-transform duration-300 group-hover:scale-105"
                  priority
                  onError={handleLogoError}
                />
              )}
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

        {/* Badge de Horário em Tempo Real (Interativo com Modal de Grade Semanal) */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${
              status.isOpen
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
            title="Toque para ver a grade de horários da semana"
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
          </button>

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

      {/* Modal de Horários de Atendimento da Confeitaria */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border-2 border-pink-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-pink-100 text-nice-pink flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-nice-wine text-base">
                    Horários de Atendimento
                  </h3>
                  <p className="text-xs text-gray-500">
                    {store.name} • {store.owner_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-nice-wine rounded-full hover:bg-pink-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Atual */}
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                status.isOpen
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span>{status.statusLabel}</span>
              <span className="text-gray-400">•</span>
              <span className="font-normal">{status.detailMessage}</span>
            </div>

            {/* Tabela dos 7 Dias da Semana */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-nice-wine block mb-1 text-left">
                Grade Semanal de Funcionamento:
              </span>

              {DAYS_ORDER.map(({ key, name, dayIndex }) => {
                const daySchedule = store.schedule_config?.[key] || {
                  open: "12:00",
                  close: "19:00",
                  closed: false,
                };
                const isToday = currentDayIndex === dayIndex;
                const isClosed = Boolean(daySchedule.closed);

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                      isToday
                        ? "bg-pink-100/60 border border-nice-pink font-bold text-nice-wine shadow-sm"
                        : "bg-pink-50/30 border border-pink-100/60 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {name} {isToday && <span className="text-[10px] text-nice-pink font-extrabold">(Hoje)</span>}
                      </span>
                    </div>

                    <div>
                      {isClosed ? (
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Fechado
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold text-nice-wine">
                          {daySchedule.open} às {daySchedule.close}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Retirada e Local */}
            <div className="pt-2 border-t border-pink-100 text-left text-xs text-gray-600 space-y-1">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-nice-pink mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Retirada no local:</strong> {store.pickup_address} ({store.city})
                </span>
              </div>
            </div>

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-nice-pink text-white font-bold text-xs shadow-md shadow-pink-500/20 hover:bg-nice-pink-hover transition active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
