"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { X, Trash2, Plus, Minus, Edit3, ShoppingBag, ArrowRight } from "lucide-react";

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

function CartItemThumb({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  return (
    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center border border-pink-100">
      {error || !src ? (
        <span className="text-xs font-bold text-nice-pink font-script">NDS</span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

export function CartDrawer({ onProceedToCheckout }: CartDrawerProps) {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, updateNotes, subtotal, clearCart } = useCart();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  if (!isCartOpen) return null;

  const handleStartEditNote = (cartItemId: string, currentNote: string) => {
    setEditingNoteId(cartItemId);
    setTempNote(currentNote);
  };

  const handleSaveNote = (cartItemId: string) => {
    updateNotes(cartItemId, tempNote);
    setEditingNoteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
        
        {/* Cabeçalho do Carrinho */}
        <div className="p-4 sm:p-5 border-b border-pink-100 flex items-center justify-between bg-[#FFF8FC]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-nice-pink rounded-full text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-nice-wine text-base sm:text-lg">
                Seu Pedido
              </h2>
              <p className="text-xs text-nice-pink font-medium">
                {items.length === 1 ? "1 item adicionado" : `${items.length} itens adicionados`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-pink-100 text-gray-500 hover:text-nice-wine transition"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Itens do Carrinho */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-nice-pink/40" />
              </div>
              <h3 className="font-bold text-nice-wine text-base mb-1">
                Seu carrinho está vazio
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                Explore nosso cardápio de delícias e adicione doces e bolos ao seu pedido.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 rounded-full bg-nice-pink text-white text-xs font-bold shadow-md hover:bg-nice-pink-hover transition"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cart_item_id}
                className="p-3.5 rounded-2xl border border-pink-100 bg-[#FFFDFE] shadow-sm space-y-2 hover:border-pink-200 transition"
              >
                <div className="flex gap-3">
                  {/* Foto Miniatura com Tratamento de Erro */}
                  <CartItemThumb
                    src={item.product.images[0] || "/logo.jpg"}
                    alt={item.product.name}
                  />

                  {/* Detalhes do Item */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-nice-wine text-xs sm:text-sm truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.cart_item_id)}
                        className="text-gray-400 hover:text-rose-500 p-1 transition"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Variação de tamanho */}
                    {item.selected_variation && (
                      <span className="inline-block text-[11px] font-medium text-nice-pink bg-nice-pink-light px-2 py-0.5 rounded-md mt-0.5">
                        {item.selected_variation.name}
                      </span>
                    )}

                    {/* Adicionais selecionados */}
                    {item.selected_addons && item.selected_addons.length > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                        + {item.selected_addons.map((a) => a.name).join(", ")}
                      </p>
                    )}

                    {/* Preço Unitário */}
                    <div className="text-xs font-bold text-nice-wine mt-1">
                      {formatCurrency(item.total_price)}
                    </div>
                  </div>
                </div>

                {/* Observação com suporte a edição direta */}
                <div className="pt-2 border-t border-pink-50 flex flex-col gap-1">
                  {editingNoteId === item.cart_item_id ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        placeholder="Edite sua observação..."
                        className="w-full p-2 text-xs border border-pink-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-nice-pink"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 text-[10px] font-medium text-gray-500 rounded-lg hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveNote(item.cart_item_id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-nice-pink rounded-lg hover:bg-nice-pink-hover"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-gray-500 bg-pink-50/50 p-1.5 px-2.5 rounded-xl">
                      <span className="truncate italic">
                        {item.custom_notes ? `Obs: "${item.custom_notes}"` : "Sem observação"}
                      </span>
                      <button
                        onClick={() => handleStartEditNote(item.cart_item_id, item.custom_notes)}
                        className="text-nice-pink hover:text-nice-pink-dark flex items-center gap-0.5 font-medium ml-2 flex-shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Controles de Quantidade direta na linha */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <div className="flex items-center border border-pink-200 rounded-full bg-white px-2 py-0.5">
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, -1)}
                      className="p-1 rounded-full text-nice-wine hover:bg-pink-100 transition"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-nice-wine">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, 1)}
                      className="p-1 rounded-full text-nice-wine hover:bg-pink-100 transition"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Subtotal e Botão de Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-pink-100 bg-[#FFF8FC] space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Tipo de atendimento</span>
              <span className="font-semibold text-nice-wine">Retirada no local (Padrão)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-nice-wine text-sm">Subtotal do pedido</span>
              <span className="font-extrabold text-nice-pink text-xl">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={clearCart}
                className="px-3 py-3 rounded-full border border-pink-200 text-gray-400 hover:text-rose-500 hover:border-rose-200 transition"
                title="Esvaziar carrinho"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="flex-1 py-3.5 px-4 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white font-bold text-xs sm:text-sm shadow-luxury flex items-center justify-center gap-2 transition transform active:scale-98"
              >
                <span>Avançar para Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
