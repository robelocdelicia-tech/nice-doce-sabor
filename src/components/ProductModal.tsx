"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, ProductVariation, ProductAddOn } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { X, Plus, Minus, Check, Clock, Sparkles } from "lucide-react";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddOn[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [customNotes, setCustomNotes] = useState("");
  const [imageError, setImageError] = useState(false);

  // Inicializa a variação padrão ao abrir o modal
  useEffect(() => {
    if (product) {
      if (product.variations && product.variations.length > 0) {
        setSelectedVariation(product.variations[0]);
      } else {
        setSelectedVariation(null);
      }
      setSelectedAddons([]);
      setQuantity(1);
      setCustomNotes("");
      setSelectedImageIndex(0);
      setImageError(false);
    }
  }, [product]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : ["/logo.jpg"];
  const currentImage = imageError ? "/logo.jpg" : images[selectedImageIndex] || images[0];

  const basePrice = selectedVariation ? selectedVariation.price : product.base_price;
  const addonsTotal = selectedAddons.reduce((acc, a) => acc + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: ProductAddOn) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      if (exists) {
        return prev.filter((a) => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariation, selectedAddons, customNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg max-h-[90vh] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col relative border-t sm:border border-pink-100 animate-in slide-in-from-bottom duration-300">
        
        {/* Botão Fechar Flutuante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-md backdrop-blur-sm transition active:scale-95"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Galeria de Fotos */}
        <div className="relative w-full aspect-[4/3] bg-pink-50 flex-shrink-0">
          <Image
            src={currentImage}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Badges na Foto */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-nice-pink shadow-md">
              {product.badge || "Artesanal"}
            </span>
            {product.lead_time_hours > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-md">
                <Clock className="w-3 h-3 text-nice-gold" />
                {product.lead_time_hours}h antecedência
              </span>
            )}
          </div>
        </div>

        {/* Miniaturas se houver mais de 1 foto */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 p-2 px-4 bg-pink-50/50 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition ${
                  selectedImageIndex === idx ? "border-nice-pink scale-105 shadow-sm" : "border-transparent opacity-70"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo com Rolagem */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Título e Descrição */}
          <div>
            <h2 className="text-xl font-bold text-nice-wine">{product.name}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Variações / Tamanhos (se houver) */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-nice-wine flex items-center gap-1">
                <span>Escolha o Tamanho / Porção</span>
                <span className="text-nice-pink">*</span>
              </label>
              <div className="space-y-2">
                {product.variations.map((v) => {
                  const isSelected = selectedVariation?.name === v.name;
                  return (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariation(v)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs sm:text-sm transition-all duration-200 ${
                        isSelected
                          ? "border-nice-pink bg-nice-pink-light/60 font-semibold shadow-sm text-nice-wine"
                          : "border-pink-100 bg-white text-gray-700 hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-nice-pink bg-nice-pink text-white" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{v.name}</span>
                      </div>
                      <span className="font-bold text-nice-pink">{formatCurrency(v.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adicionais / Opcionais (se houver) */}
          {product.add_ons && product.add_ons.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-nice-wine">
                Adicionais Opcionais
              </label>
              <div className="space-y-2">
                {product.add_ons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.name === addon.name);
                  return (
                    <button
                      key={addon.name}
                      onClick={() => toggleAddon(addon)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs sm:text-sm transition-all duration-200 ${
                        isChecked
                          ? "border-nice-pink bg-nice-pink-light/40 font-semibold text-nice-wine shadow-sm"
                          : "border-pink-100 bg-white text-gray-700 hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked ? "border-nice-pink bg-nice-pink text-white" : "border-gray-300"
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="font-semibold text-nice-pink">
                        +{formatCurrency(addon.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campo de Observações Personalizadas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-nice-wine">
              Alguma observação para este item?
            </label>
            <textarea
              rows={2}
              placeholder="Ex.: Escrever 'Parabéns Sofia 5 Anos', sem canela, etc."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
            />
          </div>
        </div>

        {/* Rodapé Fixo: Quantidade e Botão Adicionar */}
        <div className="p-4 border-t border-pink-100 bg-[#FFF5FA] flex items-center justify-between gap-4">
          {/* Contador de Quantidade */}
          <div className="flex items-center border border-pink-200 rounded-full bg-white px-2 py-1 shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1 rounded-full text-nice-wine hover:bg-pink-100 disabled:opacity-30 transition"
              aria-label="Diminuir"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-nice-wine">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 rounded-full text-nice-wine hover:bg-pink-100 transition"
              aria-label="Aumentar"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Botão Adicionar ao Pedido com Preço Dinâmico */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white font-bold text-xs sm:text-sm shadow-luxury flex items-center justify-between transition-all transform active:scale-98"
          >
            <span>Adicionar ao Pedido</span>
            <span>{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
