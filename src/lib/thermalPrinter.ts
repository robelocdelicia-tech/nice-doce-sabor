import { Order, Store } from "@/types";
import { formatCurrency, formatPhone } from "@/lib/utils";

/**
 * Gera o documento HTML completo para impressão de comanda térmica (58mm / 80mm)
 * no padrão profissional de delivery e restaurantes (estilo iFood / Anota AI).
 * Configurado especificamente para sair em pé (portrait) e cessar a alimentação
 * de papel assim que os dados terminarem, acionando o corte da guilhotina sem desperdício.
 */
export function generateThermalReceiptHTML(order: Order, store?: Store): string {
  const storeName = store?.name || "NICE DOCE SABOR";
  const storePhone = store?.phone_whatsapp ? formatPhone(store.phone_whatsapp) : "(81) 98522-8328";
  const storeCity = store?.city || "Recife - PE";

  const orderDate = new Date(order.created_at || Date.now());
  const formattedDate = orderDate.toLocaleDateString("pt-BR");
  const formattedTime = orderDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const isDelivery = order.order_type === "delivery";
  const isBalcao = order.origin === "balcao" || order.order_subtype?.includes("balcao");
  const isPaid = order.payment_status === "paid";

  let orderTypeLabel = ">>> ENTREGA (DELIVERY) <<<";
  if (order.order_subtype === "balcao_consumo" || order.order_subtype === "consumo_local") {
    orderTypeLabel = ">>> CONSUMO NO BALCÃO <<<";
  } else if (order.order_subtype === "balcao_retirada" || (!isDelivery && isBalcao)) {
    orderTypeLabel = ">>> RETIRADA NO BALCÃO <<<";
  } else if (!isDelivery) {
    orderTypeLabel = ">>> RETIRADA NO LOCAL <<<";
  } else if (order.order_subtype === "balcao_encomenda" || order.order_subtype === "encomenda") {
    orderTypeLabel = ">>> ENCOMENDA AGENDADA <<<";
  }

  const paymentLabels: Record<string, string> = {
    pix: "PIX DIRETO",
    cash: "DINHEIRO",
    card: "CARTÃO (CRÉDITO / DÉBITO)",
    fiado: "PAGAR DEPOIS (FIADO / ANOTADO)",
  };
  const paymentMethodLabel = paymentLabels[order.payment_method] || order.payment_method.toUpperCase();

  const addr = order.delivery_address;
  const subtotal = order.subtotal || 0;
  const deliveryFee = order.delivery_fee || 0;
  const couponDiscount = order.coupon_discount || (order.coupon_code ? order.discount : 0) || 0;
  const manualDiscount = order.manual_discount || 0;
  const totalDiscount = couponDiscount + manualDiscount;
  const total = order.total || Math.max(0, subtotal + deliveryFee - totalDiscount);

  const cashChangeFor = order.cash_change_for || 0;
  const changeToReturn = cashChangeFor > total ? cashChangeFor - total : 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comanda #${order.order_number}</title>
  <style>
    @page {
      size: portrait;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 72mm !important;
      max-width: 72mm !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: max-content !important;
      overflow: visible !important;
      background: #FFFFFF !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace, monospace !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .receipt-wrapper {
      width: 72mm !important;
      max-width: 72mm !important;
      margin: 0 !important;
      padding: 2mm 2.5mm 3mm 2.5mm !important;
      background: #FFFFFF !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .left { text-align: left; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    .uppercase { text-transform: uppercase; }

    .sep-double {
      border-bottom: 2px solid #000;
      margin: 4px 0;
    }
    .sep-dashed {
      border-bottom: 1px dashed #000;
      margin: 4px 0;
    }
    .sep-dotted {
      border-bottom: 1px dotted #555;
      margin: 3px 0;
    }

    .flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
    }

    .type-badge {
      border: 2px solid #000;
      padding: 3px 2px;
      text-align: center;
      font-weight: 900;
      font-size: 12.5px;
      margin: 3px 0;
      letter-spacing: 0.5px;
    }

    .obs-box {
      border: 1px solid #000;
      padding: 3px 4px;
      margin: 3px 0;
      font-weight: bold;
      background: #f4f4f4;
      font-size: 10.5px;
      line-height: 1.2;
    }

    .item-row {
      margin-top: 3px;
    }
    .item-sub {
      padding-left: 8px;
      font-size: 10px;
      color: #111;
    }
    .cut-line {
      text-align: center;
      font-size: 9px;
      letter-spacing: 1.5px;
      font-weight: bold;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <!-- CABEÇALHO DA LOJA -->
    <div class="center bold uppercase" style="font-size: 15px; letter-spacing: 0.5px;">${storeName}</div>
    <div class="center" style="font-size: 10.5px;">Confeitaria Artesanal de Luxo</div>
    <div class="center" style="font-size: 10px;">${storeCity} • ${storePhone}</div>

    <div class="sep-double"></div>

    <!-- IDENTIFICAÇÃO DO PEDIDO (GRANDE E DESTACADO) -->
    <div class="flex bolder" style="font-size: 16px;">
      <span>PEDIDO:</span>
      <span>#${order.order_number}</span>
    </div>
    <div class="flex" style="font-size: 10.5px;">
      <span>DATA / HORA:</span>
      <span class="bold">${formattedDate} às ${formattedTime}</span>
    </div>
    <div class="flex" style="font-size: 10.5px;">
      <span>ORIGEM:</span>
      <span class="bold uppercase">${isBalcao ? "BALCÃO (PDV)" : "CARDÁPIO ONLINE"}</span>
    </div>

    <div class="sep-double"></div>

    <!-- TIPO DE ATENDIMENTO / EXPEDIÇÃO -->
    <div class="type-badge uppercase">${orderTypeLabel}</div>

    <!-- AGENDAMENTO / ENCOMENDA -->
    ${
      order.scheduled_for
        ? `<div class="obs-box center">
            🗓️ AGENDADO PARA ENTREGA/RETIRADA:<br/>
            <span class="bolder" style="font-size: 12.5px;">${order.scheduled_for}</span>
           </div>`
        : ""
    }

    <div class="sep-dashed"></div>

    <!-- DADOS DO CLIENTE -->
    <div class="bold uppercase" style="font-size: 10.5px;">DADOS DO CLIENTE:</div>
    <div class="bolder" style="font-size: 12.5px;">${order.customer_name || "Cliente Balcão"}</div>
    <div style="font-size: 10.5px;">Fone: ${formatPhone(order.customer_phone) || "Não informado"}</div>

    <!-- ENDEREÇO DE ENTREGA SE FOR DELIVERY -->
    ${
      isDelivery
        ? `<div class="sep-dashed"></div>
           <div class="bold uppercase" style="font-size: 10.5px;">ENDEREÇO DE ENTREGA:</div>
           <div class="bolder" style="font-size: 11px;">
             ${addr?.street || "Endereço"}, Nº ${addr?.number || "S/N"}
           </div>
           ${addr?.complement ? `<div style="font-size: 10px;"><b>Compl:</b> ${addr.complement}</div>` : ""}
           <div style="font-size: 10.5px;">
             <b>Bairro:</b> ${addr?.neighborhood || order.neighborhood_name || "Geral"}
           </div>
           ${addr?.reference ? `<div style="font-size: 10px;"><b>Ponto de Ref:</b> ${addr.reference}</div>` : ""}`
        : ""
    }

    <div class="sep-double"></div>

    <!-- LISTA DE ITENS DO PEDIDO (ESTILO IFOOD) -->
    <div class="center bolder uppercase" style="font-size: 12px; letter-spacing: 0.5px;">
      ITENS DO PEDIDO
    </div>
    <div class="sep-dashed"></div>

    ${(order.items || [])
      .map((it, idx) => {
        const itemNumber = idx + 1;
        const totalItemStr = formatCurrency(it.total_price);
        const unitItemStr = formatCurrency(it.unit_price);

        return `
          <div class="item-row">
            <div class="flex bolder" style="font-size: 11.5px;">
              <span>[${itemNumber}] ${it.quantity}x ${it.product_name}</span>
              <span>${totalItemStr}</span>
            </div>
            <div class="item-sub">
              <div>Unitário: ${unitItemStr}</div>
              ${
                it.selected_variation
                  ? `<div class="bold">• Sabor/Tam: ${it.selected_variation.name}</div>`
                  : ""
              }
              ${
                it.selected_addons && it.selected_addons.length > 0
                  ? `<div>• Adicionais: ${it.selected_addons
                      .map((a) => `${a.name} (+${formatCurrency(a.price)})`)
                      .join(", ")}</div>`
                  : ""
              }
              ${
                it.custom_notes
                  ? `<div class="obs-box">>>> OBS: ${it.custom_notes.toUpperCase()} <<<</div>`
                  : ""
              }
            </div>
          </div>
          <div class="sep-dotted"></div>
        `;
      })
      .join("")}

    <!-- RESUMO FINANCEIRO (TOTAIS) -->
    <div class="sep-dashed"></div>
    <div class="flex" style="font-size: 10.5px;">
      <span>Subtotal dos itens:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>

    ${
      isDelivery
        ? `<div class="flex" style="font-size: 10.5px;">
             <span>Taxa de Entrega:</span>
             <span>${deliveryFee > 0 ? formatCurrency(deliveryFee) : "GRÁTIS"}</span>
           </div>`
        : ""
    }

    ${
      couponDiscount > 0
        ? `<div class="flex bold" style="font-size: 10.5px;">
             <span>Desconto Cupom (${order.coupon_code || "CUPOM"}):</span>
             <span>- ${formatCurrency(couponDiscount)}</span>
           </div>`
        : ""
    }

    ${
      manualDiscount > 0
        ? `<div class="flex bold" style="font-size: 10.5px;">
             <span>Desconto Especial (Balcão):</span>
             <span>- ${formatCurrency(manualDiscount)}</span>
           </div>`
        : ""
    }

    <div class="sep-double"></div>
    <div class="flex bolder" style="font-size: 14.5px;">
      <span>TOTAL A PAGAR:</span>
      <span>${formatCurrency(total)}</span>
    </div>
    <div class="sep-double"></div>

    <!-- FORMA DE PAGAMENTO & STATUS DE COBRANÇA -->
    <div class="bold uppercase" style="font-size: 10.5px;">PAGAMENTO:</div>
    <div class="flex bolder" style="font-size: 11.5px;">
      <span>FORMA:</span>
      <span>${paymentMethodLabel}</span>
    </div>
    <div class="flex" style="font-size: 11px;">
      <span>STATUS:</span>
      <span class="bolder" style="font-size: 11.5px;">
        ${isPaid ? ">>> PAGO [OK] <<<" : ">>> A COBRAR DO CLIENTE <<<"}
      </span>
    </div>

    ${
      order.payment_method === "cash" && cashChangeFor > 0
        ? `<div class="obs-box center">
             💵 CLIENTE VAI PAGAR COM: ${formatCurrency(cashChangeFor)}<br/>
             <span class="bolder" style="font-size: 12px;">LEVAR TROCO DE: ${formatCurrency(changeToReturn)}</span>
           </div>`
        : ""
    }

    ${
      order.cash_tendered
        ? `<div class="flex" style="font-size: 10px;">
             <span>Dinheiro Recebido:</span>
             <span>${formatCurrency(order.cash_tendered)}</span>
           </div>`
        : ""
    }

    ${
      order.change_due && order.change_due > 0
        ? `<div class="flex bold" style="font-size: 10.5px;">
             <span>Troco Devolvido:</span>
             <span>${formatCurrency(order.change_due)}</span>
           </div>`
        : ""
    }

    ${
      order.is_fiado
        ? `<div class="obs-box center">
             ⚠️ ANOTADO NO CADERNO (FIADO)<br/>
             Cobrar posteriormente conforme combinado.
           </div>`
        : ""
    }

    <!-- OBSERVAÇÕES GERAIS DO CLIENTE -->
    ${
      order.notes
        ? `<div class="sep-dashed"></div>
           <div class="bold uppercase" style="font-size: 10.5px;">OBSERVAÇÕES DO PEDIDO:</div>
           <div class="obs-box">"${order.notes}"</div>`
        : ""
    }

    <!-- RODAPÉ E PARADA DO PAPEL / CORTE -->
    <div class="sep-double"></div>
    <div class="center bold" style="font-size: 10.5px;">
      *** FIM DO PEDIDO #${order.order_number} ***
    </div>
    <div class="center" style="font-size: 9.5px; margin-top: 2px;">
      Confeitaria Artesanal Nice Doce Sabor ❤️<br/>
      Agradecemos a sua preferência!
    </div>
    <div class="sep-dashed" style="margin-top: 6px;"></div>
    <div class="cut-line">---------- CORTE AQUI ----------</div>
  </div>
</body>
</html>`;
}

/**
 * Dispara a impressão térmica em modo retrato (em pé) através de um iframe
 * invisível isolado do DOM da página. Isso garante 100% de precisão:
 * 1. Nunca sai deitada (retrato forçado a 72mm).
 * 2. O papel cessa e corta exatamente onde o texto da comanda termina (sem rolar espaço em branco).
 * 3. Não é bloqueado por bloqueadores de popups do navegador.
 */
export function printThermalReceipt(order: Order, store?: Store): void {
  if (typeof window === "undefined") return;

  const IFRAME_ID = "nice_thermal_print_iframe";
  let iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null;

  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement("iframe");
  iframe.id = IFRAME_ID;
  iframe.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc || !iframe.contentWindow) return;

  const html = generateThermalReceiptHTML(order, store);
  doc.open();
  doc.write(html);
  doc.close();

  // Espera renderizar fontes e dispara o diálogo de impressão nativo
  setTimeout(() => {
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch (e) {
      console.warn("Aviso ao disparar impressão térmica via iframe:", e);
      window.print();
    }
  }, 200);
}

/**
 * Gera o documento HTML do Fechamento de Caixa Diário para a impressora térmica.
 */
export function generateCashClosingHTML(
  summary: {
    date: string;
    count: number;
    totalDinheiro: number;
    totalPix: number;
    totalCartao: number;
    totalFiado: number;
    totalBalcao: number;
    totalOnline: number;
    totalGeral: number;
  },
  store?: Store
): string {
  const storeName = store?.name || "NICE DOCE SABOR";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Fechamento de Caixa - ${summary.date}</title>
  <style>
    @page { size: portrait; margin: 0mm !important; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 72mm !important;
      max-width: 72mm !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      background: #FFFFFF !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
    }
    .wrapper {
      width: 72mm !important;
      padding: 2mm 2.5mm 3mm 2.5mm !important;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    .flex { display: flex; justify-content: space-between; }
    .sep-double { border-bottom: 2px solid #000; margin: 4px 0; }
    .sep-dashed { border-bottom: 1px dashed #000; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="center bold uppercase" style="font-size: 15px;">${storeName}</div>
    <div class="center bolder uppercase" style="font-size: 13px;">FECHAMENTO DE CAIXA DO DIA</div>
    <div class="center" style="font-size: 11px;">Data: ${summary.date}</div>
    <div class="sep-double"></div>

    <div class="flex bolder" style="font-size: 12px;">
      <span>TOTAL DE PEDIDOS:</span>
      <span>${summary.count}</span>
    </div>

    <div class="sep-dashed"></div>
    <div class="bold uppercase">POR FORMA DE PAGAMENTO:</div>
    <div class="flex"><span>Dinheiro:</span><span>${formatCurrency(summary.totalDinheiro)}</span></div>
    <div class="flex"><span>PIX:</span><span>${formatCurrency(summary.totalPix)}</span></div>
    <div class="flex"><span>Cartão:</span><span>${formatCurrency(summary.totalCartao)}</span></div>
    <div class="flex"><span>Fiado / Pendente:</span><span>${formatCurrency(summary.totalFiado)}</span></div>

    <div class="sep-dashed"></div>
    <div class="bold uppercase">POR ORIGEM:</div>
    <div class="flex"><span>Balcão (PDV):</span><span>${formatCurrency(summary.totalBalcao)}</span></div>
    <div class="flex"><span>Cardápio Online:</span><span>${formatCurrency(summary.totalOnline)}</span></div>

    <div class="sep-double"></div>
    <div class="flex bolder" style="font-size: 14px;">
      <span>TOTAL DO CAIXA:</span>
      <span>${formatCurrency(summary.totalGeral)}</span>
    </div>
    <div class="sep-double"></div>

    <div class="center bold" style="font-size: 10px; margin-top: 5px;">
      Fechado por: Eunice Pereira (Dona)
    </div>
    <div class="sep-dashed" style="margin-top: 6px;"></div>
    <div class="center bold" style="font-size: 9px; letter-spacing: 1.5px;">---------- CORTE AQUI ----------</div>
  </div>
</body>
</html>`;
}

/**
 * Imprime o Fechamento de Caixa Diário via iframe térmico isolado.
 */
export function printCashClosing(
  summary: {
    date: string;
    count: number;
    totalDinheiro: number;
    totalPix: number;
    totalCartao: number;
    totalFiado: number;
    totalBalcao: number;
    totalOnline: number;
    totalGeral: number;
  },
  store?: Store
): void {
  if (typeof window === "undefined") return;

  const IFRAME_ID = "nice_cash_closing_iframe";
  let iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null;
  if (iframe) iframe.remove();

  iframe = document.createElement("iframe");
  iframe.id = IFRAME_ID;
  iframe.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc || !iframe.contentWindow) return;

  const html = generateCashClosingHTML(summary, store);
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch (e) {
      console.warn("Aviso ao imprimir fechamento de caixa:", e);
    }
  }, 200);
}
