import { Product, Store, Category, PromoBanner } from "@/types";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_STORE,
  DEFAULT_CATEGORIES,
  DEFAULT_PROMO_BANNERS,
} from "@/lib/constants";

export const PRODUCTS_KEY = "nice_custom_products";
export const STORE_KEY = "nice_store_settings";
export const CATEGORIES_KEY = "nice_custom_categories";
export const BANNERS_KEY = "nice_promo_banners";

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
      // Tenta liberar caches secundários desnecessários
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

export function saveProductsSync(products: Product[]): void {
  if (typeof window === "undefined" || !Array.isArray(products)) return;
  safeSetItem(PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("products_update", { detail: products }));

  fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar produtos com a nuvem:", e));
}

export async function fetchProductsFromServer(): Promise<Product[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      safeSetItem(PRODUCTS_KEY, JSON.stringify(data.products));
      return data.products;
    }
  } catch (err) {}
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

export function saveStoreSync(store: Store): void {
  if (typeof window === "undefined" || !store) return;
  safeSetItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("store_update", { detail: store }));

  fetch("/api/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar loja com a nuvem:", e));
}

export async function fetchStoreFromServer(): Promise<Store | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/store");
    const data = await res.json();
    if (data.success && data.store && data.store.name) {
      safeSetItem(STORE_KEY, JSON.stringify(data.store));
      return data.store;
    }
  } catch (err) {}
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

export function saveCategoriesSync(categories: Category[]): void {
  if (typeof window === "undefined" || !Array.isArray(categories)) return;
  safeSetItem(CATEGORIES_KEY, JSON.stringify(categories));
  window.dispatchEvent(new Event("storage"));

  fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar categorias:", e));
}

export async function fetchCategoriesFromServer(): Promise<Category[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/categories");
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

export function saveBannersSync(banners: PromoBanner[]): void {
  if (typeof window === "undefined" || !Array.isArray(banners)) return;
  safeSetItem(BANNERS_KEY, JSON.stringify(banners));
  window.dispatchEvent(new Event("storage"));

  fetch("/api/banners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ banners }),
    keepalive: true,
  }).catch((e) => console.warn("Aviso ao sincronizar banners:", e));
}

export async function fetchBannersFromServer(): Promise<PromoBanner[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/banners");
    const data = await res.json();
    if (data.success && Array.isArray(data.banners)) {
      safeSetItem(BANNERS_KEY, JSON.stringify(data.banners));
      return data.banners;
    }
  } catch (err) {}
  return null;
}
