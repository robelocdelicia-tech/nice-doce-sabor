"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Product, StockMovement, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  getStockMovements,
  addStockEntry,
  adjustOrLossStock,
  getStockAnalytics,
} from "@/lib/stockManager";
import {
  Package,
  Plus,
  Minus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  Download,
  X,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface StockManagerTabProps {
  products: Product[];
  categories: Category[];
  onSaveProduct: (product: Product) => void;
}

export function StockManagerTab({
  products,
  categories,
  onSaveProduct,
}: StockManagerTabProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"today" | "7d" | "month" | "all">("month");
  const [filterType, setFilterType] = useState<"all" | "entry" | "sale" | "adjustment">("all");

  // Modal de Entrada Rápida
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [entryQuantity, setEntryQuantity] = useState("5");
  const [entryReason, setEntryReason] = useState("Produção do dia");

  // Modal de Saída / Ajuste Rápido
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [lossProductId, setLossProductId] = useState("");
  const [lossQuantity, setLossQuantity] = useState("1");
  const [lossType, setLossType] = useState<"adjustment" | "loss">("loss");
  const [lossReason, setLossReason] = useState("Validade / Avaria");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadMovements = () => {
    setMovements(getStockMovements());
  };

  useEffect(() => {
    loadMovements();
    window.addEventListener("stock_update", loadMovements);
    return () => window.removeEventListener("stock_update", loadMovements);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Estatísticas gerais
  const analytics = useMemo(() => {
    return getStockAnalytics(products);
  }, [products, movements]);

  // Produtos filtrados para exibição na tabela de saldo
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.is_archived) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = categories.find((c) => c.id === p.category_id)?.name.toLowerCase().includes(q);
      return matchName || matchCat;
    });
  }, [products, categories, searchQuery]);

  // Movimentações filtradas
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return movements.filter((m) => {
      const mDate = new Date(m.created_at);
      const mDateStr = m.created_at.split("T")[0];

      // Filtro de tipo
      if (filterType !== "all") {
        if (filterType === "adjustment" && m.type !== "adjustment" && m.type !== "loss") return false;
        if (filterType !== "adjustment" && m.type !== filterType) return false;
      }

      // Filtro de período
      if (filterPeriod === "today") {
        if (mDateStr !== todayStr) return false;
      } else if (filterPeriod === "7d") {
        const diffDays = (now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      } else if (filterPeriod === "month") {
        if (mDate.getMonth() !== now.getMonth() || mDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      // Busca por nome
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProd = m.product_name.toLowerCase().includes(q);
        const matchReason = (m.reason || "").toLowerCase().includes(q);
        return matchProd || matchReason;
      }

      return true;
    });
  }, [movements, filterPeriod, filterType, searchQuery]);

  // Executa Entrada de Estoque
  const handleConfirmEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(entryQuantity);
    if (!selectedProductId || isNaN(qty) || qty <= 0) return;

    const res = addStockEntry(selectedProductId, qty, entryReason, selectedFlavor || undefined);
    if (res.success) {
      showToast(res.message);
      setIsEntryModalOpen(false);
      setEntryQuantity("5");
      setSelectedFlavor("");
      loadMovements();
    }
  };

  // Executa Saída Manual / Ajuste
  const handleConfirmLoss = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(lossQuantity);
    if (!lossProductId || isNaN(qty) || qty <= 0) return;

    const res = adjustOrLossStock(lossProductId, -qty, lossType, lossReason);
    if (res.success) {
      showToast(res.message);
      setIsLossModalOpen(false);
      setLossQuantity("1");
      loadMovements();
    }
  };

  const handleOpenEntryForProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setSelectedFlavor("");
    setEntryQuantity("5");
    setEntryReason("Produção do dia");
    setIsEntryModalOpen(true);
  };

  const handleOpenLossForProduct = (prod: Product) => {
    setLossProductId(prod.id);
    setLossQuantity("1");
    setLossReason("Ajuste de inventário");
    setIsLossModalOpen(true);
  };

  // Exportar histórico em CSV
  const handleExportMovementsCSV = () => {
    if (movements.length === 0) {
      alert("Nenhuma movimentação de estoque registrada para exportar.");
      return;
    }

    const headers = [
      "Data e Hora",
      "Tipo",
      "Produto",
      "Sabor",
      "Quantidade",
      "Saldo Anterior",
      "Novo Saldo",
      "Motivo / Pedido",
    ];

    const rows = movements.map((m) => [
      new Date(m.created_at).toLocaleString("pt-BR"),
      m.type === "entry" ? "Entrada" : m.type === "sale" ? "Saída por Venda" : "Ajuste / Perda",
      `"${m.product_name.replace(/"/g, '""')}"`,
      m.variation_name ? `"${m.variation_name.replace(/"/g, '""')}"` : "-",
      m.quantity,
      m.previous_stock,
      m.new_stock,
      `"${(m.reason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estoque_movimentacoes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentSelectedProd = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Topo do Módulo */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-nice-pink flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-nice-wine text-base sm:text-lg">
              Controle de Estoque & Movimentações
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cadastre quantas unidades entraram da produção, veja baixas automáticas das vendas e acompanhe o relatório de saídas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportMovementsCSV}
            className="px-4 py-2.5 rounded-full border border-pink-200 text-nice-wine hover:bg-pink-50 text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-nice-pink" />
            <span>Exportar Relatório (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProductId(products[0]?.id || "");
              setIsEntryModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Entrada</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO DO ESTOQUE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
            Saldo Total em Estoque
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-nice-wine">
              {analytics.totalItemsInStock}
            </span>
            <span className="text-xs text-gray-400 font-semibold">unidades</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Entradas no Mês</span>
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              +{analytics.monthEntriesCount}
            </span>
            <span className="text-xs text-gray-400 font-semibold">un</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-pink-200 shadow-sm">
          <span className="text-[10px] font-bold text-nice-pink uppercase tracking-wide flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Saídas / Vendidos</span>
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-nice-pink">
              -{analytics.monthSalesCount}
            </span>
            <span className="text-xs text-gray-400 font-semibold">un</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Estoque Baixo</span>
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {analytics.lowStockCount}
            </span>
            <span className="text-xs text-gray-400 font-semibold">itens</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide block">
            Esgotados / Zerados
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black text-rose-600">
              {analytics.outOfStockCount}
            </span>
            <span className="text-xs text-gray-400 font-semibold">itens</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: TABELA DE SALDO ATUAL POR PRODUTO */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-nice-wine text-base">
              Saldo de Estoque por Produto
            </h4>
            <p className="text-xs text-gray-500">
              Adicione entradas da produção com 1 clique ou faça ajustes rápidos
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-pink-100 text-[10px] uppercase font-bold text-gray-400">
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-center">Status Estoque</th>
                <th className="py-2.5 px-3 text-center">Saldo Atual</th>
                <th className="py-2.5 px-3 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {filteredProducts.map((p) => {
                const isControlled = p.stock_control_enabled || typeof p.current_stock === "number";
                const stock = p.current_stock ?? 0;
                const minAlert = p.min_stock_alert ?? 2;
                const catName = categories.find((c) => c.id === p.category_id)?.name || "Geral";

                const isOutOfStock = isControlled && stock === 0;
                const isLowStock = isControlled && stock > 0 && stock <= minAlert;

                return (
                  <tr key={p.id} className="hover:bg-pink-50/40 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100">
                          <Image
                            src={p.images?.[0] || "/logo.jpg"}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-nice-wine block">{p.name}</span>
                          <span className="text-[10px] text-gray-400">
                            {formatCurrency(p.base_price)}
                            {p.variations && p.variations.length > 0
                              ? ` • ${p.variations.length} sabor(es)`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-gray-600 font-medium">
                      {catName}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {!isControlled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                          Venda Livre (Sem Limite)
                        </span>
                      ) : isOutOfStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          🚨 Esgotado (0 un)
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Estoque Baixo (≤{minAlert})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🟢 Em Estoque
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isControlled ? (
                        <div className="inline-flex items-baseline gap-1 font-black text-sm text-nice-wine bg-pink-50 px-3 py-1 rounded-xl border border-pink-100">
                          <span>{stock}</span>
                          <span className="text-[10px] font-normal text-gray-400">un</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px] font-medium">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEntryForProduct(p)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 flex items-center gap-1 transition active:scale-95"
                          title="Registrar entrada de produção"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Entrada</span>
                        </button>

                        {isControlled && (
                          <button
                            type="button"
                            onClick={() => handleOpenLossForProduct(p)}
                            className="px-2.5 py-1.5 rounded-xl border border-pink-200 text-gray-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition active:scale-95"
                            title="Ajuste manual ou perda"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 2: RELATÓRIO COMPLETO DE MOVIMENTAÇÕES (ENTRADAS E SAÍDAS) */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-nice-wine text-base">
              Relatório de Entradas & Saídas
            </h4>
            <p className="text-xs text-gray-500">
              Histórico detalhado de produção, vendas no cardápio/PDV e baixas de estoque
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Tipo */}
            <div className="flex items-center bg-pink-50 border border-pink-200 rounded-xl p-0.5 text-xs font-semibold">
              {[
                { id: "all", label: "Todas" },
                { id: "entry", label: "Entradas (+)" },
                { id: "sale", label: "Saídas Venda (-)" },
                { id: "adjustment", label: "Ajustes" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterType === f.id
                      ? "bg-nice-wine text-white shadow-sm"
                      : "text-gray-600 hover:text-nice-wine"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Filtro de Período */}
            <div className="flex items-center bg-pink-50 border border-pink-200 rounded-xl p-0.5 text-xs font-semibold">
              {[
                { id: "today", label: "Hoje" },
                { id: "7d", label: "7 dias" },
                { id: "month", label: "Mês atual" },
                { id: "all", label: "Tudo" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilterPeriod(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterPeriod === p.id
                      ? "bg-nice-wine text-white shadow-sm"
                      : "text-gray-600 hover:text-nice-wine"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        {filteredMovements.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-pink-200" />
            <p className="text-xs">Nenhuma movimentação encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-pink-100 text-[10px] uppercase font-bold text-gray-400">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Produto & Sabor</th>
                  <th className="py-2.5 px-3 text-center">Qtd Movimentada</th>
                  <th className="py-2.5 px-3 text-center">Evolução do Saldo</th>
                  <th className="py-2.5 px-3">Motivo / Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {filteredMovements.map((m) => {
                  const isEntry = m.type === "entry";
                  const isSale = m.type === "sale";

                  return (
                    <tr key={m.id} className="hover:bg-pink-50/40 transition">
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </td>

                      <td className="py-3 px-3">
                        {isEntry ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>Entrada</span>
                          </span>
                        ) : isSale ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-nice-pink">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Saída (Venda)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <span>Ajuste / Perda</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-nice-wine block">{m.product_name}</span>
                        {m.variation_name && (
                          <span className="text-[10px] text-gray-400">
                            Sabor: {m.variation_name}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-black text-xs ${
                            isEntry
                              ? "text-emerald-600"
                              : isSale
                              ? "text-nice-pink"
                              : "text-amber-700"
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} un
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center text-gray-500 font-semibold text-[11px]">
                        <span>{m.previous_stock} un</span>
                        <span className="mx-1.5 text-gray-300">➔</span>
                        <span className="font-bold text-nice-wine">{m.new_stock} un</span>
                      </td>

                      <td className="py-3 px-3 text-gray-600 font-medium">
                        {m.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRAR ENTRADA DE PRODUÇÃO */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-nice-wine text-base">
                    Registrar Entrada de Estoque
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Adicione itens finalizados da sua produção ao cardápio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEntry} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-nice-wine">
                  Produto que entrou no estoque *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setSelectedFlavor("");
                  }}
                  className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                >
                  <option value="">Selecione o produto...</option>
                  {products
                    .filter((p) => !p.is_archived)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Atual: {p.current_stock ?? "Livre"} un)
                      </option>
                    ))}
                </select>
              </div>

              {currentSelectedProd?.variations && currentSelectedProd.variations.length > 0 && (
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Sabor / Variação Específica (Opcional)
                  </label>
                  <select
                    value={selectedFlavor}
                    onChange={(e) => setSelectedFlavor(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  >
                    <option value="">Entrada para o produto todo</option>
                    {currentSelectedProd.variations.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Quantidade Feita *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ex.: 5"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-black text-sm focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Motivo / Lote
                  </label>
                  <input
                    type="text"
                    value={entryReason}
                    onChange={(e) => setEntryReason(e.target.value)}
                    placeholder="Ex.: Produção matinal"
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-medium focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-pink-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-pink-200 text-nice-wine font-semibold hover:bg-pink-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  Salvar Entrada (+{entryQuantity})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR SAÍDA MANUAL / PERDA / AJUSTE */}
      {isLossModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Minus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-nice-wine text-base">
                    Baixa Manual ou Ajuste de Estoque
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Registre perdas, avarias ou correções de contagem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLossModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmLoss} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-nice-wine">
                  Tipo de Operação
                </label>
                <select
                  value={lossType}
                  onChange={(e) => setLossType(e.target.value as any)}
                  className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                >
                  <option value="loss">Perda / Avaria / Vencido</option>
                  <option value="adjustment">Ajuste de Contagem / Inventário</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Quantidade a Subtrair *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ex.: 1"
                    value={lossQuantity}
                    onChange={(e) => setLossQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-rose-600 font-black text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Motivo Detalhado
                  </label>
                  <input
                    type="text"
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    placeholder="Ex.: Consumo interno"
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-medium focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-pink-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLossModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-pink-200 text-nice-wine font-semibold hover:bg-pink-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition"
                >
                  Confirmar Baixa (-{lossQuantity})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
