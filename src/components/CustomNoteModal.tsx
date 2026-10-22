"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, ProductVariation } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { X, Check, Plus, Minus } from "lucide-react";

interface CustomNoteModalProps {
  product: Product | null;
  variation?: ProductVariation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomNoteModal({
  product,
  variation,
  isOpen,
  onClose,
}: CustomNoteModalProps) {
  const { addItem } = useCart();
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setQuantity(1);
    }
  }, [isOpen, product, variation]);

  if (!isOpen || !product) return null;

  const itemPrice = variation ? variation.price : product.base_price;
  const totalPrice = itemPrice * quantity;
  const displayName = variation ? `${product.name} — ${variation.name}` : product.name;

  const handleSave = () => {
    addItem(product, quantity, variation, [], note, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 border border-pink-100 animate-in slide-in-from-bottom duration-300">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2 border-b border-pink-50 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-nice-pink block">
              Observação Personalizada
            </span>
            <h3 className="font-bold text-nice-wine text-base">
              {displayName}
            </h3>
            <span className="text-xs font-extrabold text-nice-pink">
              {formatCurrency(itemPrice)} cada
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-100 text-gray-400 hover:text-nice-wine transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campo de Texto para Observações */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 block">
            Como você deseja este item?
          </label>
          <textarea
            rows={3}
            placeholder="Ex.: Embalar para presente, sem açúcar por cima, escrever bilhetinho, etc."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm rounded-2xl border border-pink-200 text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
            autoFocus
          />
        </div>

        {/* Seletor de Quantidade e Botão Confirmar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center border border-pink-200 rounded-full bg-white px-2 py-1 shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1 rounded-full text-nice-wine hover:bg-pink-100 disabled:opacity-30 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-nice-wine">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 rounded-full text-nice-wine hover:bg-pink-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {product.is_paused || (variation && variation.is_paused) ? (
            <button
              disabled
              className="px-5 py-2.5 rounded-full bg-gray-300 text-gray-500 text-xs sm:text-sm font-bold cursor-not-allowed"
            >
              Item Esgotado
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar ({formatCurrency(totalPrice)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
