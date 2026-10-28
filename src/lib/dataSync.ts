import { Product, Store, Category, PromoBanner, Coupon, Order } from "@/types";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_STORE,
  DEFAULT_CATEGORIES,
  DEFAULT_PROMO_BANNERS,
  DEFAULT_COUPONS,
} from "@/lib/constants";
import { getDeletedCouponCodes, markCouponAsDeleted, filterDeletedCoupons } from "@/lib/couponStorage";

export const PRODUCTS_KEY = "nice_custom_products";
export const STORE_KEY = "nice_store_settings";
export const CATEGORIES_KEY = "nice_custom_categories";
export const BANNERS_KEY = "nice_promo_banners";
export const ORDERS_KEY = "nice_orders";

export const PRODUCTS_TS_KEY = "nice_products_updated_at";
export const STORE_TS_KEY = "nice_store_updated_at";
export const CATEGORIES_TS_KEY = "nice_categories_updated_at";
export const BANNERS_TS_KEY = "nice_banners_updated_at";

/**
 * Salva com segurança no localStorage prevenindo erros de QuotaExceeded
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`Aviso de cota no localStorage ao salvar "${key}":`, err);
    try {
      localStorage.removeItem("nice_products_v3_real");
      localStorage.removeItem("nice_temp_draft");
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.error(`Falha crítica ao persistir "${key}" no localStorage:`, e2);
      return false;
    }
  }
}

// ==========================================
// 1. PRODUTOS (FOTOS, DESCRIÇÕES, PREÇOS, SABORES)
// ==========================================
export function getInitialProducts(): Product[] {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {}
  return DEFAULT_PRODUCTS;
}

export function saveProductsSync(products: Product[], explicitTs?: number): void {
  if (typeof window === "undefined" || !Array.isArray(products)) return;
  const ts = explicitTs || Date.now();

  safeSetItem(PRODUCTS_KEY, JSON.stringify(products));
  safeSetItem(PRODUCTS_TS_KEY, String(ts));

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("products_update", { detail: products }));

  // Envia para a nuvem compartilhada garantindo atualização para todos os dispositivos
  fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products, updated_at: ts }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar produtos com a nuvem:", e));
}

export async function fetchProductsFromServer(): Promise<Product[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    const data = await res.json();

    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      const serverTs = typeof data.updated_at === "number" ? data.updated_at : 0;
      const localTs = parseInt(localStorage.getItem(PRODUCTS_TS_KEY) || "0", 10);
      const rawLocal = localStorage.getItem(PRODUCTS_KEY);

      // Se o dispositivo local tiver alterações mais recentes, NÃO sobrepõe! Envia as alterações locais para a nuvem.
      if (localTs > serverTs && rawLocal) {
        try {
          const localProds = JSON.parse(rawLocal);
          if (Array.isArray(localProds) && localProds.length > 0) {
            fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ products: localProds, updated_at: localTs }),
            }).catch(() => {});
            return localProds;
          }
        } catch (e) {}
      }

      // Se a nuvem tiver dados customizados ou mais novos, atualiza o cache local
      safeSetItem(PRODUCTS_KEY, JSON.stringify(data.products));
      if (serverTs > 0) {
        safeSetItem(PRODUCTS_TS_KEY, String(serverTs));
      }
      return data.products;
    }
  } catch (err) {
    console.warn("Aviso ao buscar produtos do servidor:", err);
  }
  return null;
}

// ==========================================
// 2. CONFIGURAÇÕES DA LOJA (HORÁRIOS, NOME, PIX)
// ==========================================
export function getInitialStore(): Store {
  if (typeof window === "undefined") return DEFAULT_STORE;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.name) {
        return parsed;
      }
    }
  } catch (err) {}
  return DEFAULT_STORE;
}

export function saveStoreSync(store: Store, explicitTs?: number): void {
  if (typeof window === "undefined" || !store) return;
  const ts = explicitTs || Date.now();

  safeSetItem(STORE_KEY, JSON.stringify(store));
  safeSetItem(STORE_TS_KEY, String(ts));

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("store_update", { detail: store }));

  fetch("/api/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store, updated_at: ts }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar loja com a nuvem:", e));
}

export async function fetchStoreFromServer(): Promise<Store | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/store", { cache: "no-store" });
    const data = await res.json();

    if (data.success && data.store && data.store.name) {
      const serverTs = typeof data.updated_at === "number" ? data.updated_at : 0;
      const localTs = parseInt(localStorage.getItem(STORE_TS_KEY) || "0", 10);
      const rawLocal = localStorage.getItem(STORE_KEY);

      if (localTs > serverTs && rawLocal) {
        try {
          const localStore = JSON.parse(rawLocal);
          if (localStore && localStore.name) {
            fetch("/api/store", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ store: localStore, updated_at: localTs }),
            }).catch(() => {});
            return localStore;
          }
        } catch (e) {}
      }

      safeSetItem(STORE_KEY, JSON.stringify(data.store));
      if (serverTs > 0) {
        safeSetItem(STORE_TS_KEY, String(serverTs));
      }
      return data.store;
    }
  } catch (err) {
    console.warn("Aviso ao buscar loja do servidor:", err);
  }
  return null;
}

// ==========================================
// 3. CATEGORIAS
// ==========================================
export function getInitialCategories(): Category[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {}
  return DEFAULT_CATEGORIES;
}

export function saveCategoriesSync(categories: Category[], explicitTs?: number): void {
  if (typeof window === "undefined" || !Array.isArray(categories)) return;
  const ts = explicitTs || Date.now();

  safeSetItem(CATEGORIES_KEY, JSON.stringify(categories));
  safeSetItem(CATEGORIES_TS_KEY, String(ts));

  window.dispatchEvent(new Event("storage"));

  fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories, updated_at: ts }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar categorias:", e));
}

export async function fetchCategoriesFromServer(): Promise<Category[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/categories", { cache: "no-store" });
    const data = await res.json();
    if (data.success && Array.isArray(data.categories)) {
      safeSetItem(CATEGORIES_KEY, JSON.stringify(data.categories));
      return data.categories;
    }
  } catch (err) {}
  return null;
}

// ==========================================
// 4. BANNERS
// ==========================================
export function getInitialBanners(): PromoBanner[] {
  if (typeof window === "undefined") return DEFAULT_PROMO_BANNERS;
  try {
    const raw = localStorage.getItem(BANNERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {}
  return DEFAULT_PROMO_BANNERS;
}

export function saveBannersSync(banners: PromoBanner[], explicitTs?: number): void {
  if (typeof window === "undefined" || !Array.isArray(banners)) return;
  const ts = explicitTs || Date.now();

  safeSetItem(BANNERS_KEY, JSON.stringify(banners));
  safeSetItem(BANNERS_TS_KEY, String(ts));

  window.dispatchEvent(new Event("storage"));

  fetch("/api/banners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ banners, updated_at: ts }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar banners:", e));
}

export async function fetchBannersFromServer(): Promise<PromoBanner[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/banners", { cache: "no-store" });
    const data = await res.json();
    if (data.success && Array.isArray(data.banners)) {
      safeSetItem(BANNERS_KEY, JSON.stringify(data.banners));
      return data.banners;
    }
  } catch (err) {}
  return null;
}

// ==========================================
// 5. CUPONS (SINCRONIZAÇÃO TOTAL COM BLACKLIST DA NUVEM)
// ==========================================
export async function syncCouponsWithCloud(): Promise<{ coupons: Coupon[]; deleted_codes: string[] }> {
  if (typeof window === "undefined") return { coupons: DEFAULT_COUPONS, deleted_codes: [] };
  try {
    const res = await fetch("/api/coupons", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      // 1. Atualiza lista negra de códigos deletados recebidos da nuvem
      if (Array.isArray(data.deleted_codes)) {
        data.deleted_codes.forEach((code: string) => {
          if (code) markCouponAsDeleted(code);
        });
      }

      // 2. Filtra cupons válidos
      if (Array.isArray(data.coupons)) {
        const safeList = filterDeletedCoupons(data.coupons);
        safeSetItem("nice_custom_coupons", JSON.stringify(safeList));
        safeSetItem("nice_coupons_v2_initialized", "true");
        window.dispatchEvent(new CustomEvent("coupons_update", { detail: safeList }));
        return { coupons: safeList, deleted_codes: data.deleted_codes || [] };
      }
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar cupons com a nuvem:", err);
  }

  return { coupons: [], deleted_codes: getDeletedCouponCodes() };
}

// ==========================================
// 6. PEDIDOS (SINCRONIZAÇÃO MULTI-DISPOSITIVO)
// ==========================================
export async function fetchOrdersFromCloud(): Promise<Order[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/orders", { cache: "no-store" });
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      safeSetItem(ORDERS_KEY, JSON.stringify(data.orders));
      return data.orders;
    }
  } catch (err) {}
  return null;
}

export async function syncOrderUpdateToCloud(order: Order): Promise<void> {
  if (typeof window === "undefined" || !order) return;
  fetch("/api/orders", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao atualizar pedido na nuvem:", e));
}
