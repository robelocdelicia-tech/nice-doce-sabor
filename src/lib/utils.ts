import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Store, Order } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  return phone;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  return digits;
}

// Verifica se a loja está aberta e calcula a mensagem em tempo real
export function checkStoreStatus(store: Store): {
  isOpen: boolean;
  statusLabel: string;
  detailMessage: string;
} {
  if (store.manual_status === "open") {
    return {
      isOpen: true,
      statusLabel: "Aberto agora",
      detailMessage: "Atendimento ativo até as 19h",
    };
  }

  if (store.manual_status === "closed") {
    return {
      isOpen: false,
      statusLabel: "Fechado no momento",
      detailMessage: store.closed_custom_message || "Voltamos em breve!",
    };
  }

  // Modo Automático (segue a grade de horários configurada)
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, ..., 6 = Sábado
  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDayKey = dayKeys[dayIndex];
  const dayConfig = store.schedule_config[currentDayKey];

  if (!dayConfig || dayConfig.closed) {
    // Se for terça-feira fechada, informa que abre quarta às 12h
    const nextMsg =
      currentDayKey === "tuesday"
        ? "Fechado na terça. Abrimos quarta às 12h!"
        : "Fechado hoje. Abrimos no próximo dia útil às 12h!";
    return {
      isOpen: false,
      statusLabel: "Fechado hoje",
      detailMessage: nextMsg,
    };
  }

  const [openHour, openMin] = dayConfig.open.split(":").map(Number);
  const [closeHour, closeMin] = dayConfig.close.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      statusLabel: "Aberto agora",
      detailMessage: `Aberto até as ${dayConfig.close}`,
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusLabel: "Abre hoje",
      detailMessage: `Abre hoje às ${dayConfig.open}`,
    };
  }

  return {
    isOpen: false,
    statusLabel: "Fechado",
    detailMessage: "Horário de hoje encerrado. Abrimos amanhã às 12h!",
  };
}

// Gera a mensagem perfeita para envio no WhatsApp da loja ao finalizar pedido
export function generateStoreWhatsAppUrl(order: Order, store: Store): string {
  const formattedPhone = cleanPhoneForWhatsApp(store.phone_whatsapp);
  const itemsText = order.items
    ? order.items
        .map((item, idx) => {
          let line = `${idx + 1}. *${item.quantity}x ${item.product_name}* - ${formatCurrency(item.total_price)}`;
          if (item.selected_variation) {
            line += `\n   ▫️ _Tamanho:_ ${item.selected_variation.name}`;
          }
          if (item.selected_addons && item.selected_addons.length > 0) {
            line += `\n   ▫️ _Adicionais:_ ${item.selected_addons.map((a) => a.name).join(", ")}`;
          }
          if (item.custom_notes && item.custom_notes.trim()) {
            line += `\n   📝 _Obs:_ "${item.custom_notes.trim()}"`;
          }
          return line;
        })
        .join("\n\n")
    : "Itens no comprovante";

  const paymentMethodLabel =
    order.payment_method === "pix"
      ? "PIX (Comprovante em anexo)"
      : order.payment_method === "cash"
      ? `Dinheiro${order.cash_change_for ? ` (Troco para ${formatCurrency(order.cash_change_for)})` : " (Valor exato)"}`
      : "Cartão (no momento da retirada/entrega)";

  const deliveryText =
    order.order_type === "delivery" && order.delivery_address
      ? `🛵 *Entrega em domicílio*\n` +
        `📍 *Endereço:* ${order.delivery_address.street}, Nº ${order.delivery_address.number}\n` +
        (order.delivery_address.complement ? `▫️ Complemento: ${order.delivery_address.complement}\n` : "") +
        (order.delivery_address.reference ? `▫️ Ref: ${order.delivery_address.reference}\n` : "") +
        `▫️ Bairro: ${order.neighborhood_name || order.delivery_address.neighborhood}\n` +
        `▫️ Taxa de Entrega: ${formatCurrency(order.delivery_fee)}`
      : `🛍️ *Retirada no local:* ${store.pickup_address}`;

  const message =
    `🧁 *NOVO PEDIDO #${order.order_number}* — *${store.name}*\n` +
    `══════════════════════════\n` +
    `👤 *Cliente:* ${order.customer_name}\n` +
    `📱 *WhatsApp:* ${formatPhone(order.customer_phone)}\n` +
    `══════════════════════════\n\n` +
    `📋 *ITENS DO PEDIDO:*\n${itemsText}\n\n` +
    `══════════════════════════\n` +
    `${deliveryText}\n` +
    `══════════════════════════\n` +
    `💰 *Subtotal:* ${formatCurrency(order.subtotal)}\n` +
    (order.discount > 0 ? `🎟️ *Desconto:* -${formatCurrency(order.discount)}\n` : "") +
    (order.delivery_fee > 0 ? `🛵 *Taxa de Entrega:* +${formatCurrency(order.delivery_fee)}\n` : "") +
    `✨ *TOTAL: ${formatCurrency(order.total)}*\n` +
    `💳 *Forma de Pagamento:* ${paymentMethodLabel}\n` +
    (order.notes ? `\n📌 *Observações do Pedido:* ${order.notes}\n` : "") +
    `══════════════════════════\n` +
    (order.payment_method === "pix"
      ? `📎 _Estou enviando o comprovante do PIX a seguir para confirmação!_`
      : `_Pedido realizado pelo Cardápio Digital._`);

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

// Gera o link para a dona disparar mensagem de status diretamente no WhatsApp do cliente
export function generateCustomerStatusWhatsAppUrl(
  order: Order,
  type: "ready" | "out" | "paid" | "custom",
  store: Store,
  customMsg?: string
): string {
  const targetPhone = cleanPhoneForWhatsApp(order.customer_phone);

  let text = "";
  if (type === "ready") {
    text =
      `Olá *${order.customer_name}*! 💕\n\n` +
      `Seu pedido *#${order.order_number}* na *${store.name}* já está *PRONTINHO PARA RETIRADA*! 🎉\n\n` +
      `📍 *Endereço para retirada:* ${store.pickup_address}\n` +
      `Te esperamos com tudo embalado com muito carinho!`;
  } else if (type === "out") {
    text =
      `Olá *${order.customer_name}*! 🛵💨\n\n` +
      `Seu pedido *#${order.order_number}* na *${store.name}* acabou de *SAIR PARA ENTREGA*!\n\n` +
      `Por favor, fique atento(a) no endereço para receber. Bom apetite! ✨`;
  } else if (type === "paid") {
    text =
      `Olá *${order.customer_name}*! ✅\n\n` +
      `Confirmamos o recebimento do seu pagamento para o pedido *#${order.order_number}*!\n` +
      `Já estamos preparando seu pedido com todo amor e qualidade artesanal. 💕`;
  } else if (customMsg) {
    text = customMsg
      .replace(/{customer_name}/g, order.customer_name)
      .replace(/{order_number}/g, String(order.order_number))
      .replace(/{total}/g, formatCurrency(order.total));
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
