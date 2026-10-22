"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Product, ProductVariation, Category, Order, OrderItem, Store, Coupon } from "@/types";
import { formatCurrency, formatPhone, cleanPhoneForWhatsApp } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Receipt,
  User,
  Phone,
  FileText,
  DollarSign,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface POSRegisterTabProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onSaveOrder: (newOrder: Order) => void;
  store: Store;
  coupons?: Coupon[];
}

export function POSRegisterTab({
  products,
  categories,
  orders,
  onSaveOrder,
  store,
  coupons = [],
}: POSRegisterTabProps) {
  // Estados do PDV
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<
    {
      product: Product;
      variation?: ProductVariation;
      quantity: number;
      custom_notes?: string;
    }[]
  >([]);

  // Dados do Cliente
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Tipo do Pedido e Pagamento
  const [orderSubtype, setOrderSubtype] = useState<"consumo_local" | "retirada" | "encomenda">("consumo_local");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "card" | "fiado">("cash");
  const [isPaidNow, setIsPaidNow] = useState(true);
  const [cashTendered, setCashTendered] = useState("");
  const [manualDiscount, setManualDiscount] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [orderNotes, setOrderNotes] = useState("");

  // Modal de Seleção de Variação/Sabor
  const [variationModalProduct, setVariationModalProduct] = useState<Product | null>(null);

  // Modal de Conclusão / Comprovante
  const [finishedOrder, setFinishedOrder] = useState<Order | null>(null);

  // Modal de Fechamento de Caixa
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);

  // Filtra apenas produtos DISPONÍVEIS (não pausados e não arquivados)
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.is_archived || p.is_paused) return false;
      // Se todos os sabores estão pausados, oculta
      if (p.variations && p.variations.length > 0 && p.variations.every((v) => v.is_paused)) {
        return false;
      }
      if (selectedCategoryId !== "all" && p.category_id !== selectedCategoryId) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchFlavors = p.variations && p.variations.some((v) => v.name.toLowerCase().includes(q));
      return matchName || matchDesc || matchFlavors;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Cálculos Financeiros do Carrinho do PDV
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const price = item.variation ? item.variation.price : item.product.base_price;
      return acc + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const manualDiscountVal = parseFloat(manualDiscount.replace(",", ".")) || 0;
  const totalDiscount = couponDiscount + manualDiscountVal;
  const totalPayable = Math.max(0, subtotal - totalDiscount);

  // Troco
  const cashTenderedVal = parseFloat(cashTendered.replace(",", ".")) || 0;
  const changeDue = paymentMethod === "cash" && cashTenderedVal > totalPayable ? cashTenderedVal - totalPayable : 0;

  // Adicionar produto
  const handleProductClick = (product: Product) => {
    if (product.variations && product.variations.length > 0) {
      setVariationModalProduct(product);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product, variation?: ProductVariation) => {
    setCartItems((prev) => {
      const index = prev.findIndex(
        (i) => i.product.id === product.id && i.variation?.name === variation?.name
      );
      if (index >= 0) {
        const copy = [...prev];
        copy[index].quantity += 1;
        return copy;
      } else {
        return [...prev, { product, variation, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      copy[index].quantity += delta;
      if (copy[index].quantity <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyCoupon = () => {
    const code = appliedCouponCode.trim().toUpperCase();
    if (!code) return;

    const coupon = coupons.find((c) => c.code === code && c.is_active);
    if (!coupon) {
      alert("Cupom não encontrado ou inativo.");
      return;
    }

    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      alert(`Este cupom exige pedido mínimo de ${formatCurrency(coupon.min_order_value)}.`);
      return;
    }

    let disc = 0;
    if (coupon.discount_type === "percentage") {
      disc = (subtotal * coupon.discount_value) / 100;
    } else {
      disc = coupon.discount_value;
    }

    if (coupon.max_discount_value && disc > coupon.max_discount_value) {
      disc = coupon.max_discount_value;
    }

    setCouponDiscount(Math.min(disc, subtotal));
    alert(`Cupom ${coupon.code} aplicado com sucesso! Desconto de ${formatCurrency(disc)}.`);
  };

  // Finalização do Pedido no Balcão
  const handleFinalizePOSOrder = () => {
    if (cartItems.length === 0) {
      alert("Adicione pelo menos um produto ao pedido.");
      return;
    }

    if (paymentMethod === "cash" && cashTenderedVal > 0 && cashTenderedVal < totalPayable) {
      alert(`Valor em dinheiro entregue (${formatCurrency(cashTenderedVal)}) é menor que o total (${formatCurrency(totalPayable)}).`);
      return;
    }

    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const orderId = `pos_${Date.now()}_${randomSeq}`;

    const orderItems: OrderItem[] = cartItems.map((item) => {
      const unitPrice = item.variation ? item.variation.price : item.product.base_price;
      return {
        product_name: item.product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        selected_variation: item.variation,
        custom_notes: item.custom_notes,
        total_price: unitPrice * item.quantity,
      };
    });

    const isFiado = paymentMethod === "fiado";

    const newOrder: Order = {
      id: orderId,
      order_number: randomSeq,
      customer_name: customerName.trim() || "Cliente Balcão",
      customer_phone: customerPhone ? cleanPhoneForWhatsApp(customerPhone) : "81999999999",
      order_type: orderSubtype === "consumo_local" ? "pickup" : "pickup",
      order_subtype: orderSubtype,
      origin: "balcao",
      subtotal,
      discount: totalDiscount,
      coupon_code: appliedCouponCode.trim() ? appliedCouponCode.trim().toUpperCase() : null,
      coupon_discount: couponDiscount,
      manual_discount: manualDiscountVal,
      delivery_fee: 0,
      total: totalPayable,
      payment_method: isFiado ? "cash" : paymentMethod,
      payment_status: isFiado ? "pending" : isPaidNow ? "paid" : "pending",
      is_fiado: isFiado,
      fiado_paid: false,
      cash_tendered: paymentMethod === "cash" && cashTenderedVal > 0 ? cashTenderedVal : null,
      change_due: changeDue > 0 ? changeDue : null,
      order_status: "received",
      notes: orderNotes.trim() ? `[BALCÃO] ${orderNotes.trim()}` : "[BALCÃO]",
      is_printed: false,
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    onSaveOrder(newOrder);
    setFinishedOrder(newOrder);

    // Limpa tela do PDV para o próximo atendimento
    setCartItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCashTendered("");
    setManualDiscount("");
    setAppliedCouponCode("");
    setCouponDiscount(0);
    setOrderNotes("");
  };

  // Impressão da Comanda Térmica
  const handlePrintReceipt = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda Balcão #${order.order_number}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; width: 280px; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px;">NICE DOCE SABOR</div>
          <div class="center">Confeitaria Artesanal</div>
          <div class="center">Recife - PE</div>
          <div class="line"></div>
          <div class="center bold" style="font-size: 16px;">PEDIDO BALCÃO #${order.order_number}</div>
          <div>Data: ${new Date(order.created_at || Date.now()).toLocaleString("pt-BR")}</div>
          <div>Cliente: ${order.customer_name}</div>
          <div>Tipo: ${order.order_subtype === "consumo_local" ? "Consumo no Balcão" : order.order_subtype === "retirada" ? "Retirada" : "Encomenda"}</div>
          <div class="line"></div>
          <div class="bold">ITENS:</div>
          ${(order.items || [])
            .map(
              (i) => `
            <div class="flex">
              <span>${i.quantity}x ${i.product_name} ${i.selected_variation ? `(${i.selected_variation.name})` : ""}</span>
              <span>R$ ${(i.total_price || 0).toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
          <div class="line"></div>
          <div class="flex"><span>Subtotal:</span><span>R$ ${(order.subtotal || 0).toFixed(2)}</span></div>
          ${order.discount ? `<div class="flex"><span>Desconto:</span><span>- R$ ${order.discount.toFixed(2)}</span></div>` : ""}
          <div class="flex bold" style="font-size: 14px;"><span>TOTAL:</span><span>R$ ${(order.total || 0).toFixed(2)}</span></div>
          <div class="line"></div>
          <div>Pagamento: ${order.is_fiado ? "PAGAR DEPOIS (FIADO)" : order.payment_method.toUpperCase()} (${order.payment_status === "paid" ? "PAGO" : "PENDENTE"})</div>
          ${order.cash_tendered ? `<div>Dinheiro Entregue: R$ ${order.cash_tendered.toFixed(2)}</div>` : ""}
          ${order.change_due ? `<div class="bold">Troco: R$ ${order.change_due.toFixed(2)}</div>` : ""}
          <div class="line"></div>
          <div class="center" style="margin-top: 10px;">Agradecemos a sua preferência! ❤️</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Enviar comprovante via WhatsApp
  const handleSendWhatsAppReceipt = (order: Order) => {
    if (!order.customer_phone) return;
    const itemsText = (order.items || [])
      .map((i) => `• ${i.quantity}x ${i.product_name} ${i.selected_variation ? `(${i.selected_variation.name})` : ""} - ${formatCurrency(i.total_price)}`)
      .join("\n");

    const msg = `*NICE DOCE SABOR — COMPROVANTE DE PEDIDO BALCÃO #${order.order_number}*\n\nOlá, ${order.customer_name}!\nAgradecemos por sua compra na Nice Doce Sabor! Segue o resumo do seu pedido:\n\n${itemsText}\n\n*Total:* ${formatCurrency(order.total)}\n*Forma de Pagamento:* ${order.is_fiado ? "Pagar Depois (Anotado)" : order.payment_method.toUpperCase()} (${order.payment_status === "paid" ? "PAGO" : "Pendente"})\n\nEsperamos que adoce o seu dia! ❤️`;

    window.open(`https://wa.me/55${order.customer_phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Fechamento de Caixa do Dia (Hoje)
  const cashClosingSummary = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todaysOrders = orders.filter((o) => {
      if (o.status === "cancelado") return false;
      const oDate = (o.created_at || "").split("T")[0];
      return oDate === todayStr;
    });

    let totalDinheiro = 0;
    let totalPix = 0;
    let totalCartao = 0;
    let totalFiado = 0;
    let totalBalcao = 0;
    let totalOnline = 0;
    let totalGeral = 0;

    todaysOrders.forEach((o) => {
      const val = o.total || 0;
      totalGeral += val;

      if (o.origin === "balcao") {
        totalBalcao += val;
      } else {
        totalOnline += val;
      }

      if (o.is_fiado) {
        totalFiado += val;
      } else if (o.payment_method === "cash") {
        totalDinheiro += val;
      } else if (o.payment_method === "pix") {
        totalPix += val;
      } else if (o.payment_method === "card") {
        totalCartao += val;
      }
    });

    return {
      date: new Date().toLocaleDateString("pt-BR"),
      count: todaysOrders.length,
      totalGeral,
      totalDinheiro,
      totalPix,
      totalCartao,
      totalFiado,
      totalBalcao,
      totalOnline,
    };
  }, [orders]);

  const handlePrintCashClosing = () => {
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Fechamento de Caixa - ${cashClosingSummary.date}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; width: 280px; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px;">NICE DOCE SABOR</div>
          <div class="center bold" style="font-size: 13px;">FECHAMENTO DE CAIXA DO DIA</div>
          <div class="center">Data: ${cashClosingSummary.date}</div>
          <div class="line"></div>
          <div class="flex"><span>Total de Pedidos:</span><span class="bold">${cashClosingSummary.count}</span></div>
          <div class="line"></div>
          <div class="bold">POR FORMA DE PAGAMENTO:</div>
          <div class="flex"><span>Dinheiro:</span><span>R$ ${cashClosingSummary.totalDinheiro.toFixed(2)}</span></div>
          <div class="flex"><span>PIX:</span><span>R$ ${cashClosingSummary.totalPix.toFixed(2)}</span></div>
          <div class="flex"><span>Cartão:</span><span>R$ ${cashClosingSummary.totalCartao.toFixed(2)}</span></div>
          <div class="flex"><span>Fiado / Pendente:</span><span>R$ ${cashClosingSummary.totalFiado.toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="bold">POR ORIGEM:</div>
          <div class="flex"><span>Balcão (PDV):</span><span>R$ ${cashClosingSummary.totalBalcao.toFixed(2)}</span></div>
          <div class="flex"><span>Cardápio Online:</span><span>R$ ${cashClosingSummary.totalOnline.toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="flex bold" style="font-size: 15px;"><span>TOTAL DO CAIXA:</span><span>R$ ${cashClosingSummary.totalGeral.toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="center" style="margin-top: 15px;">Fechado por: Eunice Pereira (Dona)</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior com Fechamento de Caixa */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-nice-pink to-nice-wine text-white flex items-center justify-center shadow-md">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-nice-wine text-base sm:text-lg flex items-center gap-2">
              <span>PDV — Novo Pedido no Balcão</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Tablet & PC
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Atendimento rápido para clientes presentes na confeitaria ou retiradas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCashClosingOpen(true)}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
        >
          <Receipt className="w-4 h-4" />
          <span>Fechamento de Caixa do Dia</span>
        </button>
      </div>

      {/* Grid Principal: Produtos à Esquerda (60%), Comanda à Direita (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LADO ESQUERDO: CATÁLOGO DE PRODUTOS */}
        <div className="lg:col-span-7 space-y-4">
          {/* Busca e Categorias */}
          <div className="bg-white rounded-3xl p-4 border border-pink-100 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do produto ou sabor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-pink-200 text-xs sm:text-sm text-nice-wine placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategoryId === "all"
                    ? "bg-nice-pink text-white shadow-sm"
                    : "bg-pink-50/80 text-nice-wine hover:bg-pink-100 border border-pink-100"
                }`}
              >
                Todos ({products.filter((p) => !p.is_paused && !p.is_archived).length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    selectedCategoryId === c.id
                      ? "bg-nice-pink text-white shadow-sm"
                      : "bg-pink-50/80 text-nice-wine hover:bg-pink-100 border border-pink-100"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grade de Produtos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[680px] overflow-y-auto pr-1">
            {availableProducts.map((p) => {
              const hasFlavors = p.variations && p.variations.length > 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProductClick(p)}
                  className="bg-white rounded-2xl p-3 border border-pink-100 hover:border-pink-300 shadow-sm hover:shadow-md transition text-left flex flex-col justify-between group active:scale-98"
                >
                  <div>
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-pink-50 mb-2">
                      <Image
                        src={p.images?.[0] || "/logo.jpg"}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {hasFlavors && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur-sm">
                          {p.variations.length} sabores
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-nice-wine text-xs block line-clamp-1">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-gray-500 block line-clamp-1 mt-0.5">
                      {p.description}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-pink-100 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-nice-pink">
                      {formatCurrency(p.base_price)}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-pink-100 text-nice-pink flex items-center justify-center group-hover:bg-nice-pink group-hover:text-white transition">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LADO DIREITO: COMANDA & FINALIZAÇÃO (40%) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-pink-100 shadow-card-3d space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Cabeçalho da Comanda */}
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div>
                <h4 className="font-bold text-nice-wine text-base">Comanda do Atendimento</h4>
                <span className="text-[11px] text-gray-500">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} itens adicionados
                </span>
              </div>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Tipo do Pedido */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "consumo_local", label: "No Balcão" },
                { id: "retirada", label: "Retirada" },
                { id: "encomenda", label: "Encomenda" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOrderSubtype(t.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    orderSubtype === t.id
                      ? "bg-nice-wine text-white border-nice-wine shadow-sm"
                      : "bg-white text-gray-600 border-pink-100 hover:bg-pink-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Dados do Cliente (Opcionais) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Cliente (Opcional)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-1 focus:ring-nice-pink"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  WhatsApp (Comprovante)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="(81) 9...."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-1 focus:ring-nice-pink"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Itens do Carrinho */}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border border-pink-100 rounded-2xl p-2 bg-pink-50/20">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Toque nos produtos ao lado para montar o pedido.
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const price = item.variation ? item.variation.price : item.product.base_price;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-pink-100 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-nice-wine block truncate">
                          {item.product.name}
                        </span>
                        {item.variation && (
                          <span className="text-[11px] text-nice-pink font-semibold block">
                            Sabor: {item.variation.name}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {formatCurrency(price)} cada
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center border border-pink-200 rounded-full bg-white px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, -1)}
                            className="w-5 h-5 rounded-full text-nice-wine hover:bg-pink-100 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-nice-pink">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, 1)}
                            className="w-5 h-5 rounded-full bg-nice-pink text-white hover:bg-nice-pink-hover flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-nice-wine w-14 text-right">
                          {formatCurrency(price * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-gray-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desconto Manual e Cupom */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">
                  Desconto Manual (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5,00"
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(e.target.value)}
                  className="w-full p-2 rounded-xl border border-pink-200 text-xs text-nice-wine focus:outline-none focus:ring-1 focus:ring-nice-pink"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">
                  Aplicar Cupom
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="NICE10"
                    value={appliedCouponCode}
                    onChange={(e) => setAppliedCouponCode(e.target.value.toUpperCase())}
                    className="w-full p-2 rounded-xl border border-pink-200 text-xs font-mono uppercase text-nice-wine focus:outline-none focus:ring-1 focus:ring-nice-pink"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-2.5 py-1 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white font-bold text-xs"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase block">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                {[
                  { id: "cash", label: "Dinheiro" },
                  { id: "pix", label: "PIX" },
                  { id: "card", label: "Cartão" },
                  { id: "fiado", label: "Anotar" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id as any)}
                    className={`py-2 rounded-xl border transition ${
                      paymentMethod === p.id
                        ? "bg-nice-pink text-white border-nice-pink shadow-sm"
                        : "bg-white text-gray-600 border-pink-100 hover:bg-pink-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Se Dinheiro, campo de troco */}
              {paymentMethod === "cash" && (
                <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 flex items-center justify-between text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-nice-wine uppercase block">
                      Valor Entregue pelo Cliente
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 50,00"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="p-1.5 rounded-lg border border-pink-200 text-xs text-nice-wine font-bold w-28 focus:outline-none focus:ring-1 focus:ring-nice-pink"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">Troco a Devolver</span>
                    <span className="font-extrabold text-sm text-emerald-700">
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Status do Pagamento */}
              {paymentMethod !== "fiado" && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isPaidNow}
                    onChange={(e) => setIsPaidNow(e.target.checked)}
                    className="w-4 h-4 text-nice-pink rounded border-pink-300 focus:ring-nice-pink"
                  />
                  <span className="text-xs font-semibold text-nice-wine">
                    Marcar como PAGO agora no caixa
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Resumo Financeiro e Botão Finalizar */}
          <div className="pt-3 border-t border-pink-100 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                <span>Descontos:</span>
                <span>- {formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-nice-wine pt-1 border-t border-pink-100">
              <span>Total do Pedido:</span>
              <span className="text-nice-pink text-lg">{formatCurrency(totalPayable)}</span>
            </div>

            <button
              type="button"
              onClick={handleFinalizePOSOrder}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-nice-pink to-nice-wine hover:opacity-95 text-white font-extrabold text-sm shadow-luxury flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Finalizar & Imprimir Comanda</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ESCOLHA DE SABOR / VARIAÇÃO */}
      {variationModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-nice-pink block">
                  Escolha o Sabor
                </span>
                <h3 className="font-bold text-nice-wine text-sm">
                  {variationModalProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setVariationModalProduct(null)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {variationModalProduct.variations?.map((v) => {
                const isPaused = Boolean(v.is_paused);
                return (
                  <button
                    key={v.name}
                    type="button"
                    disabled={isPaused}
                    onClick={() => {
                      addToCart(variationModalProduct, v);
                      setVariationModalProduct(null);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition ${
                      isPaused
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                        : "bg-pink-50/50 border-pink-100 text-nice-wine hover:bg-nice-pink hover:text-white"
                    }`}
                  >
                    <span>{v.name}</span>
                    <span>{formatCurrency(v.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUCESSO DO PEDIDO NO BALCÃO COM IMPRESSÃO E WHATSAPP */}
      {finishedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-nice-pink block">
                Pedido Balcão Finalizado!
              </span>
              <h3 className="font-extrabold text-nice-wine text-xl mt-0.5">
                Comanda #{finishedOrder.order_number}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Total de {formatCurrency(finishedOrder.total)} •{" "}
                {finishedOrder.is_fiado
                  ? "Pagar Depois (Fiado)"
                  : `${finishedOrder.payment_method.toUpperCase()} (${finishedOrder.payment_status === "paid" ? "PAGO" : "PENDENTE"})`}
              </p>
              {finishedOrder.change_due && (
                <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800">
                  Troco a devolver: {formatCurrency(finishedOrder.change_due)}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrintReceipt(finishedOrder)}
                className="w-full py-3 rounded-full bg-nice-wine hover:bg-nice-wine-dark text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comanda Térmica</span>
              </button>

              {finishedOrder.customer_phone && (
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReceipt(finishedOrder)}
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Comprovante pelo WhatsApp</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setFinishedOrder(null)}
                className="w-full py-2.5 rounded-full border border-pink-200 text-nice-wine font-semibold text-xs hover:bg-pink-50"
              >
                Próximo Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FECHAMENTO DE CAIXA DO DIA */}
      {isCashClosingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-5">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-nice-pink" />
                <div>
                  <h3 className="font-bold text-nice-wine text-base">
                    Fechamento de Caixa do Dia
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Data: {cashClosingSummary.date}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCashClosingOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                ✕
              </button>
            </div>

            {/* Resumo do Caixa */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Total de Pedidos Realizados:</span>
                  <span className="font-bold text-nice-wine">{cashClosingSummary.count}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Origem Balcão (PDV):</span>
                  <span className="font-bold text-nice-wine">{formatCurrency(cashClosingSummary.totalBalcao)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Origem Cardápio Online:</span>
                  <span className="font-bold text-nice-wine">{formatCurrency(cashClosingSummary.totalOnline)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Por Forma de Pagamento:
                </span>
                <div className="flex justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span>Dinheiro em Espécie:</span>
                  <span className="font-bold text-nice-wine">{formatCurrency(cashClosingSummary.totalDinheiro)}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span>PIX:</span>
                  <span className="font-bold text-nice-wine">{formatCurrency(cashClosingSummary.totalPix)}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span>Cartão (Crédito / Débito):</span>
                  <span className="font-bold text-nice-wine">{formatCurrency(cashClosingSummary.totalCartao)}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                  <span>Pagar Depois (Fiado):</span>
                  <span className="font-bold">{formatCurrency(cashClosingSummary.totalFiado)}</span>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-r from-nice-pink-light to-pink-50 rounded-2xl border border-pink-200 flex justify-between items-center text-sm font-extrabold text-nice-wine">
                <span>Faturamento Total do Dia:</span>
                <span className="text-nice-pink text-base">{formatCurrency(cashClosingSummary.totalGeral)}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-2 border-t border-pink-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCashClosingOpen(false)}
                className="px-4 py-2 rounded-full border border-pink-200 text-nice-wine text-xs font-semibold hover:bg-pink-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handlePrintCashClosing}
                className="px-5 py-2 rounded-full bg-nice-wine hover:bg-nice-wine-dark text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Resumo de Caixa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
