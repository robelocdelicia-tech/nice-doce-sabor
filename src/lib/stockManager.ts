import { Product, OrderItem, StockMovement, StockMovementType } from "@/types";
import { saveProductsSync } from "@/lib/dataSync";

const MOVEMENTS_STORAGE_KEY = "nice_stock_movements";
const PRODUCTS_STORAGE_KEY = "nice_custom_products";

/**
 * Carrega o histórico completo de movimentações de estoque (entradas, saídas, perdas e ajustes)
 */
export function getStockMovements(): StockMovement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Erro ao carregar movimentações de estoque:", err);
  }
  return [];
}

/**
 * Salva o histórico de movimentações no localStorage
 */
function saveStockMovements(movements: StockMovement[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
    window.dispatchEvent(new Event("stock_update"));
  } catch (err) {
    console.error("Erro ao salvar movimentações de estoque:", err);
  }
}

/**
 * Registra uma nova movimentação de estoque (entrada, saída, perda ou ajuste)
 */
export function recordStockMovement(
  movement: Omit<StockMovement, "id" | "created_at">
): StockMovement {
  const newMovement: StockMovement = {
    ...movement,
    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  const current = getStockMovements();
  const updated = [newMovement, ...current];
  saveStockMovements(updated);
  return newMovement;
}

/**
 * Carrega a lista atual de produtos com estoque
 */
export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {}
  return [];
}

/**
 * Salva a lista de produtos atualizada e despacha evento para re-renderizar
 */
export function saveStoredProducts(products: Product[]) {
  if (typeof window === "undefined" || !Array.isArray(products)) return;
  try {
    saveProductsSync(products);
    window.dispatchEvent(new Event("stock_update"));
  } catch (err) {
    console.error("Erro ao persistir produtos com estoque:", err);
  }
}

/**
 * REGISTRAR ENTRADA DE ESTOQUE (PRODUÇÃO / REPOSIÇÃO)
 * Exemplo: Dona Eunice produziu +5 bolos de pote e cadastra no sistema.
 */
export function addStockEntry(
  productId: string,
  quantity: number,
  reason: string = "Entrada de Produção",
  variationName?: string
): { success: boolean; newStock: number; message: string } {
  if (quantity <= 0) {
    return { success: false, newStock: 0, message: "A quantidade deve ser maior que zero." };
  }

  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === productId);

  if (index === -1) {
    return { success: false, newStock: 0, message: "Produto não encontrado." };
  }

  const prod = products[index];
  const prevStock = prod.current_stock || 0;
  const newStock = prevStock + quantity;

  // Atualiza também variação se aplicável
  let updatedVariations = prod.variations;
  if (variationName && prod.variations) {
    updatedVariations = prod.variations.map((v) => {
      if (v.name.trim().toLowerCase() === variationName.trim().toLowerCase()) {
        const vPrev = v.stock_quantity || 0;
        return { ...v, stock_quantity: vPrev + quantity, is_paused: false };
      }
      return v;
    });
  }

  // Atualiza o produto: ativa controle de estoque se não estava e despausa caso estivesse pausado
  products[index] = {
    ...prod,
    stock_control_enabled: true,
    current_stock: newStock,
    is_paused: false,
    is_sold_out: false,
    variations: updatedVariations,
  };

  saveStoredProducts(products);

  // Registra a movimentação no histórico
  recordStockMovement({
    product_id: prod.id,
    product_name: prod.name,
    variation_name: variationName || null,
    type: "entry",
    quantity: quantity,
    previous_stock: prevStock,
    new_stock: newStock,
    reason: reason.trim() || "Produção / Reposição",
  });

  return {
    success: true,
    newStock,
    message: `${quantity} unidade(s) adicionada(s) ao estoque de "${prod.name}" com sucesso!`,
  };
}

/**
 * AJUSTE MANUAL OU PERDA DE ESTOQUE
 */
