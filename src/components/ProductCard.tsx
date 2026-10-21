"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product, ProductVariation } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Maximize2, MessageSquarePlus, Check, Sparkles, Heart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onOpenImageModal: (imageSrc: string, title: string) => void;
  onOpenCustomModal: (product: Product, variation?: ProductVariation) => void;
}

function FlavorThumbnail({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick: () => void;
}) {
  const [thumbError, setThumbError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-8 h-8 rounded-lg overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-200 flex items-center justify-center"
      title="Ver foto deste sabor"
    >
      {thumbError || !src ? (
        <span className="text-[9px] font-bold text-nice-pink">NDS</span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setThumbError(true)}
        />
      )}
    </button>
  );
}

export function ProductCard({
  product,
  onOpenImageModal,
  onOpenCustomModal,
}: ProductCardProps) {
  const { getItemQuantity, quickIncrement, quickDecrement } = useCart();
  const [imageIndex, setImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const imagesList = product.images && product.images.length > 0 ? product.images : [];
  const currentImageUrl = imagesList[imageIndex] || "";

  const handleImageError = () => {
    if (imageIndex < imagesList.length - 1) {
      setImageIndex((prev) => prev + 1);
    } else {
      setImageError(true);
    }
  };

  const primaryImage = !imageError && currentImageUrl ? currentImageUrl : "";

  const hasFlavors = product.variations && product.variations.length > 0;

  // Agrupa os sabores por faixa de preço
  const priceGroups = React.useMemo(() => {
    if (!hasFlavors) return [];
    const groups: { price: number; flavors: ProductVariation[] }[] = [];

    product.variations.forEach((variation) => {
      let group = groups.find((g) => g.price === variation.price);
      if (!group) {
        group = { price: variation.price, flavors: [] };
        groups.push(group);
      }
      group.flavors.push(variation);
    });

    // Ordena os grupos pelo menor preço primeiro
    return groups.sort((a, b) => a.price - b.price);
  }, [product.variations, hasFlavors]);

  // Quantidade de produto simples no carrinho
  const simpleQuantity = !hasFlavors ? getItemQuantity(product.id) : 0;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-card-3d border border-pink-100 hover:border-pink-300 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Topo: Imagem com Abertura em Tela Cheia ao Tocar */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-pink-50 mb-3.5 group">
          {imageError || !primaryImage ? (
            <div className="w-full h-full bg-gradient-to-tr from-[#FFF0F7] via-[#FFF8FC] to-[#FFE8F3] flex flex-col items-center justify-center p-4 text-center select-none border border-pink-100">
              <div className="w-12 h-12 rounded-full bg-nice-pink/10 text-nice-pink flex items-center justify-center mb-2 shadow-sm">
                <Sparkles className="w-6 h-6 text-nice-pink" />
              </div>
              <span className="font-bold text-nice-wine text-xs uppercase tracking-wider line-clamp-1">{product.name}</span>
              <span className="text-[10px] text-nice-pink font-semibold mt-0.5">Nice Doce Sabor</span>
            </div>
          ) : (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => onOpenImageModal(primaryImage, product.name)}
              onError={handleImageError}
              priority={false}
            />
          )}

          {/* Botão de Zoom / Ver Foto em Tela Cheia */}
          {!imageError && primaryImage && (
            <button
              onClick={() => onOpenImageModal(primaryImage, product.name)}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition"
              title="Ver foto em tela cheia"
              aria-label="Ver foto ampliada"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Badge de Destaque */}
          {product.badge && (
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-nice-pink to-pink-500 text-white shadow-sm">
                {product.badge}
              </span>
            </div>
          )}
        </div>

        {/* Nome do Produto e Descrição */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-nice-wine text-base sm:text-lg leading-snug">
              {product.name}
            </h3>
            {/* Se for simples, mostra o preço ao lado do título */}
            {!hasFlavors && (
              <span className="font-extrabold text-nice-pink text-base whitespace-nowrap">
                {formatCurrency(product.base_price)}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* ======================================================== */}
        {/* CASO 1: PRODUTO COM SABORES (Bolo no Pote, Fatia, Cone, Salgadinho) */}
        {/* ======================================================== */}
        {hasFlavors && (
          <div className="space-y-4 pt-2 border-t border-pink-100">
            {priceGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-2">
                {/* Faixa de Preço do Grupo */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-nice-pink-light text-nice-pink border border-pink-200">
                    {formatCurrency(group.price)} cada
                  </span>
                  <div className="h-[1px] flex-1 bg-pink-100" />
                </div>

                {/* Lista Completa de Sabores com seus próprios botões [- qtd +] */}
                <div className="space-y-1.5">
                  {group.flavors.map((flavor) => {
                    const flavorQty = getItemQuantity(product.id, flavor.name);
                    const flavorImg = flavor.image || primaryImage;

                    return (
                      <div
                        key={flavor.name}
                        className={`flex items-center justify-between p-2 sm:p-2.5 rounded-2xl border transition-all ${
                          flavorQty > 0
                            ? "bg-[#FFF0F7] border-nice-pink shadow-sm"
                            : "bg-[#FFFDFE] border-pink-100 hover:border-pink-200"
                        }`}
                      >
                        {/* Nome do Sabor e Mini Foto Clicável */}
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FlavorThumbnail
                            src={flavorImg}
                            alt={flavor.name}
                            onClick={() =>
                              onOpenImageModal(
                                flavorImg,
                                `${product.name} - ${flavor.name}`
                              )
                            }
                          />

                          <div className="min-w-0">
                            <span className="font-semibold text-xs sm:text-sm text-nice-wine block truncate">
                              {flavor.name}
                            </span>
                            <span className="text-[11px] font-bold text-nice-pink">
                              {formatCurrency(flavor.price)}
                            </span>
                          </div>
                        </div>

                        {/* Controles de Quantidade: [- qtd +] e Botão Obs */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {flavorQty === 0 ? (
                            <button
                              onClick={() => quickIncrement(product, flavor)}
                              className="px-3 py-1.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-sm flex items-center gap-1 transition active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-white border border-pink-200 rounded-full p-0.5 shadow-sm">
                              <button
                                onClick={() =>
                                  quickDecrement(product.id, flavor.name)
                                }
                                className="w-6 h-6 rounded-full text-nice-wine hover:bg-pink-100 flex items-center justify-center transition"
                                aria-label="Diminuir"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-extrabold text-nice-pink">
                                {flavorQty}
                              </span>
                              <button
                                onClick={() => quickIncrement(product, flavor)}
                                className="w-6 h-6 rounded-full bg-nice-pink text-white hover:bg-nice-pink-hover flex items-center justify-center transition"
                                aria-label="Aumentar"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Botão de Observação Específica do Sabor */}
                          <button
                            onClick={() => onOpenCustomModal(product, flavor)}
                            className="p-1.5 text-gray-400 hover:text-nice-pink hover:bg-pink-50 rounded-lg transition"
                            title="Adicionar observação personalizada neste sabor"
                          >
                            <MessageSquarePlus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CASO 2: PRODUTO SIMPLES (Trufa, Pudim, Brownie, Empada, Empadão) */}
      {/* ======================================================== */}
      {!hasFlavors && (
        <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Preço</span>
            <span className="text-base sm:text-lg font-extrabold text-nice-wine">
              {formatCurrency(product.base_price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {simpleQuantity === 0 ? (
              <button
                onClick={() => quickIncrement(product, null)}
                className="px-4 py-2 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Adicionar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-nice-pink-light border border-pink-200 rounded-full px-2 py-1 shadow-sm">
                <button
                  onClick={() => quickDecrement(product.id)}
                  className="w-6 h-6 rounded-full text-nice-wine hover:bg-pink-100 flex items-center justify-center transition"
                  aria-label="Diminuir"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-xs font-extrabold text-nice-pink">
                  {simpleQuantity}
                </span>
                <button
                  onClick={() => quickIncrement(product, null)}
                  className="w-6 h-6 rounded-full bg-nice-pink text-white hover:bg-nice-pink-hover flex items-center justify-center transition"
                  aria-label="Aumentar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => onOpenCustomModal(product)}
              className="p-2 text-gray-400 hover:text-nice-pink hover:bg-pink-50 rounded-xl transition"
              title="Adicionar observação especial neste item"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
