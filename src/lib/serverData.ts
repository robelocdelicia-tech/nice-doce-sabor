import { Product, Store, Category, PromoBanner } from "@/types";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_STORE,
  DEFAULT_CATEGORIES,
  DEFAULT_PROMO_BANNERS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getCloudItem, setCloudItem } from "@/lib/cloudStorage";

// ==========================================
// 1. PRODUTOS (FOTOS, DESCRIÇÕES, PREÇOS, SABORES)
// ==========================================
export async function getServerProducts(): Promise<{
  products: Product[];
  updated_at: number;
  is_customized: boolean;
}> {
  // 1. Lê do armazenamento em nuvem (Netlify Blobs)
  const cloud = await getCloudItem<Product[]>("products", DEFAULT_PRODUCTS);
  if (cloud.is_customized && Array.isArray(cloud.data) && cloud.data.length > 0) {
    return {
      products: cloud.data,
      updated_at: cloud.updated_at,
      is_customized: true,
    };
  }

  // 2. Se não houver dados customizados na nuvem, tenta Supabase se configurado
  try {
    const supabase = createClient();
    if (supabase) {
      const { data: dbProds, error } = await supabase.from("products").select("*");
      if (!error && dbProds && dbProds.length > 0) {
        await setCloudItem("products", dbProds, Date.now());
        return {
          products: dbProds,
          updated_at: Date.now(),
          is_customized: true,
        };
      }
    }
  } catch (err) {}

  return {
    products: cloud.data || DEFAULT_PRODUCTS,
    updated_at: cloud.updated_at || 0,
    is_customized: cloud.is_customized,
  };
}

export async function saveServerProducts(
  products: Product[],
  updatedAt?: number
): Promise<{ products: Product[]; updated_at: number }> {
  if (!Array.isArray(products) || products.length === 0) {
    const current = await getServerProducts();
    return { products: current.products, updated_at: current.updated_at };
  }

  const res = await setCloudItem("products", products, updatedAt);

  // Espelha no Supabase se configurado
  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from("products").upsert(products, { onConflict: "id" });
    }
  } catch (err) {}

  return { products, updated_at: res.updated_at };
}

// ==========================================
// 2. CONFIGURAÇÕES DA LOJA (HORÁRIOS, NOME, PIX)
// ==========================================
export async function getServerStore(): Promise<{
  store: Store;
  updated_at: number;
  is_customized: boolean;
}> {
  const cloud = await getCloudItem<Store>("store", DEFAULT_STORE);
  if (cloud.is_customized && cloud.data && cloud.data.name) {
    return {
      store: cloud.data,
      updated_at: cloud.updated_at,
      is_customized: true,
    };
  }

  try {
    const supabase = createClient();
    if (supabase) {
      const { data: dbStore, error } = await supabase
        .from("stores")
        .select("*")
        .limit(1)
        .single();
      if (!error && dbStore && dbStore.name) {
        await setCloudItem("store", dbStore, Date.now());
        return {
          store: dbStore,
          updated_at: Date.now(),
          is_customized: true,
        };
      }
    }
  } catch (err) {}

  return {
    store: cloud.data || DEFAULT_STORE,
    updated_at: cloud.updated_at || 0,
    is_customized: cloud.is_customized,
  };
}

export async function saveServerStore(
  store: Store,
  updatedAt?: number
): Promise<{ store: Store; updated_at: number }> {
  if (!store || !store.name) {
    const current = await getServerStore();
    return { store: current.store, updated_at: current.updated_at };
  }

  const res = await setCloudItem("store", store, updatedAt);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from("stores").upsert(store, { onConflict: "id" });
    }
  } catch (err) {}

  return { store, updated_at: res.updated_at };
}

// ==========================================
// 3. CATEGORIAS DO CARDÁPIO
// ==========================================
export async function getServerCategories(): Promise<{
  categories: Category[];
  updated_at: number;
  is_customized: boolean;
}> {
  const cloud = await getCloudItem<Category[]>("categories", DEFAULT_CATEGORIES);
  return {
    categories: cloud.data || DEFAULT_CATEGORIES,
    updated_at: cloud.updated_at || 0,
    is_customized: cloud.is_customized,
  };
}

export async function saveServerCategories(
  categories: Category[],
  updatedAt?: number
): Promise<{ categories: Category[]; updated_at: number }> {
  if (!Array.isArray(categories)) {
    const current = await getServerCategories();
    return { categories: current.categories, updated_at: current.updated_at };
  }

  const res = await setCloudItem("categories", categories, updatedAt);
  return { categories, updated_at: res.updated_at };
}

// ==========================================
// 4. BANNERS PROMOCIONAIS
// ==========================================
export async function getServerBanners(): Promise<{
  banners: PromoBanner[];
  updated_at: number;
  is_customized: boolean;
}> {
  const cloud = await getCloudItem<PromoBanner[]>("banners", DEFAULT_PROMO_BANNERS);
  return {
    banners: cloud.data || DEFAULT_PROMO_BANNERS,
    updated_at: cloud.updated_at || 0,
    is_customized: cloud.is_customized,
  };
}

export async function saveServerBanners(
  banners: PromoBanner[],
  updatedAt?: number
): Promise<{ banners: PromoBanner[]; updated_at: number }> {
  if (!Array.isArray(banners)) {
    const current = await getServerBanners();
    return { banners: current.banners, updated_at: current.updated_at };
  }

  const res = await setCloudItem("banners", banners, updatedAt);
  return { banners, updated_at: res.updated_at };
}
