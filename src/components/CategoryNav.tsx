"use client";

import React from "react";
import { Category } from "@/types";
import { Search, Cake, Candy, PieChart, IceCream, Cookie, PartyPopper, GlassWater } from "lucide-react";

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string, slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: CategoryNavProps) {
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "doces":
        return <Candy className="w-3.5 h-3.5" />;
      case "bolo-no-pote":
        return <Cake className="w-3.5 h-3.5" />;
      case "fatias":
        return <PieChart className="w-3.5 h-3.5" />;
      case "cones-trufados":
        return <IceCream className="w-3.5 h-3.5" />;
      case "salgados":
        return <Cookie className="w-3.5 h-3.5" />;
      case "kits-festa":
        return <PartyPopper className="w-3.5 h-3.5" />;
      case "bebidas":
        return <GlassWater className="w-3.5 h-3.5" />;
      default:
        return <Cake className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-[#FFF5FA]/95 backdrop-blur-md border-b border-pink-100 py-2.5 px-4 shadow-sm">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Barra de Pesquisa Rápida */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nice-pink" />
          <input
            type="text"
            placeholder="Buscar por nome ou sabor (ex.: ninho, nutella, queijo, empada)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs sm:text-sm border border-pink-200 text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40 shadow-sm transition"
          />
        </div>

        {/* Abas de Categorias Fixas no Topo (Ordem: Doces, Bolo no pote, Fatias, Cones trufados, Salgados) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {categories.map((cat) => {
            const isSelected = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id, cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? "bg-nice-pink text-white shadow-md scale-105"
                    : "bg-white text-nice-wine/80 border border-pink-100 hover:border-pink-300 hover:bg-pink-50/50"
                }`}
              >
                {getCategoryIcon(cat.slug)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
