"use client";

import React, { useState, useEffect } from "react";
import { Order } from "@/types";
import { X, Check, DollarSign, FileText, User, Phone, Sparkles } from "lucide-react";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSaveOrder: (updatedOrder: Order) => void;
}

export function EditOrderModal({
  isOpen,
  onClose,
  order,
  onSaveOrder,
}: EditOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "card" | "fiado">("pix");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "refunded">("pending");
  const [orderStatus, setOrderStatus] = useState<Order["order_status"]>("received");

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer_name);
      setCustomerPhone(order.customer_phone);
      setTotal(String(order.total).replace(".", ","));
      setNotes(order.notes || "");
      setPaymentMethod(order.payment_method);
      setPaymentStatus(order.payment_status);
      setOrderStatus(order.order_status);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTotal = total.replace(/[^\d.,]/g, "").replace(",", ".");
    const parsedTotal = parseFloat(cleanTotal) || order.total;

    const updated: Order = {
      ...order,
      customer_name: customerName.trim() || order.customer_name,
      customer_phone: customerPhone.trim() || order.customer_phone,
      total: parsedTotal,
      notes: notes.trim() || null,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      order_status: orderStatus,
    };

    onSaveOrder(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-pink-100">
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-nice-pink text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-nice-wine text-base">
                Editar Pedido #{order.order_number}
              </h3>
              <p className="text-[11px] text-gray-500">
                Ajuste valor total, dados ou observações
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Nome do Cliente
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine font-medium outline-none focus:ring-2 focus:ring-nice-pink"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              WhatsApp do Cliente
            </label>
            <input
              type="text"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine font-medium outline-none focus:ring-2 focus:ring-nice-pink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Valor Total (R$)
              </label>
              <input
                type="text"
                required
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-pink font-extrabold text-sm outline-none focus:ring-2 focus:ring-nice-pink"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Status do Pagamento
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine font-medium outline-none focus:ring-2 focus:ring-nice-pink bg-white"
              >
                <option value="pending">A Cobrar / Pendente</option>
                <option value="paid">Pago (PIX/Dinheiro/Cartão)</option>
                <option value="refunded">Estornado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Status do Pedido
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine font-medium outline-none focus:ring-2 focus:ring-nice-pink bg-white"
            >
              <option value="received">Recebido</option>
              <option value="preparing">Em Preparo</option>
              <option value="ready">Pronto para Retirada</option>
              <option value="out_for_delivery">Saiu para Entrega</option>
              <option value="delivered">Entregue / Finalizado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Observações do Pedido
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente pediu para retirar às 17h..."
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine outline-none focus:ring-2 focus:ring-nice-pink text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-pink-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white font-bold shadow-md shadow-pink-500/20"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