export function adjustOrLossStock(
  productId: string,
  quantityDelta: number, // positivo para adicionar, negativo para subtrair
  type: "adjustment" | "loss",
  reason: string = "Ajuste de Estoque",
  variationName?: string
): { success: boolean; newStock: number; message: string } {
  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === productId);

  if (index === -1) {
    return { success: false, newStock: 0, message: "Produto não encontrado." };
  }

  const prod = products[index];
  const prevStock = prod.current_stock || 0;
  const newStock = Math.max(0, prevStock + quantityDelta);

  products[index] = {
    ...prod,
    current_stock: newStock,
    is_paused: newStock === 0 ? true : prod.is_paused,
    is_sold_out: newStock === 0,
  };

  saveStoredProducts(products);

  recordStockMovement({
    product_id: prod.id,
    product_name: prod.name,
    variation_name: variationName || null,
    type,
    quantity: quantityDelta,
    previous_stock: prevStock,
    new_stock: newStock,
    reason: reason.trim() || (type === "loss" ? "Perda / Avaria" : "Ajuste Manual"),
  });

  return {
    success: true,
    newStock,
    message: `Estoque de "${prod.name}" ajustado de ${prevStock} para ${newStock} un.`,
  };
}

/**
 * BAIXA AUTOMÁTICA DE ESTOQUE POR VENDA DE PEDIDO
 * Disparado automaticamente assim que o pedido é finalizado no Cardápio Online ou PDV.
 */
export function deductStockForOrder(
  items: OrderItem[],
  orderNumber: number,
  orderId?: string
) {
  if (!items || items.length === 0) return;

  const products = getStoredProducts();
  let hasChanges = false;

  items.forEach((it) => {
    const prodId = it.product_id;
    const qty = it.quantity || 1;
    const varName = it.selected_variation?.name;

    const index = products.findIndex(
      (p) => p.id === prodId || p.name.trim().toLowerCase() === it.product_name.trim().toLowerCase()
    );

    if (index > -1) {
      const prod = products[index];
      // Só aplica baixa se o produto tiver controle de estoque ativo ou tiver saldo registrado
      if (prod.stock_control_enabled || typeof prod.current_stock === "number") {
        const prevStock = prod.current_stock || 0;
        const newStock = Math.max(0, prevStock - qty);

        let updatedVars = prod.variations;
        if (varName && prod.variations) {
          updatedVars = prod.variations.map((v) => {
            if (v.name.trim().toLowerCase() === varName.trim().toLowerCase()) {
              const vPrev = v.stock_quantity || 0;
              const vNew = Math.max(0, vPrev - qty);
              return {
                ...v,
                stock_quantity: vNew,
                is_paused: vNew === 0 ? true : v.is_paused,
              };
            }
            return v;
          });
        }

        // Se zerou o estoque, pausa o produto automaticamente para não vender o que não tem
        const shouldPause = newStock === 0;

        products[index] = {
          ...prod,
          current_stock: newStock,
          is_paused: shouldPause ? true : prod.is_paused,
          is_sold_out: shouldPause,
          variations: updatedVars,
        };

        hasChanges = true;

        recordStockMovement({
          product_id: prod.id,
          product_name: prod.name,
          variation_name: varName || null,
          type: "sale",
          quantity: -qty,
          previous_stock: prevStock,
          new_stock: newStock,
          reason: `Venda - Pedido #${orderNumber}`,
          order_id: orderId,
          order_number: orderNumber,
        });
      }
    }
  });

  if (hasChanges) {
    saveStoredProducts(products);
  }
}

/**
 * ESTATÍSTICAS E RESUMO DE ESTOQUE
 */
export function getStockAnalytics(products: Product[]) {
  const movements = getStockMovements();

  let totalItemsInStock = 0;
  let controlledProductsCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    if (p.is_archived) return;
    if (p.stock_control_enabled || typeof p.current_stock === "number") {
      controlledProductsCount += 1;
      const stock = p.current_stock || 0;
      totalItemsInStock += stock;
      const alertThreshold = p.min_stock_alert ?? 2;

      if (stock === 0) {
        outOfStockCount += 1;
      } else if (stock <= alertThreshold) {
        lowStockCount += 1;
      }
    }
  });

  // Movimentações do mês atual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthEntriesCount = 0;
  let monthSalesCount = 0;

  movements.forEach((m) => {
    const mDate = new Date(m.created_at);
    if (mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear) {
      if (m.type === "entry") {
        monthEntriesCount += m.quantity;
      } else if (m.type === "sale") {
        monthSalesCount += Math.abs(m.quantity);
      }
    }
  });

  return {
    totalItemsInStock,
    controlledProductsCount,
    lowStockCount,
    outOfStockCount,
    monthEntriesCount,
    monthSalesCount,
    totalMovements: movements.length,
  };
}
