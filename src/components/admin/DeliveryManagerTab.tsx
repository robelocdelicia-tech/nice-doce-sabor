"use client";

import React, { useState } from "react";
import { Neighborhood, Store } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Truck, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, MapPin } from "lucide-react";

interface DeliveryManagerTabProps {
  store: Store;
  onUpdateDeliveryEnabled: (enabled: boolean) => void;
  neighborhoods: Neighborhood[];
  onSaveNeighborhoods: (items: Neighborhood[]) => void;
}

export function DeliveryManagerTab({
  store,
  onUpdateDeliveryEnabled,
  neighborhoods,
  onSaveNeighborhoods,
}: DeliveryManagerTabProps) {
  const [newNeighborhoodName, setNewNeighborhoodName] = useState("");
  const [newNeighborhoodFee, setNewNeighborhoodFee] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const handleAddNeighborhood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeighborhoodName.trim()) return;

    const fee = parseFloat(newNeighborhoodFee.replace(",", ".")) || 0;

    const newItem: Neighborhood = {
      id: `nh_${Date.now()}`,
      name: newNeighborhoodName.trim(),
      delivery_fee: fee,
      is_active: true,
    };

    const updated = [...neighborhoods, newItem];
    onSaveNeighborhoods(updated);
    setNewNeighborhoodName("");
    setNewNeighborhoodFee("");
    showSuccess(`Bairro "${newItem.name}" adicionado com sucesso!`);
  };

  const handleToggleActive = (id: string) => {
    const updated = neighborhoods.map((n) =>
      n.id === id ? { ...n, is_active: !n.is_active } : n
    );
    onSaveNeighborhoods(updated);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o bairro "${name}"?`)) {
      const updated = neighborhoods.filter((n) => n.id !== id);
      onSaveNeighborhoods(updated);
      showSuccess(`Bairro "${name}" removido.`);
    }
  };

  const handleLoadRecifePresets = () => {
    const presets: Neighborhood[] = [
      { id: "nh_bv", name: "Boa Viagem", delivery_fee: 12.0, is_active: true },
      { id: "nh_pina", name: "Pina", delivery_fee: 10.0, is_active: true },
      { id: "nh_mada", name: "Madalena", delivery_fee: 10.0, is_active: true },
      { id: "nh_esp", name: "Espinheiro", delivery_fee: 12.0, is_active: true },
      { id: "nh_gracas", name: "Graças", delivery_fee: 12.0, is_active: true },
      { id: "nh_cf", name: "Casa Forte", delivery_fee: 14.0, is_active: true },
      { id: "nh_imb", name: "Imbiribeira", delivery_fee: 12.0, is_active: true },
      { id: "nh_torre", name: "Torre", delivery_fee: 10.0, is_active: true },
      { id: "nh_jaqueira", name: "Jaqueira", delivery_fee: 12.0, is_active: true },
    ];

    if (
      neighborhoods.length === 0 ||
      confirm("Deseja carregar a lista de sugestões de bairros de Recife? (Os bairros atuais serão mantidos)")
    ) {
      const existingNames = new Set(neighborhoods.map((n) => n.name.toLowerCase()));
      const toAdd = presets.filter((p) => !existingNames.has(p.name.toLowerCase()));
      const merged = [...neighborhoods, ...toAdd];
      onSaveNeighborhoods(merged);
      showSuccess(`${toAdd.length} bairros de Recife foram adicionados!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-bold">{successToast}</span>
        </div>
      )}

      {/* 1. CHAVE MESTRA DO SERVIÇO DE ENTREGA */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-nice-pink" />
              <h3 className="font-bold text-nice-wine text-base">
                Serviço de Entrega (Delivery)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ative quando tiver entregador disponível. Quando desligado, o cardápio permite apenas <strong>Retirada no Local</strong>.
            </p>
          </div>

          <button
            onClick={() => onUpdateDeliveryEnabled(!store.delivery_enabled)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition shadow-sm flex items-center gap-2 ${
              store.delivery_enabled
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                store.delivery_enabled ? "bg-white animate-pulse" : "bg-gray-500"
              }`}
            />
            <span>
              {store.delivery_enabled ? "Entrega Ativada ✅" : "Entrega Desativada ⏸️"}
            </span>
          </button>
        </div>

        {store.delivery_enabled ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              O Delivery está <strong>ativo</strong>! Os clientes poderão escolher entre Retirada ou Entrega no seu endereço ao fechar o pedido.
            </span>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              O Delivery está <strong>desativado</strong> (situação atual da loja sem entregador fixo). Somente a opção "Retirada no Local" estará disponível aos clientes.
            </span>
          </div>
        )}
      </div>

      {/* 2. FORMULÁRIO DE CADASTRO DE BAIRROS */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-nice-wine text-sm">
              Cadastrar Novo Bairro & Taxa de Frete
            </h4>
            <p className="text-xs text-gray-500">
              Defina o valor do frete para cada localidade de Recife.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadRecifePresets}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-nice-wine border border-pink-200 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-nice-gold" />
            <span>Carregar Bairros de Recife (Sugestões)</span>
          </button>
        </div>

        <form onSubmit={handleAddNeighborhood} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              Nome do Bairro *
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: Boa Viagem, Madalena, Casa Forte..."
              value={newNeighborhoodName}
              onChange={(e) => setNewNeighborhoodName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              Taxa de Entrega (R$) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ex.: 12,00"
                value={newNeighborhoodFee}
                onChange={(e) => setNewNeighborhoodFee(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-sm flex items-center gap-1 transition flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. LISTA DE BAIRROS CADASTRADOS */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-nice-wine text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-nice-pink" />
            <span>Bairros Cadastrados ({neighborhoods.length})</span>
          </h4>
        </div>

        {neighborhoods.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-3">
            <p>Nenhum bairro cadastrado ainda.</p>
            <button
              onClick={handleLoadRecifePresets}
              className="px-4 py-2 rounded-full bg-white border border-pink-200 text-nice-wine font-semibold hover:bg-pink-100 text-xs transition"
            >
              Clique para carregar bairros populares de Recife
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {neighborhoods.map((nh) => (
              <div
                key={nh.id}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                  nh.is_active
                    ? "bg-white border-pink-100 shadow-sm"
                    : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div>
                  <div className="font-bold text-nice-wine text-xs flex items-center gap-1.5">
                    <span>{nh.name}</span>
                    {!nh.is_active && (
                      <span className="text-[10px] text-gray-500 font-normal">
                        (Inativo)
                      </span>
                    )}
                  </div>
                  <div className="text-nice-pink font-extrabold text-sm mt-0.5">
                    {nh.delivery_fee === 0 ? "Grátis" : formatCurrency(nh.delivery_fee)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(nh.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      nh.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    title={nh.is_active ? "Clique para desativar" : "Clique para ativar"}
                  >
                    {nh.is_active ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(nh.id, nh.name)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Excluir bairro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
