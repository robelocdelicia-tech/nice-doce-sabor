"use client";

import React, { useState } from "react";
import { Order, OrderItem, Product } from "@/types";
import { formatCurrency, cleanPhoneForWhatsApp } from "@/lib/utils";
import { X, Plus, Trash2, Printer, Check, ShoppingBag } from "lucide-react";

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveOrder: (order: Order, printImmediately: boolean) => void;
}

export function ManualOrderModal({
  isOpen,
  onClose,
  products,
  onSaveOrder,
}: ManualOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "card">("pix");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );
  const [selectedFlavorName, setSelectedFlavorName] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const currentSelectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddItem = () => {
    if (!currentSelectedProduct) return;

    let unitPrice = currentSelectedProduct.base_price;
    let selectedVariation = null;

    if (
      currentSelectedProduct.variations &&
      currentSelectedProduct.variations.length > 0
    ) {
      const matchVar = currentSelectedProduct.variations.find(
        (v) => v.name === selectedFlavorName
      ) || currentSelectedProduct.variations[0];
      unitPrice = matchVar.price;
      selectedVariation = matchVar;
    }

    const newItem: OrderItem = {
      product_name: currentSelectedProduct.name,
      unit_price: unitPrice,
      quantity: itemQuantity,
      selected_variation: selectedVariation,
      selected_addons: [],
      custom_notes: null,
      total_price: unitPrice * itemQuantity,
    };

    setOrderItems([...orderItems, newItem]);
    setItemQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const subtotal = orderItems.reduce((acc, it) => acc + it.total_price, 0);

  const handleFinish = (print: boolean) => {
    if (!customerName.trim() || orderItems.length === 0) {
      alert("Por favor, preencha o nome do cliente e adicione pelo menos um item.");
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const order: Order = {
      id: `manual_${Date.now()}_${randomNum}`,
      order_number: randomNum,
      customer_name: customerName.trim(),
      customer_phone: cleanPhoneForWhatsApp(customerPhone || "81988896169"),
      order_type: orderType,
      delivery_fee: 0,
      subtotal: subtotal,
      discount: 0,
      total: subtotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "pix" ? "paid" : "pending",
      order_status: "received",
      notes: notes.trim() || null,
      is_printed: false,
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    onSaveOrder(order, print);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 border border-pink-100">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-pink-50 pb-3">
          <div>
            <h3 className="font-bold text-nice-wine text-lg">
              Registrar Pedido Manual
            </h3>
            <p className="text-xs text-gray-500">
              Para pedidos do balcão, telefone ou WhatsApp direto
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-nice-wine">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dados do Cliente */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-nice-wine block mb-1">Nome do Cliente *</label>
            <input
              type="text"
              required
              placeholder="Ex.: João Silva"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine focus:outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-nice-wine block mb-1">WhatsApp</label>
            <input
              type="tel"
              placeholder="(81) 98888-0000"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine focus:outline-none"
            />
          </div>
        </div>

        {/* Adicionar Itens */}
        <div className="pt-2 border-t border-pink-100 space-y-2 text-xs">
          <label className="font-bold text-nice-wine block">
            Adicionar Item ao Pedido
          </label>

          <div className="space-y-2">
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedFlavorName("");
              }}
              className="w-full p-2.5 rounded-xl border border-pink-200 bg-white text-nice-wine font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Se o produto selecionado tiver variações / sabores */}
            {currentSelectedProduct?.variations &&
              currentSelectedProduct.variations.length > 0 && (
                <select
                  value={selectedFlavorName}
                  onChange={(e) => setSelectedFlavorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 text-nice-wine font-medium"
                >
                  <option value="">Selecione o Sabor / Tamanho</option>
                  {currentSelectedProduct.variations.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} (R$ {v.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              )}

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Qtd:</span>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  className="w-16 p-2 rounded-xl border border-pink-200 text-center font-bold"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex-1 py-2 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white font-bold transition flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar ao Pedido</span>
              </button>
            </div>
          </div>
        </div>

        {/* Itens Adicionados */}
        {orderItems.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
            {orderItems.map((it, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 rounded-xl bg-pink-50/50 border border-pink-100"
              >
                <div>
                  <span className="font-bold text-nice-wine">
                    {it.quantity}x {it.product_name}
                  </span>
                  {it.selected_variation && (
                    <span className="text-[10px] text-nice-pink block">
                      ({it.selected_variation.name})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-nice-wine">
                    {formatCurrency(it.total_price)}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="text-gray-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Forma de Pagamento e Tipo */}
        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-pink-100">
          <div>
            <label className="font-bold text-nice-wine block mb-1">Forma de Pagamento</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-pink-200 bg-white"
            >
              <option value="pix">PIX (Pago)</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-nice-wine block mb-1">Tipo</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-pink-200 bg-white"
            >
              <option value="pickup">Retirada no Local</option>
              <option value="delivery">Entrega</option>
            </select>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-pink-100">
          <span className="text-xs text-gray-500">Total do Pedido:</span>
          <span className="text-lg font-extrabold text-nice-pink">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Botões de Finalização */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => handleFinish(false)}
            className="px-4 py-2.5 rounded-full border border-pink-200 text-nice-wine text-xs font-bold hover:bg-pink-50 transition"
          >
            Salvar Pedido
          </button>
          <button
            onClick={() => handleFinish(true)}
            className="px-5 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Salvar e Imprimir Comanda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
