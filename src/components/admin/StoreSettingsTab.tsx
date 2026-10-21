"use client";

import React, { useState } from "react";
import { Store } from "@/types";
import { DEFAULT_STORE } from "@/lib/constants";
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  QrCode,
  MessageCircle,
  Instagram,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

interface StoreSettingsTabProps {
  store: Store;
  onSaveStore: (updatedStore: Store) => void;
}

export function StoreSettingsTab({ store, onSaveStore }: StoreSettingsTabProps) {
  const [formData, setFormData] = useState<Store>(store);
  const [successToast, setSuccessToast] = useState("");

  const handleChange = (field: keyof Store, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStore(formData);
    setSuccessToast("Configurações salvas e sincronizadas com sucesso!");
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        "Deseja realmente restaurar os dados originais da Nice Doce Sabor (Eunice Pereira / Recife-PE)?"
      )
    ) {
      setFormData(DEFAULT_STORE);
      onSaveStore(DEFAULT_STORE);
      setSuccessToast("Padrões originais da Nice Doce Sabor restaurados com sucesso!");
      setTimeout(() => setSuccessToast(""), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold">{successToast}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. DADOS DA CONFEITARIA / WHITE-LABEL */}
        <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-pink-50">
            <Sparkles className="w-5 h-5 text-nice-pink" />
            <div>
              <h3 className="font-bold text-nice-wine text-base">
                Identidade & Marca da Loja
              </h3>
              <p className="text-xs text-gray-500">
                Informações visíveis no cabeçalho do cardápio e mensagens.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Nome da Loja / Confeitaria *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex.: Nice Doce Sabor"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Nome da Dona / Confeiteira *
              </label>
              <input
                type="text"
                required
                value={formData.owner_name}
                onChange={(e) => handleChange("owner_name", e.target.value)}
                placeholder="Ex.: Eunice Pereira"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                WhatsApp Oficial de Pedidos (com DDI 55 e DDD) *
              </label>
              <input
                type="text"
                required
                value={formData.phone_whatsapp}
                onChange={(e) => handleChange("phone_whatsapp", e.target.value)}
                placeholder="5581988896169"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine font-mono focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Formato internacional sem traços (ex: 5581988896169). É para onde os pedidos chegam.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Instagram da Loja (@) *
              </label>
              <input
                type="text"
                required
                value={formData.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                placeholder="@nice.doce.sabor"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Cidade & Estado *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Recife - PE"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Endereço de Retirada no Local *
              </label>
              <input
                type="text"
                required
                value={formData.pickup_address}
                onChange={(e) => handleChange("pickup_address", e.target.value)}
                placeholder="Recife - PE (Retirada no local)"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>
          </div>
        </div>

        {/* 2. DADOS DO PIX DIRETO (SEM TAXAS) */}
        <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-pink-50">
            <QrCode className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="font-bold text-nice-wine text-base">
                Configuração do PIX Direto (Zero Taxas de Intermediação)
              </h3>
              <p className="text-xs text-gray-500">
                O cliente copia a chave no checkout e envia o comprovante no WhatsApp da loja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Chave PIX da Dona / Loja *
              </label>
              <input
                type="text"
                required
                value={formData.pix_key}
                onChange={(e) => handleChange("pix_key", e.target.value)}
                placeholder="Ex.: 81988896169 ou email ou chave aleatória"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine font-mono focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Tipo da Chave PIX *
              </label>
              <select
                value={formData.pix_key_type}
                onChange={(e) => handleChange("pix_key_type", e.target.value as any)}
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine bg-white focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              >
                <option value="phone">Telefone / Celular</option>
                <option value="cpf_cnpj">CPF ou CNPJ</option>
                <option value="email">E-mail</option>
                <option value="random">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Nome do Beneficiário no Banco *
              </label>
              <input
                type="text"
                required
                value={formData.pix_beneficiary_name}
                onChange={(e) => handleChange("pix_beneficiary_name", e.target.value)}
                placeholder="Ex.: Eunice Pereira"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Cidade da Conta Bancária *
              </label>
              <input
                type="text"
                required
                value={formData.pix_city}
                onChange={(e) => handleChange("pix_city", e.target.value)}
                placeholder="Ex.: Recife"
                className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>
          </div>
        </div>

        {/* 3. AVISO QUANDO A LOJA ESTIVER FECHADA */}
        <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-pink-50">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-nice-wine text-base">
                Mensagem de Atendimento & Horários
              </h3>
              <p className="text-xs text-gray-500">
                Padrão: Quarta a Segunda das 12h às 19h (Terça-feira Fechado).
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Mensagem Personalizada quando a Loja estiver Fechada
            </label>
            <textarea
              rows={3}
              value={formData.closed_custom_message || ""}
              onChange={(e) => handleChange("closed_custom_message", e.target.value)}
              placeholder="Estamos fechados no momento. Nosso atendimento é de quarta a segunda, das 12h às 19h (terça-feira fechado)."
              className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
            />
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs font-bold transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrões da Nice Doce Sabor</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-7 py-3 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs sm:text-sm font-bold shadow-lg transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações da Loja</span>
          </button>
        </div>
      </form>
    </div>
  );
}
