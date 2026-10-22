import { Order, Product, BestSellersConfig } from "@/types";

export interface BestSellerItem {
  product_id: string;
  name: string;
  total_quantity: number;
  total_revenue: number;
  product?: Product;
}

/**
 * Filtra pedidos válidos (ignorando cancelados) pelo período selecionado
 */
export function filterOrdersByPeriod(
  orders: Order[],
  period: "7d" | "30d" | "month" | "all"
): Order[] {
  const now = new Date();
  const validOrders = orders.filter(
    (o) => o.order_status !== "cancelled" && o.status !== "cancelado"
  );

  if (period === "all") return validOrders;

  const cutoff = new Date();
  if (period === "7d") {
    cutoff.setDate(now.getDate() - 7);
  } else if (period === "30d") {
    cutoff.setDate(now.getDate() - 30);
  } else if (period === "month") {
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);
  }

  return validOrders.filter((o) => {
    const orderDate = new Date(o.created_at || Date.now());
    return orderDate >= cutoff;
  });
}

/**
 * Calcula o ranking dos produtos mais vendidos
 */
export function calculateBestSellers(
  orders: Order[],
  products: Product[],
  period: "7d" | "30d" | "month" | "all" = "30d",
  config?: BestSellersConfig
): BestSellerItem[] {
  const periodOrders = filterOrdersByPeriod(orders, period);
  const salesMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  // Agrega quantidade e faturamento por produto
  periodOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const prodId = item.product_id || item.product_name;
      const existing = salesMap.get(prodId) || {
        name: item.product_name || item.name || "Item",
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.total_price;
      salesMap.set(prodId, existing);
    });
  });

  const productLookup = new Map(products.map((p) => [p.id, p]));

  // Converte para lista
  let list: BestSellerItem[] = Array.from(salesMap.entries()).map(([productId, data]) => ({
    product_id: productId,
    name: data.name,
    total_quantity: data.quantity,
    total_revenue: data.revenue,
    product: productLookup.get(productId),
  }));

  // Ordena por quantidade vendida decrescente (e desempata por faturamento)
  list.sort((a, b) => b.total_quantity - a.total_quantity || b.total_revenue - a.total_revenue);

  // Se houver configuração manual
  const manualIds = config?.manual_product_ids || config?.pinned_product_ids || [];
  if (config?.mode === "manual" && manualIds.length > 0) {
    const manualItems: BestSellerItem[] = [];
    const addedIds = new Set<string>();

    manualIds.forEach((id: string) => {
      const found = list.find((item) => item.product_id === id);
      const prod = productLookup.get(id);
      if (prod) {
        manualItems.push({
          product_id: id,
          name: prod.name,
          total_quantity: found ? found.total_quantity : 0,
          total_revenue: found ? found.total_revenue : 0,
          product: prod,
        });
        addedIds.add(id);
      }
    });

    // Se ainda restarem vagas até o limite, completa com os mais vendidos automáticos
    const limit = config?.display_limit || config?.limit || 6;
    for (const item of list) {
      if (manualItems.length >= limit) break;
      if (!addedIds.has(item.product_id)) {
        manualItems.push(item);
        addedIds.add(item.product_id);
      }
    }

    return manualItems.slice(0, limit);
  }

  const limit = config?.display_limit || config?.limit || 6;
  return list.slice(0, limit);
}
