"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Store, Order, OrderItem, Neighborhood, DeliveryAddress } from "@/types";
import { formatCurrency, formatPhone, cleanPhoneForWhatsApp } from "@/lib/utils";
import {
  X,
  ArrowLeft,
  Check,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  Truck,
  Tag,
  Loader2,
} from "lucide-react";
import { Coupon } from "@/types";

interface CheckoutModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ store, isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("14:00");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "card">("pix");
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Estados de Entrega / Bairros
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [reference, setReference] = useState("");

  // Estados de Cupom de Desconto
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calcula a taxa de entrega e total geral com desconto de cupom
  const selectedNeighborhood = neighborhoods.find((n) => n.id === selectedNeighborhoodId);
  const deliveryFee = orderType === "delivery" ? (selectedNeighborhood?.delivery_fee || 0) : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  const handleApplyCoupon = async (codeToValidate?: string) => {
    const code = (codeToValidate || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponMessage({ type: "error", text: "Digite o código do cupom." });
      return;
    }
    setCouponLoading(true);
    setCouponMessage(null);

    try {
      let clientCoupons: Coupon[] = [];
      try {
        const saved = localStorage.getItem("nice_custom_coupons");
        if (saved) clientCoupons = JSON.parse(saved);
      } catch (e) {}

      const payload = {
        code,
        customer_phone: customerPhone ? cleanPhoneForWhatsApp(customerPhone) : undefined,
        order_type: orderType,
        items: items.map((i) => ({
          product_id: i.product.id,
          category_id: i.product.category_id,
          quantity: i.quantity,
          total_price: i.total_price,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        client_coupons: clientCoupons,
      };

      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.valid) {
        const discountVal = Number(data.discount_amount ?? data.discount ?? 0);
        setAppliedCoupon(data.coupon);
        setCouponDiscount(discountVal);
        setCouponMessage({
          type: "success",
          text: `Cupom ${data.coupon.code} aplicado! Desconto de ${formatCurrency(discountVal)}.`,
        });
        localStorage.setItem("nice_active_coupon", data.coupon.code);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponMessage({ type: "error", text: data.message || "Cupom inválido ou expirado." });
      }
    } catch (err) {
      setCouponMessage({ type: "error", text: "Erro ao validar cupom. Tente novamente." });
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    try {
      const savedNh = localStorage.getItem("nice_neighborhoods");
      if (savedNh) {
        setNeighborhoods(JSON.parse(savedNh));
      }
      const activeCode = localStorage.getItem("nice_active_coupon");
      if (activeCode) {
        setCouponInput(activeCode);
        handleApplyCoupon(activeCode);
      }
    } catch (e) {
      console.error("Erro ao carregar dados locais:", e);
    }
  }, [isOpen]);

  // Recálculo automático fluido se o carrinho mudar com cupom já aplicado
  useEffect(() => {
    if (appliedCoupon && isOpen) {
      handleApplyCoupon(appliedCoupon.code);
    }
  }, [subtotal, deliveryFee, orderType]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponMessage(null);
    setCouponInput("");
    localStorage.removeItem("nice_active_coupon");
  };

  if (!isOpen) return null;

  // Calcula a antecedência máxima necessária entre todos os itens do carrinho
  const maxLeadTimeHours = items.reduce(
    (max, item) => Math.max(max, item.product.lead_time_hours || 0),
    0
  );

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) {
      setCustomerPhone(digits);
    } else if (digits.length <= 7) {
      setCustomerPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else {
      setCustomerPhone(
        `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      );
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!customerName.trim()) {
      setErrorMsg("Por favor, informe seu nome completo.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }

    if (orderType === "delivery") {
      if (!selectedNeighborhoodId) {
        setErrorMsg("Por favor, selecione seu bairro para entrega.");
        return;
      }
      if (!street.trim()) {
        setErrorMsg("Por favor, informe a rua / avenida da entrega.");
        return;
      }
      if (!addressNumber.trim()) {
        setErrorMsg("Por favor, informe o número da sua residência.");
        return;
      }
    }

    if (paymentMethod === "cash" && cashChangeFor) {
      const changeVal = parseFloat(cashChangeFor.replace(",", "."));
      if (changeVal < grandTotal) {
        setErrorMsg(`O valor para troco deve ser maior que o total (${formatCurrency(grandTotal)}).`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Validação server-side de disponibilidade antes de fechar o pedido
      try {
        const availCheck = await fetch("/api/products/validate-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              product_id: i.product.id,
              variation_name: i.selected_variation?.name,
            })),
          }),
        });
        const availData = await availCheck.json();
        if (!availData.valid) {
          const names = (availData.unavailable_items || []).map((u: any) => u.name).join(", ");
          setErrorMsg(`Atenção: Os seguintes itens esgotaram: ${names}. Por favor, ajuste seu pedido.`);
          setIsSubmitting(false);
          return;
        }
      } catch (availErr) {
        console.warn("Validação remota indisponível, prosseguindo com validação local.");
      }

      // Gera número de pedido sequencial amigável
      const randomSequentialNumber = Math.floor(1000 + Math.random() * 9000);
      const newOrderId = `order_${Date.now()}_${randomSequentialNumber}`;

      const orderItems: OrderItem[] = items.map((i) => ({
        product_id: i.product.id,
        product_name: i.product.name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        selected_variation: i.selected_variation,
        selected_addons: i.selected_addons,
        custom_notes: i.custom_notes,
        total_price: i.total_price,
      }));

      const deliveryAddressObj: DeliveryAddress | null =
        orderType === "delivery"
          ? {
              street: street.trim(),
              number: addressNumber.trim(),
              complement: complement.trim() || undefined,
              reference: reference.trim() || undefined,
              neighborhood: selectedNeighborhood?.name || "",
            }
          : null;

      const cashTenderedVal = cashChangeFor ? parseFloat(cashChangeFor.replace(",", ".")) : null;
      const changeDueVal = cashTenderedVal ? Math.max(0, cashTenderedVal - grandTotal) : null;

      const newOrder: Order = {
        id: newOrderId,
        order_number: randomSequentialNumber,
        customer_name: customerName.trim(),
        customer_phone: cleanPhoneForWhatsApp(customerPhone),
        order_type: orderType,
        origin: "online",
        scheduled_for: pickupDate ? `${pickupDate}T${pickupTime}:00` : null,
        neighborhood_name: selectedNeighborhood?.name || null,
        delivery_address: deliveryAddressObj,
        delivery_fee: deliveryFee,
        subtotal: subtotal,
        coupon_code: appliedCoupon?.code || null,
        coupon_discount: couponDiscount,
        discount: couponDiscount,
        applied_coupon: appliedCoupon || null,
        total: grandTotal,
        payment_method: paymentMethod,
        payment_status: "pending",
        cash_change_for: cashTenderedVal,
        cash_tendered: cashTenderedVal,
        change_due: changeDueVal,
        order_status: "received",
        notes: generalNotes.trim() || null,
        is_printed: false,
        created_at: new Date().toISOString(),
        items: orderItems,
      };

      // Salva no localStorage (persistência resiliente)
      const existingOrdersJson = localStorage.getItem("nice_orders");
      const existingOrders: Order[] = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
      localStorage.setItem("nice_orders", JSON.stringify([newOrder, ...existingOrders]));

      // Tenta enviar para a API/Supabase em segundo plano
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newOrder),
        });
      } catch (err) {
        console.warn("API de sincronização em segundo plano não respondeu, pedido persistido localmente.");
      }

      // Limpa cupom ativo após fechar o pedido
      localStorage.removeItem("nice_active_coupon");

      // Limpa carrinho e redireciona para a página de confirmação/PIX
      clearCart();
      onClose();
      router.push(`/pedido/${newOrderId}`);
    } catch (err) {
      console.error("Erro ao criar pedido:", err);
      setErrorMsg("Ocorreu um erro ao processar seu pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg max-h-[95vh] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col relative border-t sm:border border-pink-100 animate-in slide-in-from-bottom duration-300">
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-pink-100 flex items-center justify-between bg-[#FFF8FC]">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-nice-wine transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-nice-wine text-base sm:text-lg">
                Finalizar Pedido
              </h2>
              <p className="text-xs text-nice-pink font-medium">
                Nice Doce Sabor • Recife-PE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-pink-100 text-gray-500 hover:text-nice-wine transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de Checkout */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
              {errorMsg}
            </div>
          )}

          {/* Dados do Cliente */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nice-wine flex items-center gap-1.5">
              <span>1. Seus Dados de Contato</span>
            </h3>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Maria Albuquerque"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">
                  WhatsApp (para contato e status) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(81) 98888-0000"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Pedido: Retirada no Local ou Entrega */}
          <div className="space-y-3 pt-2 border-t border-pink-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nice-wine">
              2. Forma de Atendimento
            </h3>

            {store.delivery_enabled ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("pickup")}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    orderType === "pickup"
                      ? "border-nice-pink bg-nice-pink-light/60 text-nice-wine font-bold shadow-sm"
                      : "border-pink-100 bg-white text-gray-600 hover:border-pink-200"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${orderType === "pickup" ? "bg-nice-pink text-white" : "bg-pink-50 text-nice-pink"}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs">Retirada</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Grátis</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType("delivery")}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    orderType === "delivery"
                      ? "border-nice-pink bg-nice-pink-light/60 text-nice-wine font-bold shadow-sm"
                      : "border-pink-100 bg-white text-gray-600 hover:border-pink-200"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${orderType === "delivery" ? "bg-nice-pink text-white" : "bg-pink-50 text-nice-pink"}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs">Entrega (Delivery)</span>
                    <span className="text-[10px] text-nice-pink font-semibold">Taxa por bairro</span>
                  </div>
                </button>
              </div>
            ) : null}

            {orderType === "pickup" ? (
              <div className="p-3.5 rounded-2xl border-2 border-nice-pink bg-nice-pink-light/40 flex items-start gap-3">
                <div className="p-2 bg-nice-pink text-white rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-nice-wine block text-sm">
                    Retirada no Local
                  </span>
                  <p className="text-gray-600 mt-0.5">{store.pickup_address}</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Sem taxa de entrega (Grátis)
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3.5 bg-pink-50/50 rounded-2xl border border-pink-200">
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">
                    Selecione seu Bairro (Recife) *
                  </label>
                  <select
                    required
                    value={selectedNeighborhoodId}
                    onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-pink-200 text-xs sm:text-sm text-nice-wine bg-white focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  >
                    <option value="">Selecione o bairro...</option>
                    {neighborhoods
                      .filter((n) => n.is_active)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} — Taxa: {n.delivery_fee === 0 ? "Grátis" : formatCurrency(n.delivery_fee)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[11px] text-gray-700 font-bold block mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex.: Rua dos Navegantes"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-700 font-bold block mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex.: 1024"
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-gray-600 font-medium block mb-1">
                      Complemento (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Apto 402, Bloco B"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 font-medium block mb-1">
                      Ponto de Referência
                    </label>
                    <input
                      type="text"
                      placeholder="Próximo à pracinha"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {!store.delivery_enabled && (
              <p className="text-[11px] text-gray-500 italic px-1">
                * No momento a confeitaria está operando com retirada no local.
              </p>
            )}
          </div>

          {/* Agendamento / Encomenda */}
          {maxLeadTimeHours > 0 && (
            <div className="space-y-3 pt-2 border-t border-pink-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-nice-pink" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-nice-wine">
                  3. Data & Horário Desejados
                </h3>
              </div>
              <p className="text-[11px] text-nice-wine/70">
                Este pedido contém itens sob encomenda com antecedência mínima de{" "}
                <span className="font-bold text-nice-pink">{maxLeadTimeHours}h</span>.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-1 focus:ring-nice-pink"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Horário (12h às 19h)</label>
                  <input
                    type="time"
                    min="12:00"
                    max="19:00"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-1 focus:ring-nice-pink"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          <div className="space-y-2 pt-2 border-t border-pink-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nice-wine">
              4. Forma de Pagamento
            </h3>

            <div className="space-y-2">
              {/* PIX Direto */}
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs sm:text-sm transition-all ${
                  paymentMethod === "pix"
                    ? "border-nice-pink bg-nice-pink-light/60 font-semibold text-nice-wine shadow-sm"
                    : "border-pink-100 bg-white text-gray-700 hover:border-pink-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold block">PIX Direto (Chave e QR Code)</span>
                    <span className="text-[11px] text-gray-500">
                      Você copia a chave e manda o comprovante no WhatsApp
                    </span>
                  </div>
                </div>
                {paymentMethod === "pix" && <Check className="w-4 h-4 text-nice-pink stroke-[3]" />}
              </button>

              {/* Dinheiro */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs sm:text-sm transition-all ${
                  paymentMethod === "cash"
                    ? "border-nice-pink bg-nice-pink-light/60 font-semibold text-nice-wine shadow-sm"
                    : "border-pink-100 bg-white text-gray-700 hover:border-pink-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold block">Dinheiro (na retirada)</span>
                    <span className="text-[11px] text-gray-500">
                      Informe se precisará de troco
                    </span>
                  </div>
                </div>
                {paymentMethod === "cash" && <Check className="w-4 h-4 text-nice-pink stroke-[3]" />}
              </button>

              {paymentMethod === "cash" && (
                <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                  <label className="text-[11px] text-nice-wine font-medium block mb-1">
                    Precisa de troco para quanto? (Deixe em branco se for valor exato)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: 150,00"
                    value={cashChangeFor}
                    onChange={(e) => setCashChangeFor(e.target.value)}
                    className="w-full p-2 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-1 focus:ring-nice-pink"
                  />
                </div>
              )}

              {/* Cartão */}
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs sm:text-sm transition-all ${
                  paymentMethod === "card"
                    ? "border-nice-pink bg-nice-pink-light/60 font-semibold text-nice-wine shadow-sm"
                    : "border-pink-100 bg-white text-gray-700 hover:border-pink-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold block">Cartão de Crédito ou Débito</span>
                    <span className="text-[11px] text-gray-500">
                      Passar maquininha na retirada
                    </span>
                  </div>
                </div>
                {paymentMethod === "card" && <Check className="w-4 h-4 text-nice-pink stroke-[3]" />}
              </button>
            </div>
          </div>

          {/* Observações Gerais */}
          <div className="space-y-1.5 pt-2 border-t border-pink-100">
            <label className="text-xs font-bold uppercase tracking-wider text-nice-wine">
              Alguma observação geral para o pedido?
            </label>
            <textarea
              rows={2}
              placeholder="Ex.: Embalar para presente, ligar antes de vir buscar, etc."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
            />
          </div>

          {/* Seção de Cupom de Desconto */}
          <div className="space-y-2 pt-2 border-t border-pink-100">
            <label className="text-xs font-bold uppercase tracking-wider text-nice-wine flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-nice-pink" />
              <span>Tem cupom de desconto?</span>
            </label>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <span className="font-bold text-xs text-emerald-900 uppercase tracking-wide">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      Economia de {formatCurrency(couponDiscount)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex.: NICE10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 p-2.5 rounded-2xl border border-pink-200 text-xs sm:text-sm uppercase font-mono tracking-wider text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {couponLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </button>
                </div>

                {couponMessage && (
                  <p
                    className={`text-xs ${
                      couponMessage.type === "success" ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="p-4 bg-gradient-to-r from-nice-pink-light/60 to-pink-50 rounded-2xl border border-pink-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} itens)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {appliedCoupon && couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Desconto ({appliedCoupon.code})</span>
                <span>- {formatCurrency(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Taxa de Entrega</span>
              <span className={orderType === "delivery" && deliveryFee > 0 ? "text-nice-pink font-bold" : "text-emerald-700 font-semibold"}>
                {orderType === "delivery"
                  ? selectedNeighborhood
                    ? deliveryFee === 0
                      ? "Grátis"
                      : formatCurrency(deliveryFee)
                    : "Selecione o bairro"
                  : "Grátis (Retirada)"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-nice-wine pt-1 border-t border-pink-200">
              <span>Total a Pagar</span>
              <span className="text-nice-pink text-base">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Botão Finalizar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white font-bold text-sm sm:text-base shadow-luxury flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Gravando seu pedido...</span>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar e Ver Chave PIX</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Seu pedido é gravado no sistema com número exclusivo e comanda para impressão.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
