"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product, BestSellersConfig } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { X, Check, Pin, Flame, Sparkles } from "lucide-react";

interface BestSellersConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentConfig?: BestSellersConfig;
  onSaveConfig: (config: BestSellersConfig) => void;
}

export function BestSellersConfigModal({
  isOpen,
  onClose,
  products,
  currentConfig,
  onSaveConfig,
}: BestSellersConfigModalProps) {
  const [mode, setMode] = useState<"auto" | "manual">(currentConfig?.mode || "auto");
  const [period, setPeriod] = useState<"7d" | "30d" | "month" | "all">(
    currentConfig?.period || "30d"
  );
  const [displayLimit, setDisplayLimit] = useState<number>(currentConfig?.display_limit || 6);
  const [pinnedIds, setPinnedIds] = useState<string[]>(
    currentConfig?.manual_product_ids || []
  );

  if (!isOpen) return null;

  const togglePin = (productId: string) => {
    setPinnedIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSave = () => {
    onSaveConfig({
      mode,
      period,
      display_limit: displayLimit,
      manual_product_ids: pinnedIds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-5 max-h-[90vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-start justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-nice-wine text-base">
                Configurar "Mais Pedidos"
              </h3>
              <p className="text-xs text-gray-500">
                Escolha como os itens em destaque são calculados e exibidos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-100 text-gray-400 hover:text-nice-wine transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Modo de Exibição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-nice-wine">
              Modo de Seleção
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("auto")}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition ${
                  mode === "auto"
                    ? "border-nice-pink bg-nice-pink-light/60 text-nice-pink shadow-sm"
                    : "border-pink-100 text-gray-600 hover:border-pink-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>🔥 Automático</span>
                  {mode === "auto" && <Check className="w-4 h-4 text-nice-pink" />}
                </div>
                <span className="text-[11px] font-normal text-gray-500 block">
                  Calculado pelas vendas reais dos pedidos
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition ${
                  mode === "manual"
                    ? "border-nice-pink bg-nice-pink-light/60 text-nice-pink shadow-sm"
                    : "border-pink-100 text-gray-600 hover:border-pink-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>📌 Manual</span>
                  {mode === "manual" && <Check className="w-4 h-4 text-nice-pink" />}
                </div>
                <span className="text-[11px] font-normal text-gray-500 block">
                  Eu escolho e fixo os produtos que aparecem
                </span>
              </button>
            </div>
          </div>

          {/* Período das Vendas (se modo automático) */}
          {mode === "auto" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-nice-wine">
                Período para Cálculo Automático
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "7d", label: "7 Dias" },
                  { id: "30d", label: "30 Dias" },
                  { id: "month", label: "Mês Atual" },
                  { id: "all", label: "Histórico" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      period === p.id
                        ? "bg-nice-wine text-white border-nice-wine shadow-sm"
                        : "bg-white text-gray-600 border-pink-100 hover:bg-pink-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Limite de Itens no Carrossel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-nice-wine">
              Quantidade de Itens no Topo
            </label>
            <div className="flex items-center gap-2">
              {[4, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDisplayLimit(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    displayLimit === num
                      ? "bg-nice-pink text-white border-nice-pink shadow-sm"
                      : "bg-white text-gray-600 border-pink-100 hover:bg-pink-50"
                  }`}
                >
                  Top {num}
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Itens Fixados (Modo Manual ou Pinned) */}
          <div className="space-y-2 pt-2 border-t border-pink-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-nice-wine flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-nice-pink" />
                <span>
                  {mode === "manual"
                    ? "Selecione os Produtos do Destaque"
                    : "Fixar Produtos no Topo (Opcional)"}
                </span>
              </label>
              <span className="text-[11px] font-bold text-nice-pink">
                {pinnedIds.length} selecionado(s)
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {products.map((prod) => {
                const isPinned = pinnedIds.includes(prod.id);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => togglePin(prod.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-2xl border text-xs transition ${
                      isPinned
                        ? "bg-amber-50 border-amber-300 font-semibold text-nice-wine shadow-sm"
                        : "bg-white border-pink-100 text-gray-700 hover:border-pink-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100">
                        <Image
                          src={prod.images?.[0] || "/logo.jpg"}
                          alt={prod.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="truncate">{prod.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-bold text-nice-pink">
                        {formatCurrency(prod.base_price)}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isPinned
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isPinned && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t border-pink-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-pink-200 text-nice-wine text-xs font-semibold hover:bg-pink-50 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md transition"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
