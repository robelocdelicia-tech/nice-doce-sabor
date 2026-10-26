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
  Copy,
  Calendar,
  Power,
  Check,
} from "lucide-react";

interface StoreSettingsTabProps {
  store: Store;
  onSaveStore: (updatedStore: Store) => void;
}

const DAYS_OF_WEEK = [
  { key: "monday", name: "Segunda-feira", short: "Seg" },
  { key: "tuesday", name: "Terça-feira", short: "Ter" },
  { key: "wednesday", name: "Quarta-feira", short: "Qua" },
  { key: "thursday", name: "Quinta-feira", short: "Qui" },
  { key: "friday", name: "Sexta-feira", short: "Sex" },
  { key: "saturday", name: "Sábado", short: "Sáb" },
  { key: "sunday", name: "Domingo", short: "Dom" },
];

export function StoreSettingsTab({ store, onSaveStore }: StoreSettingsTabProps) {
  const [formData, setFormData] = useState<Store>(store);
  const [successToast, setSuccessToast] = useState("");

  const handleChange = (field: keyof Store, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateDaySchedule = (
    dayKey: string,
    updates: Partial<{ open: string; close: string; closed: boolean }>
  ) => {
    setFormData((prev) => {
      const current = prev.schedule_config?.[dayKey] || {
        open: "12:00",
        close: "19:00",
        closed: false,
      };
      return {
        ...prev,
        schedule_config: {
          ...prev.schedule_config,
          [dayKey]: {
            ...current,
            ...updates,
          },
        },
      };
    });
  };

  const handleCopyScheduleToAll = (sourceDayKey: string) => {
    const source = formData.schedule_config?.[sourceDayKey] || {
      open: "12:00",
      close: "19:00",
      closed: false,
    };
    setFormData((prev) => {
      const nextSchedule = { ...(prev.schedule_config || {}) };
      DAYS_OF_WEEK.forEach(({ key }) => {
        if (!nextSchedule[key]?.closed) {
          nextSchedule[key] = {
            ...(nextSchedule[key] || { closed: false }),
            open: source.open,
            close: source.close,
          };
        }
      });
      return { ...prev, schedule_config: nextSchedule };
    });
    setSuccessToast(`Horário (${source.open} às ${source.close}) copiado para todos os dias abertos!`);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const handleApplyPresetSchedule = (preset: "nice" | "all_days" | "mon_sat") => {
    if (preset === "nice") {
      setFormData((prev) => ({
        ...prev,
        schedule_config: DEFAULT_STORE.schedule_config,
        closed_custom_message: DEFAULT_STORE.closed_custom_message,
      }));
      setSuccessToast("Horário padrão da Nice Doce Sabor aplicado (Qua a Seg 12h às 19h, Terça Fechada)!");
    } else if (preset === "all_days") {
      const all: any = {};
      DAYS_OF_WEEK.forEach(({ key }) => {
        all[key] = { open: "12:00", close: "19:00", closed: false };
      });
      setFormData((prev) => ({
        ...prev,
        schedule_config: all,
        closed_custom_message: "Nosso atendimento é todos os dias das 12h às 19h.",
      }));
      setSuccessToast("Horário aplicado: Todos os dias das 12h às 19h!");
    } else if (preset === "mon_sat") {
      const monSat: any = {};
      DAYS_OF_WEEK.forEach(({ key }) => {
        monSat[key] = {
          open: "09:00",
          close: "18:00",
          closed: key === "sunday",
        };
      });
      setFormData((prev) => ({
        ...prev,
        schedule_config: monSat,
        closed_custom_message: "Nosso atendimento é de segunda a sábado das 09h às 18h (domingo fechado).",
      }));
      setSuccessToast("Horário aplicado: Segunda a Sábado das 09h às 18h!");
    }
    setTimeout(() => setSuccessToast(""), 3500);
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

        {/* 3. HORÁRIOS DE FUNCIONAMENTO & ATENDIMENTO DA CONFEITARIA */}
        <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-pink-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-nice-wine text-base">
                  Horários de Funcionamento da Loja
                </h3>
                <p className="text-xs text-gray-500">
                  Configure os horários de abertura e fechamento para cada dia da semana.
                </p>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 mr-1">Atalhos:</span>
              <button
                type="button"
                onClick={() => handleApplyPresetSchedule("nice")}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-pink-50 text-nice-pink hover:bg-pink-100 transition border border-pink-200"
              >
                Padrão Nice (Qua-Seg 12h-19h)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetSchedule("all_days")}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-pink-50 text-nice-wine hover:bg-pink-100 transition border border-pink-200"
              >
                Todos os Dias (12h-19h)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetSchedule("mon_sat")}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-pink-50 text-nice-wine hover:bg-pink-100 transition border border-pink-200"
              >
                Seg a Sáb (09h-18h)
              </button>
            </div>
          </div>

          {/* Modo de Operação do Cardápio */}
          <div>
            <label className="text-xs font-bold text-nice-wine block mb-2">
              Status do Atendimento no Cardápio:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  formData.manual_status === "auto"
                    ? "bg-emerald-50/70 border-emerald-400 shadow-sm"
                    : "bg-white border-pink-100 hover:border-pink-200"
                }`}
              >
                <input
                  type="radio"
                  name="manual_status"
                  value="auto"
                  checked={formData.manual_status === "auto"}
                  onChange={() => handleChange("manual_status", "auto")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-nice-wine block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Automático (Grade)</span>
                  </span>
                  <span className="text-gray-500 text-[11px] mt-0.5 block">
                    Abre e fecha sozinho nos dias e horários programados abaixo.
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  formData.manual_status === "open"
                    ? "bg-emerald-50/70 border-emerald-400 shadow-sm"
                    : "bg-white border-pink-100 hover:border-pink-200"
                }`}
              >
                <input
                  type="radio"
                  name="manual_status"
                  value="open"
                  checked={formData.manual_status === "open"}
                  onChange={() => handleChange("manual_status", "open")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-emerald-700 block flex items-center gap-1">
                    <Power className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Forçar Aberto Agora</span>
                  </span>
                  <span className="text-gray-500 text-[11px] mt-0.5 block">
                    Mantém a loja aberta para pedidos agora mesmo, ignorando a grade.
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  formData.manual_status === "closed"
                    ? "bg-rose-50/80 border-rose-300 shadow-sm"
                    : "bg-white border-pink-100 hover:border-pink-200"
                }`}
              >
                <input
                  type="radio"
                  name="manual_status"
                  value="closed"
                  checked={formData.manual_status === "closed"}
                  onChange={() => handleChange("manual_status", "closed")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-rose-700 block flex items-center gap-1">
                    <Power className="w-3.5 h-3.5 text-rose-600" />
                    <span>Forçar Fechado Agora</span>
                  </span>
                  <span className="text-gray-500 text-[11px] mt-0.5 block">
                    Pausa o atendimento agora e exibe o aviso de loja fechada.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Grade Semanal Dia a Dia */}
          <div className="space-y-2.5 pt-2 border-t border-pink-100">
            <span className="text-xs font-bold text-nice-wine block">
              Grade Semanal de Horários (Segunda a Domingo):
            </span>

            <div className="space-y-2">
              {DAYS_OF_WEEK.map(({ key, name }) => {
                const daySchedule = formData.schedule_config?.[key] || {
                  open: "12:00",
                  close: "19:00",
                  closed: false,
                };
                const isClosed = Boolean(daySchedule.closed);

                return (
                  <div
                    key={key}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border transition-all ${
                      isClosed
                        ? "bg-gray-50/80 border-gray-200 opacity-80"
                        : "bg-pink-50/30 border-pink-200 shadow-sm"
                    }`}
                  >
                    {/* Nome do Dia e Toggle */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!isClosed}
                          onChange={(e) =>
                            handleUpdateDaySchedule(key, { closed: !e.target.checked })
                          }
                          className="w-4 h-4 rounded text-nice-pink focus:ring-nice-pink cursor-pointer"
                        />
                        <span
                          className={`text-xs font-extrabold ${
                            isClosed ? "text-gray-500 line-through" : "text-nice-wine"
                          }`}
                        >
                          {name}
                        </span>
                      </label>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          isClosed
                            ? "bg-gray-200 text-gray-600"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isClosed ? "Fechado" : "Aberto"}
                      </span>
                    </div>

                    {/* Inputs de Horário ou Mensagem de Fechado */}
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0">
                      {!isClosed ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500 font-bold">Abre:</span>
                            <input
                              type="time"
                              required
                              value={daySchedule.open || "12:00"}
                              onChange={(e) =>
                                handleUpdateDaySchedule(key, { open: e.target.value })
                              }
                              className="p-1.5 px-2 rounded-xl border border-pink-200 text-xs font-bold text-nice-wine bg-white focus:outline-none focus:ring-2 focus:ring-nice-pink"
                            />
                          </div>

                          <span className="text-gray-400 font-bold text-xs">-</span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500 font-bold">Fecha:</span>
                            <input
                              type="time"
                              required
                              value={daySchedule.close || "19:00"}
                              onChange={(e) =>
                                handleUpdateDaySchedule(key, { close: e.target.value })
                              }
                              className="p-1.5 px-2 rounded-xl border border-pink-200 text-xs font-bold text-nice-wine bg-white focus:outline-none focus:ring-2 focus:ring-nice-pink"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyScheduleToAll(key)}
                            className="p-1.5 px-2 text-[10px] font-bold text-nice-pink hover:bg-pink-100 rounded-xl transition flex items-center gap-1"
                            title="Copiar este horário para os demais dias da semana"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden sm:inline">Copiar</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          Sem expediente neste dia
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mensagem quando a Loja estiver Fechada */}
          <div className="pt-2 border-t border-pink-100">
            <label className="text-xs font-bold text-nice-wine block mb-1">
              Mensagem Personalizada de Loja Fechada:
            </label>
            <textarea
              rows={2}
              value={formData.closed_custom_message || ""}
              onChange={(e) => handleChange("closed_custom_message", e.target.value)}
              placeholder="Estamos fechados no momento. Nosso atendimento é de quarta a segunda, das 12h às 19h (terça-feira fechado)."
              className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40 bg-white"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">
              Esta mensagem é exibida para os clientes quando acessam a loja fora do horário de funcionamento.
            </span>
          </div>
        </div>

        {/* 4. CONTROLE DE EXIBIÇÃO DE ESTOQUE / ITENS ESGOTADOS */}
        <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-pink-50">
            <Settings className="w-5 h-5 text-nice-pink" />
            <div>
              <h3 className="font-bold text-nice-wine text-base">
                Comportamento de Itens Esgotados / Pausados
              </h3>
              <p className="text-xs text-gray-500">
                Escolha como os produtos pausados aparecem para os clientes no cardápio público
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                formData.stock_display_mode !== "sold_out"
                  ? "bg-nice-pink-light/60 border-nice-pink shadow-sm"
                  : "bg-white border-pink-100 hover:border-pink-200"
              }`}
            >
              <input
                type="radio"
                name="stock_display_mode"
                checked={formData.stock_display_mode !== "sold_out"}
                onChange={() => handleChange("stock_display_mode", "hide")}
                className="mt-0.5 text-nice-pink focus:ring-nice-pink"
              />
              <div>
                <span className="font-bold text-nice-wine block text-sm">
                  Ocultar Totalmente (Padrão)
                </span>
                <span className="text-gray-500 text-[11px] mt-0.5 block">
                  Assim que você pausar um produto ou todos os sabores dele, ele desaparece do cardápio imediatamente.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                formData.stock_display_mode === "sold_out"
                  ? "bg-nice-pink-light/60 border-nice-pink shadow-sm"
                  : "bg-white border-pink-100 hover:border-pink-200"
              }`}
            >
              <input
                type="radio"
                name="stock_display_mode"
                checked={formData.stock_display_mode === "sold_out"}
                onChange={() => handleChange("stock_display_mode", "sold_out")}
                className="mt-0.5 text-nice-pink focus:ring-nice-pink"
              />
              <div>
                <span className="font-bold text-nice-wine block text-sm">
                  Mostrar como Esgotado
                </span>
                <span className="text-gray-500 text-[11px] mt-0.5 block">
                  O produto continua visível com um selo cinza "Esgotado por hoje", mas sem botão de adicionar ao carrinho.
                </span>
              </div>
            </label>
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
