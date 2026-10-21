"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";

export function FloatingCartButton() {
  const { itemCount, subtotal, setIsCartOpen } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-6 duration-300">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full py-3.5 px-5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white shadow-luxury-lg flex items-center justify-between transition-all transform active:scale-98 border-2 border-white/40"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 bg-white text-nice-pink text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {itemCount}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            Ver Pedido
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-extrabold">
            {formatCurrency(subtotal)}
          </span>
          <div className="p-1 rounded-full bg-white/20">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </button>
    </div>
  );
}
