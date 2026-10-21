"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { X, Sparkles, Check, Wand2, RefreshCw, Eye } from "lucide-react";

interface AIImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyImageToProduct: (productId: string, imageUrl: string) => void;
}

export function AIImageStudioModal({
  isOpen,
  onClose,
  products,
  onApplyImageToProduct,
}: AIImageStudioModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );
  const [selectedImage, setSelectedImage] = useState<string>(
    "/products/vulcao_ai.jpg"
  );
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // Catálogo de Fotos Aprimoradas por IA disponíveis
  const aiImagesCatalog = [
    {
      title: "Bolo Vulcão (IA Luxo)",
      src: "/products/vulcao_ai.jpg",
      realSrc: "/products/real/vulcao.jpg",
      suggestedProduct: "Vulcão",
    },
    {
      title: "Bombom de Uva (IA Luxo)",
      src: "/products/bombom_uva_ai.jpg",
      realSrc: "/products/real/bombom_uva.jpg",
      suggestedProduct: "Bombom de uva",
    },
    {
      title: "Brownies Gourmet (IA Luxo)",
      src: "/products/brownies_ai.jpg",
      realSrc: "/products/real/brownies.jpg",
      suggestedProduct: "Brownie recheado",
    },
    {
      title: "Bolo no Pote (IA Luxo)",
      src: "/products/bolo_pote_ai.jpg",
      realSrc: "/products/real/bolo_pote.jpg",
      suggestedProduct: "Bolo no Pote",
    },
    {
      title: "Cone Trufado (IA Luxo)",
      src: "/products/cone_trufado_ai.jpg",
      realSrc: "/products/real/cone_trufado.jpg",
      suggestedProduct: "Cone trufado",
    },
    {
      title: "Kit Festa Completo (IA Luxo)",
      src: "/products/kit_festa_ai.jpg",
      realSrc: "",
      suggestedProduct: "Kit festa",
    },
    {
      title: "Fatia de Bolo Recheada (IA Luxo)",
      src: "/products/fatia_bolo_ai.jpg",
      realSrc: "",
      suggestedProduct: "Fatia de Bolo",
    },
    {
      title: "Salgados de Festa Dourados (IA Luxo)",
      src: "/products/salgados_festa_ai.jpg",
      realSrc: "",
      suggestedProduct: "Salgados de Festa",
    },
    {
      title: "Pudim Aveludado com Caramelo (IA Luxo)",
      src: "/products/pudim_ai.jpg",
      realSrc: "",
      suggestedProduct: "Pudim",
    },
    {
      title: "Sucos Naturais da Polpa (IA Luxo)",
      src: "/products/sucos_polpa_ai.jpg",
      realSrc: "",
      suggestedProduct: "Sucos da Polpa",
    },
    {
      title: "Empadão de Frango Dourado (IA Luxo)",
      src: "/products/empadao_frango_ai.jpg",
      realSrc: "/products/real/empadao_frango.jpg",
      suggestedProduct: "Empadão de frango",
    },
    {
      title: "Empada de Charque c/ Requeijão (IA Luxo)",
      src: "/products/empada_charque_ai.jpg",
      realSrc: "/products/real/empada_charque.jpg",
      suggestedProduct: "Empada de charque c/ requeijão",
    },
  ];

  const handleApply = () => {
    if (!selectedProductId || !selectedImage) return;
    onApplyImageToProduct(selectedProductId, selectedImage);
    const prod = products.find((p) => p.id === selectedProductId);
    setSuccessMsg(
      `Foto de luxo aplicada com sucesso ao item "${prod?.name || "Produto"}"!`
    );
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 border-2 border-pink-100">
        
        {/* Cabeçalho do Estúdio IA */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-nice-pink via-purple-500 to-amber-400 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-nice-wine text-lg">
                ✨ Estúdio de Imagens IA de Luxo
              </h3>
              <p className="text-xs text-gray-500">
                Fotos hiper-realistas aprimoradas para confeitaria de alto padrão
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-nice-wine rounded-full hover:bg-pink-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Galeria de Fotos Aprimoradas */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-nice-wine uppercase tracking-wider block">
            1. Escolha a Foto de Confeitaria de Luxo (Gerada por IA)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {aiImagesCatalog.map((item, idx) => {
              const isSelected = selectedImage === item.src;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(item.src)}
                  className={`p-2 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                    isSelected
                      ? "border-nice-pink bg-nice-pink-light/50 shadow-md scale-102"
                      : "border-pink-100 hover:border-pink-300 bg-white"
                  }`}
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-pink-50">
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/logo.jpg";
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      ✨ IA Studio
                    </div>
                  </div>

                  <span className="font-bold text-[11px] text-nice-wine block truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate">
                    Para: {item.suggestedProduct}
                  </span>

                  {isSelected && (
                    <div className="absolute top-3 left-3 bg-nice-pink text-white p-1 rounded-full shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Seleção de Qual Produto Deve Receber Esta Foto */}
        <div className="p-4 bg-pink-50/60 rounded-2xl border border-pink-100 space-y-3">
          <label className="text-xs font-bold text-nice-wine uppercase tracking-wider block">
            2. Aplicar esta foto em qual produto do cardápio?
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full sm:flex-1 p-2.5 rounded-xl border border-pink-200 text-xs font-bold text-nice-wine bg-white focus:outline-none focus:ring-1 focus:ring-nice-pink"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (R$ {p.base_price.toFixed(2)})
                </option>
              ))}
            </select>

            <button
              onClick={handleApply}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>Aplicar Foto no Produto</span>
            </button>
          </div>
        </div>

        {/* Botão de Fechar */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
          >
            Fechar Estúdio
          </button>
        </div>
      </div>
    </div>
  );
}
