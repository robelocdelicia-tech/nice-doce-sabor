"use client";

import React, { useState, useMemo } from "react";
import { Coupon, Order, Category, Product } from "@/types";
import { formatCurrency, formatPhone } from "@/lib/utils";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Share2,
  MessageCircle,
  Copy,
  Calendar,
  Percent,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface CouponsManagerTabProps {
  coupons: Coupon[];
  onSaveCoupons: (coupons: Coupon[]) => void;
  orders: Order[];
  categories: Category[];
  products: Product[];
  storeDomain?: string;
}

export function CouponsManagerTab({
  coupons,
  onSaveCoupons,
  orders,
  categories,
  products,
  storeDomain = typeof window !== "undefined" ? window.location.origin : "https://nicedocesabor.com",
}: CouponsManagerTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSendWhatsAppOpen, setIsSendWhatsAppOpen] = useState(false);
  const [selectedCouponForBlast, setSelectedCouponForBlast] = useState<Coupon | null>(null);
  const [customerFilter, setCustomerFilter] = useState<"all" | "recent" | "inactive">("all");
  const [customBlastMessage, setCustomBlastMessage] = useState("");
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [selectedCouponForCard, setSelectedCouponForCard] = useState<Coupon | null>(null);

  // Formulário State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [scope, setScope] = useState<"all" | "category" | "product" | "delivery">("all");
  const [scopeCategoryId, setScopeCategoryId] = useState("");
  const [scopeProductIds, setScopeProductIds] = useState<string[]>([]);
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscountValue, setMaxDiscountValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimitTotal, setUsageLimitTotal] = useState("");
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState("1");
  const [firstPurchaseOnly, setFirstPurchaseOnly] = useState(false);
  const [orderTypeRestriction, setOrderTypeRestriction] = useState<"all" | "pickup" | "delivery">("all");
  const [showOnMenu, setShowOnMenu] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Calcula métricas de cada cupom a partir dos pedidos reais
  const couponStats = useMemo(() => {
    const stats: Record<string, { uses: number; totalDiscount: number; totalRevenue: number }> = {};

    coupons.forEach((c) => {
      stats[c.code] = { uses: 0, totalDiscount: 0, totalRevenue: 0 };
    });

    orders.forEach((o) => {
      if (o.status !== "cancelado" && o.coupon_code) {
        const cCode = o.coupon_code.toUpperCase();
        if (!stats[cCode]) {
          stats[cCode] = { uses: 0, totalDiscount: 0, totalRevenue: 0 };
        }
        stats[cCode].uses += 1;
        stats[cCode].totalDiscount += o.coupon_discount || o.discount || 0;
        stats[cCode].totalRevenue += o.total || 0;
      }
    });

    return stats;
  }, [coupons, orders]);

  // Extrai lista única de clientes dos pedidos reais para envio
  const customerList = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; lastOrderDate: Date; orderCount: number }>();

    orders.forEach((o) => {
      if (o.customer_phone) {
        const cleanPhone = o.customer_phone.replace(/\D/g, "");
        const existing = map.get(cleanPhone);
        const orderDate = new Date(o.created_at || Date.now());

        if (!existing) {
          map.set(cleanPhone, {
            name: o.customer_name || "Cliente",
            phone: cleanPhone,
            lastOrderDate: orderDate,
            orderCount: 1,
          });
        } else {
          if (orderDate > existing.lastOrderDate) {
            existing.lastOrderDate = orderDate;
            existing.name = o.customer_name || existing.name;
          }
          existing.orderCount += 1;
        }
      }
    });

    return Array.from(map.values());
  }, [orders]);

  // Clientes filtrados para a campanha
  const filteredCustomers = useMemo(() => {
    const now = new Date();
    return customerList.filter((c) => {
      const diffDays = Math.floor((now.getTime() - c.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (customerFilter === "recent") return diffDays <= 15;
      if (customerFilter === "inactive") return diffDays > 15;
      return true;
    });
  }, [customerList, customerFilter]);

  const handleOpenForm = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCode(coupon.code);
      setName(coupon.name);
      setDiscountType(
        coupon.discount_type === "percent" || coupon.discount_type === "percentage"
          ? "percentage"
          : "fixed"
      );
      setDiscountValue(String(coupon.discount_value));
      setScope(
        coupon.scope === "products" || coupon.scope === "product"
          ? "product"
          : (coupon.scope as "all" | "category" | "delivery")
      );
      setScopeCategoryId(coupon.scope_category_id || "");
      setScopeProductIds(coupon.scope_product_ids || []);
      setMinOrderValue(coupon.min_order_value ? String(coupon.min_order_value) : "");
      setMaxDiscountValue(coupon.max_discount_value ? String(coupon.max_discount_value) : "");
      setStartDate(coupon.start_date ? coupon.start_date.split("T")[0] : "");
      setEndDate(coupon.end_date ? coupon.end_date.split("T")[0] : "");
      setUsageLimitTotal(coupon.usage_limit_total ? String(coupon.usage_limit_total) : "");
      setUsageLimitPerCustomer(String(coupon.usage_limit_per_customer || 1));
      setFirstPurchaseOnly(Boolean(coupon.first_purchase_only));
      setOrderTypeRestriction(coupon.order_type_restriction || "all");
      setShowOnMenu(coupon.show_on_menu !== false);
      setIsActive(coupon.is_active !== false);
    } else {
      setEditingCoupon(null);
      setCode("");
      setName("");
      setDiscountType("percentage");
      setDiscountValue("10");
      setScope("all");
      setScopeCategoryId("");
      setScopeProductIds([]);
      setMinOrderValue("");
      setMaxDiscountValue("");
      setStartDate("");
      setEndDate("");
      setUsageLimitTotal("");
      setUsageLimitPerCustomer("1");
      setFirstPurchaseOnly(false);
      setOrderTypeRestriction("all");
      setShowOnMenu(true);
      setIsActive(true);
    }
    setIsFormOpen(true);
  };

  const generateRandomCode = () => {
    const prefixes = ["NICE", "DOCE", "SABOR", "AMOR", "FESTA", "ESPECIAL"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setCode(`${prefix}${num}`);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : `coupon_${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim() || code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      scope,
      scope_category_id: scopeCategoryId || undefined,
      scope_product_ids: scopeProductIds.length > 0 ? scopeProductIds : undefined,
      min_order_value: minOrderValue ? parseFloat(minOrderValue) : undefined,
      max_discount_value: maxDiscountValue ? parseFloat(maxDiscountValue) : undefined,
      start_date: startDate ? `${startDate}T00:00:00` : undefined,
      end_date: endDate ? `${endDate}T23:59:59` : undefined,
      usage_limit_total: usageLimitTotal ? parseInt(usageLimitTotal) : undefined,
      usage_limit_per_customer: parseInt(usageLimitPerCustomer) || 1,
      first_purchase_only: firstPurchaseOnly,
      order_type_restriction: orderTypeRestriction,
      show_on_menu: showOnMenu,
      is_active: isActive,
      created_at: editingCoupon?.created_at || new Date().toISOString(),
    };

    let updated: Coupon[];
    if (editingCoupon) {
      updated = coupons.map((c) => (c.id === editingCoupon.id ? newCoupon : c));
    } else {
      updated = [newCoupon, ...coupons];
    }

    onSaveCoupons(updated);
    setIsFormOpen(false);
  };

  const handleDeleteCoupon = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cupom de desconto?")) {
      const updated = coupons.filter((c) => c.id !== id);
      onSaveCoupons(updated);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = coupons.map((c) =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    );
    onSaveCoupons(updated);
  };

  const handleOpenWhatsAppBlast = (coupon: Coupon) => {
    setSelectedCouponForBlast(coupon);
    const discountText =
      coupon.discount_type === "percentage"
        ? `${coupon.discount_value}% OFF`
        : `${formatCurrency(coupon.discount_value)} de desconto`;
    const validText = coupon.end_date
      ? new Date(coupon.end_date).toLocaleDateString("pt-BR")
      : "tempo limitado";

    setCustomBlastMessage(
      `Oi {nome}! Preparei um presente especial para você da Confeitaria Nice Doce Sabor: use o cupom *{cupom}* e ganhe *{desconto}* no seu pedido! Válido até {data}.\n\nPeça com o desconto aplicado direto por aqui:\n{link}`
    );
    setIsSendWhatsAppOpen(true);
  };

  const handleOpenShareCard = (coupon: Coupon) => {
    setSelectedCouponForCard(coupon);
    setIsShareCardOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-nice-pink flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-nice-wine text-base sm:text-lg">
              Cupons de Desconto & Campanhas
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Crie promoções, cupons para primeira compra, divulgação no cardápio e envie para seus clientes no WhatsApp.
          </p>
        </div>

        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cupom</span>
        </button>
      </div>

      {/* Lista de Cupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const stats = couponStats[coupon.code] || { uses: 0, totalDiscount: 0, totalRevenue: 0 };
          const directLink = `${storeDomain}/?cupom=${coupon.code}`;

          return (
            <div
              key={coupon.id}
              className={`bg-white rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between shadow-card-3d ${
                coupon.is_active
                  ? "border-pink-100 hover:border-pink-300"
                  : "border-gray-200 opacity-60 bg-gray-50/70"
              }`}
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm sm:text-base px-3 py-1 rounded-xl bg-nice-wine text-nice-gold border border-pink-200 tracking-wider">
                      {coupon.code}
                    </span>
                    {coupon.show_on_menu && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-100 text-nice-pink">
                        Exibido no Menu
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleActive(coupon.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                      coupon.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {coupon.is_active ? "Ativo" : "Pausado"}
                  </button>
                </div>

                <h4 className="font-bold text-nice-wine text-sm mb-1">{coupon.name}</h4>
                <div className="flex items-baseline gap-1 text-nice-pink font-extrabold text-lg mb-2">
                  <span>
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}% OFF`
                      : `${formatCurrency(coupon.discount_value)} OFF`}
                  </span>
                  <span className="text-[11px] font-normal text-gray-500">
                    {coupon.scope === "delivery"
                      ? "no frete"
                      : coupon.scope === "category"
                      ? "na categoria"
                      : "no pedido"}
                  </span>
                </div>

                {/* Regras Compactas */}
                <div className="space-y-1 text-[11px] text-gray-500 bg-pink-50/50 p-2.5 rounded-xl border border-pink-100/60 mb-3">
                  {coupon.min_order_value ? (
                    <div>Mínimo: {formatCurrency(coupon.min_order_value)}</div>
                  ) : null}
                  {coupon.max_discount_value ? (
                    <div>Teto de desconto: {formatCurrency(coupon.max_discount_value)}</div>
                  ) : null}
                  {coupon.first_purchase_only ? (
                    <div className="text-nice-pink font-semibold">Apenas 1ª Compra</div>
                  ) : null}
                  {coupon.end_date ? (
                    <div>Válido até: {new Date(coupon.end_date).toLocaleDateString("pt-BR")}</div>
                  ) : (
                    <div>Validade: Indeterminada</div>
                  )}
                  {coupon.usage_limit_total ? (
                    <div>Limite total: {coupon.usage_limit_total} usos</div>
                  ) : null}
                </div>

                {/* Métricas Reais do Cupom */}
                <div className="grid grid-cols-3 gap-1 py-2 border-t border-pink-100 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Usos</span>
                    <span className="font-extrabold text-xs text-nice-wine">{stats.uses}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Economia</span>
                    <span className="font-extrabold text-xs text-emerald-600">
                      {formatCurrency(stats.totalDiscount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Faturou</span>
                    <span className="font-extrabold text-xs text-nice-pink">
                      {formatCurrency(stats.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-pink-100 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenShareCard(coupon)}
                    className="p-2 rounded-xl text-nice-gold hover:bg-amber-50 transition"
                    title="Ver Card de Divulgação (Instagram/Status)"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenWhatsAppBlast(coupon)}
                    className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
                    title="Enviar Cupom aos Clientes via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(directLink);
                      alert("Link copiado com sucesso! " + directLink);
                    }}
                    className="p-2 rounded-xl text-gray-500 hover:bg-pink-50 transition"
                    title="Copiar link direto com cupom aplicado"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenForm(coupon)}
                    className="p-2 rounded-xl text-gray-500 hover:text-nice-wine hover:bg-pink-50 transition"
                    title="Editar cupom"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Excluir cupom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: CADASTRO / EDIÇÃO DE CUPOM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-pink-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3 mb-4">
              <h3 className="font-bold text-nice-wine text-base">
                {editingCoupon ? "Editar Cupom de Desconto" : "Cadastrar Novo Cupom"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="overflow-y-auto space-y-4 flex-1 pr-1 text-xs">
              {/* Código e Gerador */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-nice-wine">
                  Código do Cupom *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex.: NICE10"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="flex-1 p-2.5 rounded-2xl border border-pink-200 uppercase font-mono tracking-wider text-nice-wine font-bold text-sm focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-3 py-2 rounded-2xl border border-pink-200 text-nice-wine hover:bg-pink-50 font-semibold"
                  >
                    Gerar Auto
                  </button>
                </div>
              </div>

              {/* Nome Interno */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-nice-wine">
                  Nome / Descrição Interna
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Desconto de Boas-Vindas aos Novos Clientes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                />
              </div>

              {/* Tipo e Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Tipo do Desconto
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Valor do Desconto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={discountType === "percentage" ? "10" : "15.00"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-bold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>
              </div>

              {/* Escopo de Aplicação */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-nice-wine">
                  Onde este cupom se aplica?
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                >
                  <option value="all">Pedido Inteiro (Subtotal)</option>
                  <option value="category">Em uma Categoria Específica</option>
                  <option value="delivery">Apenas na Taxa de Entrega / Frete</option>
                </select>
              </div>

              {scope === "category" && (
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Selecione a Categoria
                  </label>
                  <select
                    value={scopeCategoryId}
                    onChange={(e) => setScopeCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  >
                    <option value="">Escolha uma categoria...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mínimo e Teto */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Opcional (ex: 50)"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Desconto Máximo (Teto R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Opcional (ex: 30)"
                    value={maxDiscountValue}
                    onChange={(e) => setMaxDiscountValue(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>
              </div>

              {/* Datas de Validade */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Início da Validade
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Fim da Validade
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>
              </div>

              {/* Limites de Uso */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Limite Total de Usos
                  </label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={usageLimitTotal}
                    onChange={(e) => setUsageLimitTotal(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Usos por WhatsApp
                  </label>
                  <input
                    type="number"
                    value={usageLimitPerCustomer}
                    onChange={(e) => setUsageLimitPerCustomer(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>
              </div>

              {/* Checkboxes de Regras Especiais */}
              <div className="space-y-2 pt-2 border-t border-pink-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={firstPurchaseOnly}
                    onChange={(e) => setFirstPurchaseOnly(e.target.checked)}
                    className="w-4 h-4 text-nice-pink rounded border-pink-300 focus:ring-nice-pink"
                  />
                  <span className="font-semibold text-nice-wine">
                    Válido apenas na primeira compra do cliente
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnMenu}
                    onChange={(e) => setShowOnMenu(e.target.checked)}
                    className="w-4 h-4 text-nice-pink rounded border-pink-300 focus:ring-nice-pink"
                  />
                  <span className="font-semibold text-nice-wine">
                    Exibir faixa de destaque no cardápio público
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-nice-pink rounded border-pink-300 focus:ring-nice-pink"
                  />
                  <span className="font-semibold text-nice-wine">
                    Cupom ativo e pronto para uso
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-pink-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-full border border-pink-200 text-nice-wine font-semibold hover:bg-pink-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white font-bold shadow-md"
                >
                  Salvar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENVIO DE CUPOM EM MASSA / LISTA VIA WHATSAPP */}
      {isSendWhatsAppOpen && selectedCouponForBlast && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-pink-100 max-h-[90vh] flex flex-col text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-nice-wine text-base">
                    Enviar Cupom {selectedCouponForBlast.code} pelo WhatsApp
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Dispare mensagens personalizadas com 1 toque para seus clientes cadastrados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSendWhatsAppOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modelo da Mensagem Editável */}
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-nice-wine">
                Modelo da Mensagem (Suporta variáveis: &#123;nome&#125;, &#123;cupom&#125;, &#123;desconto&#125;, &#123;data&#125;, &#123;link&#125;)
              </label>
              <textarea
                rows={4}
                value={customBlastMessage}
                onChange={(e) => setCustomBlastMessage(e.target.value)}
                className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40 font-sans"
              />
            </div>

            {/* Filtro de Destinatários */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-nice-wine">Filtrar Clientes:</span>
              {[
                { id: "all", label: `Todos (${customerList.length})` },
                { id: "recent", label: "Recentes (≤15 dias)" },
                { id: "inactive", label: "Sem pedir há >15 dias" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCustomerFilter(f.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                    customerFilter === f.id
                      ? "bg-nice-wine text-white border-nice-wine"
                      : "bg-white text-gray-600 border-pink-100 hover:bg-pink-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista de Destinatários Prontos com Botão de Disparo */}
            <div className="overflow-y-auto max-h-60 space-y-2 border border-pink-100 rounded-2xl p-2 bg-pink-50/20 flex-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-center text-gray-400 py-6">
                  Nenhum cliente encontrado com este filtro.
                </p>
              ) : (
                filteredCustomers.map((c) => {
                  const discountFormatted =
                    selectedCouponForBlast.discount_type === "percentage"
                      ? `${selectedCouponForBlast.discount_value}% OFF`
                      : `${formatCurrency(selectedCouponForBlast.discount_value)} de desconto`;
                  const validDateFormatted = selectedCouponForBlast.end_date
                    ? new Date(selectedCouponForBlast.end_date).toLocaleDateString("pt-BR")
                    : "tempo limitado";
                  const directLink = `${storeDomain}/?cupom=${selectedCouponForBlast.code}`;

                  const finalMsg = customBlastMessage
                    .replace(/\{nome\}/g, c.name.split(" ")[0])
                    .replace(/\{cupom\}/g, selectedCouponForBlast.code)
                    .replace(/\{desconto\}/g, discountFormatted)
                    .replace(/\{data\}/g, validDateFormatted)
                    .replace(/\{link\}/g, directLink);

                  const waUrl = `https://wa.me/55${c.phone}?text=${encodeURIComponent(finalMsg)}`;

                  return (
                    <div
                      key={c.phone}
                      className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-pink-100 hover:border-pink-300 transition"
                    >
                      <div>
                        <span className="font-bold text-nice-wine block">{c.name}</span>
                        <span className="text-[11px] text-gray-500">
                          {formatPhone(c.phone)} • {c.orderCount} pedido(s)
                        </span>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Abrir WhatsApp</span>
                      </a>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-pink-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSendWhatsAppOpen(false)}
                className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CARD COMPARTILHÁVEL DO CUPOM (INSTAGRAM STORIES / STATUS) */}
      {isShareCardOpen && selectedCouponForCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-200 space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-2">
              <h3 className="font-bold text-nice-wine text-sm">
                Card de Divulgação do Cupom
              </h3>
              <button
                onClick={() => setIsShareCardOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual do Card Pronto para Print / Post */}
            <div
              id="coupon-share-card"
              className="relative rounded-3xl p-6 text-white text-center shadow-xl overflow-hidden border-2 border-nice-gold/40"
              style={{
                background:
                  "linear-gradient(135deg, #5B1F3A 0%, #3D1226 50%, #5B1F3A 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-nice-gold/10 rounded-full blur-2xl pointer-events-none" />

              <span className="text-[10px] uppercase font-bold tracking-widest text-nice-gold block">
                Nice Doce Sabor
              </span>
              <h4 className="font-script text-2xl text-nice-pink mt-0.5">Presente Especial</h4>

              <div className="my-4 py-3 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <span className="text-[10px] text-pink-200 uppercase tracking-wider block font-semibold">
                  Use o Cupom
                </span>
                <span className="font-mono font-extrabold text-2xl text-nice-gold tracking-widest block my-0.5">
                  {selectedCouponForCard.code}
                </span>
                <span className="text-xs font-bold text-white block">
                  {selectedCouponForCard.discount_type === "percentage"
                    ? `Ganhe ${selectedCouponForCard.discount_value}% DE DESCONTO`
                    : `Ganhe ${formatCurrency(selectedCouponForCard.discount_value)} DE DESCONTO`}
                </span>
              </div>

              <p className="text-[10px] text-pink-200 leading-tight">
                {selectedCouponForCard.min_order_value
                  ? `Válido em compras acima de ${formatCurrency(selectedCouponForCard.min_order_value)}.`
                  : "Válido em todo o cardápio digital."}
                {selectedCouponForCard.end_date
                  ? ` Até ${new Date(selectedCouponForCard.end_date).toLocaleDateString("pt-BR")}.`
                  : ""}
              </p>

              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-center gap-1.5 text-[11px] text-white/90 font-medium">
                <span>Peça pelo link na bio ou no WhatsApp</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `Cupom Especial: ${selectedCouponForCard.code} (${
                      selectedCouponForCard.discount_type === "percentage"
                        ? `${selectedCouponForCard.discount_value}% OFF`
                        : `${formatCurrency(selectedCouponForCard.discount_value)} OFF`
                    }) no cardápio: ${storeDomain}/?cupom=${selectedCouponForCard.code}`
                  );
                  alert("Texto promocional copiado para colar no Instagram ou WhatsApp!");
                }}
                className="flex-1 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Texto & Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
