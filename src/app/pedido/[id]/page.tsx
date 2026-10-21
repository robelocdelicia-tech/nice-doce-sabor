"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Order, Store } from "@/types";
import { DEFAULT_STORE } from "@/lib/constants";
import { formatCurrency, formatPhone, generateStoreWhatsAppUrl } from "@/lib/utils";
import { generatePixCopiaECola } from "@/lib/pix";
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  MessageCircle,
  ShoppingBag,
  ArrowLeft,
  Share2,
  Printer,
  Sparkles,
  QrCode,
  MapPin,
} from "lucide-react";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [pixPayload, setPixPayload] = useState("");

  useEffect(() => {
    // Busca as configurações da loja e o pedido do localStorage
    try {
      const savedStore = localStorage.getItem("nice_store_settings");
      let currentStore = DEFAULT_STORE;
      if (savedStore) {
        currentStore = JSON.parse(savedStore);
        setStore(currentStore);
      }

      const savedOrders = localStorage.getItem("nice_orders");
      if (savedOrders) {
        const ordersList: Order[] = JSON.parse(savedOrders);
        const found = ordersList.find((o) => o.id === orderId);
        if (found) {
          setOrder(found);

          // Gera a string do PIX Copia e Cola padrão Banco Central
          const payload = generatePixCopiaECola({
            key: currentStore.pix_key,
            name: currentStore.pix_beneficiary_name,
            city: currentStore.pix_city,
            amount: found.total,
            txid: `PEDIDO${found.order_number}`,
          });
          setPixPayload(payload);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar pedido ou loja:", e);
    }
  }, [orderId]);

  const handleCopyKey = () => {
    if (store?.pix_key) {
      navigator.clipboard.writeText(store.pix_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleCopyPayload = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFF5FA] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-nice-pink" />
        </div>
        <h1 className="text-xl font-bold text-nice-wine mb-2">Pedido não encontrado</h1>
        <p className="text-xs text-gray-500 max-w-sm mb-6">
          Não localizamos este pedido no seu dispositivo. Caso tenha feito recentemente, verifique o link ou volte ao cardápio.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md transition"
        >
          Voltar ao Cardápio
        </Link>
      </div>
    );
  }

  // Mensagem para envio de comprovante no WhatsApp da loja
  const whatsappReceiptText =
    `Olá Eunice! 💕\n` +
    `Acabei de fazer o pedido *#${order.order_number}* no valor de *${formatCurrency(order.total)}* na Nice Doce Sabor.\n\n` +
    `📎 *Segue o comprovante do PIX em anexo para confirmação!*`;

  const whatsappReceiptUrl = `https://wa.me/${store.phone_whatsapp}?text=${encodeURIComponent(
    whatsappReceiptText
  )}`;

  // Link para mandar o pedido completo caso deseje
  const fullOrderWhatsappUrl = generateStoreWhatsAppUrl(order, store);

  // Status visual
  const statusSteps = [
    { key: "received", label: "Recebido", active: true },
    { key: "confirmed", label: "Confirmado / Pago", active: order.payment_status === "paid" || order.order_status !== "received" },
    { key: "preparing", label: "Em Preparo", active: ["preparing", "ready", "out_for_delivery", "delivered"].includes(order.order_status) },
    { key: "ready", label: "Pronto para Retirada", active: ["ready", "out_for_delivery", "delivered"].includes(order.order_status) },
  ];

  return (
    <div className="min-h-screen bg-[#FFF5FA] pb-12">
      {/* Barra Superior */}
      <div className="bg-white border-b border-pink-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-nice-wine hover:text-nice-pink transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Cardápio</span>
          </Link>

          <span className="text-xs font-bold text-nice-pink">
            Pedido #{order.order_number}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Banner de Sucesso */}
        <div className="bg-white rounded-3xl p-6 shadow-luxury border border-pink-100 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-nice-wine">
            Pedido #{order.order_number} Registrado!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Muito obrigado, <strong className="text-nice-wine">{order.customer_name}</strong>! Seu pedido foi salvo no nosso sistema com sucesso.
          </p>

          <div className="mt-4 pt-4 border-t border-pink-50 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-nice-pink" />
              {store.pickup_address}
            </span>
          </div>
        </div>

        {/* Linha do Tempo de Status do Pedido */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-nice-wine mb-4 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-nice-pink" />
            <span>Acompanhamento do Status</span>
          </h2>

          <div className="grid grid-cols-4 gap-2 text-center">
            {statusSteps.map((step, idx) => (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition ${
                    step.active
                      ? "bg-nice-pink text-white shadow-sm"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium leading-tight ${
                    step.active ? "text-nice-wine font-bold" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SEÇÃO PRINCIPAL: PIX DIRETO DA LOJA (0% TAXA) COM ENVIO DE COMPROVANTE */}
        {order.payment_method === "pix" && (
          <div className="bg-gradient-to-b from-[#FFFDFE] to-[#FFF0F7] rounded-3xl p-6 shadow-luxury border-2 border-nice-pink/40 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-nice-pink text-white rounded-2xl shadow-sm">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-nice-wine">
                  Pagamento via PIX (0% Taxa)
                </h2>
                <p className="text-xs text-nice-pink font-semibold">
                  Transfira diretamente para a confeitaria
                </p>
              </div>
            </div>

            {/* Informações da Chave */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Favorecido:</span>
                <span className="font-bold text-nice-wine">{store.pix_beneficiary_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Cidade:</span>
                <span className="font-medium text-nice-wine">{store.pix_city}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Valor Total:</span>
                <span className="font-extrabold text-nice-pink text-sm sm:text-base">
                  {formatCurrency(order.total)}
                </span>
              </div>

              {/* Botão Copiar Chave Telefone */}
              <div className="pt-2 border-t border-pink-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-nice-wine block mb-1">
                  Chave PIX (Celular)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-pink-50 p-2.5 px-3 rounded-xl text-xs font-mono font-bold text-nice-wine truncate">
                    {formatPhone(store.pix_key)}
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="px-3.5 py-2.5 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-sm flex items-center gap-1 transition active:scale-95"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Chave</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botão Copiar Código Copia e Cola Padrão BCB */}
              {pixPayload && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-nice-wine block mb-1">
                    PIX Copia e Cola (Bancos / Apps)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-pink-50 p-2.5 px-3 rounded-xl text-[11px] font-mono text-gray-500 truncate">
                      {pixPayload}
                    </div>
                    <button
                      onClick={handleCopyPayload}
                      className="px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-nice-wine hover:bg-pink-50 text-xs font-bold shadow-sm flex items-center gap-1 transition active:scale-95"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-nice-pink" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÃO PRINCIPAL: MANDAR COMPROVANTE NO WHATSAPP DA EUNICE */}
            <div className="pt-2">
              <a
                href={whatsappReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition transform active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Enviar Comprovante do PIX no WhatsApp</span>
              </a>
              <p className="text-[11px] text-gray-500 text-center mt-2 leading-tight">
                Após fazer a transferência no seu banco, clique no botão acima para nos enviar o comprovante com 1 toque!
              </p>
            </div>
          </div>
        )}

        {/* Resumo da Comanda */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 space-y-4">
          <div className="flex items-center justify-between border-b border-pink-50 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-nice-wine">
              Resumo do Pedido
            </h2>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 text-xs text-nice-pink hover:text-nice-pink-dark font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Comanda</span>
            </button>
          </div>

          {/* Itens */}
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs text-gray-700">
                <div className="pr-4">
                  <span className="font-bold text-nice-wine">
                    {item.quantity}x {item.product_name}
                  </span>
                  {item.selected_variation && (
                    <span className="block text-[11px] text-nice-pink">
                      Tamanho: {item.selected_variation.name}
                    </span>
                  )}
                  {item.selected_addons && item.selected_addons.length > 0 && (
                    <span className="block text-[10px] text-gray-500">
                      Adicionais: {item.selected_addons.map((a) => a.name).join(", ")}
                    </span>
                  )}
                  {item.custom_notes && (
                    <span className="block text-[10px] text-gray-500 italic">
                      Obs: "{item.custom_notes}"
                    </span>
                  )}
                </div>
                <span className="font-semibold text-nice-wine whitespace-nowrap">
                  {formatCurrency(item.total_price)}
                </span>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="pt-3 border-t border-pink-100 space-y-1 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Forma de Pagamento</span>
              <span className="font-semibold text-nice-wine uppercase">
                {order.payment_method === "pix"
                  ? "PIX Direto"
                  : order.payment_method === "cash"
                  ? "Dinheiro"
                  : "Cartão"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-nice-wine pt-2 border-t border-pink-100">
              <span>Total</span>
              <span className="text-nice-pink text-base">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Botão de Enviar Pedido Completo ao WhatsApp (Fallback) */}
        <div className="text-center pt-2">
          <a
            href={fullOrderWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-nice-wine/70 hover:text-nice-pink transition font-medium"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Falar com a dona sobre este pedido</span>
          </a>
        </div>
      </div>
    </div>
  );
}
