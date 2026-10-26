import os from "os";
import fs from "fs";
import path from "path";
import { Product, Store, Category, PromoBanner } from "@/types";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_STORE,
  DEFAULT_CATEGORIES,
  DEFAULT_PROMO_BANNERS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

// Diretórios de persistência
const PUBLIC_DATA_DIR = path.join(process.cwd(), "public", "data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "nice_data");

// Memória em runtime
let memoryProducts: Product[] | null = null;
let memoryStore: Store | null = null;
let memoryCategories: Category[] | null = null;
let memoryBanners: PromoBanner[] | null = null;

function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {}
}

function readJSON<T>(filename: string): T | null {
  // 1. Tenta ler do diretório public/data
  try {
    const pubPath = path.join(PUBLIC_DATA_DIR, filename);
    if (fs.existsSync(pubPath)) {
      const content = fs.readFileSync(pubPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {}

  // 2. Tenta ler do os.tmpdir
  try {
    const tmpPath = path.join(TMP_DATA_DIR, filename);
    if (fs.existsSync(tmpPath)) {
      const content = fs.readFileSync(tmpPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {}

  return null;
}

function writeJSON<T>(filename: string, data: T): void {
  // Escreve em public/data se possível
  try {
    ensureDir(PUBLIC_DATA_DIR);
    const pubPath = path.join(PUBLIC_DATA_DIR, filename);
    fs.writeFileSync(pubPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {}

  // Espelha em os.tmpdir
  try {
    ensureDir(TMP_DATA_DIR);
    const tmpPath = path.join(TMP_DATA_DIR, filename);
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {}
}

// ==========================================
// 1. PRODUTOS (FOTOS, DESCRIÇÕES, PREÇOS, SABORES)
// ==========================================
export async function getServerProducts(): Promise<Product[]> {
  if (memoryProducts && memoryProducts.length > 0) {
    return memoryProducts;
  }

  const fromDisk = readJSON<Product[]>("products.json");
  if (fromDisk && Array.isArray(fromDisk) && fromDisk.length > 0) {
    memoryProducts = fromDisk;
    return fromDisk;
  }

  try {
    const supabase = createClient();
    if (supabase) {
      const { data: dbProds, error } = await supabase.from("products").select("*");
      if (!error && dbProds && dbProds.length > 0) {
        memoryProducts = dbProds;
        writeJSON("products.json", dbProds);
        return dbProds;
      }
    }
  } catch (err) {}

  memoryProducts = DEFAULT_PRODUCTS;
  writeJSON("products.json", DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

export async function saveServerProducts(products: Product[]): Promise<Product[]> {
  if (!Array.isArray(products) || products.length === 0) {
    return memoryProducts || DEFAULT_PRODUCTS;
  }

  memoryProducts = products;
  writeJSON("products.json", products);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from("products").upsert(products, { onConflict: "id" });
    }
  } catch (err) {}

  return products;
}

// ==========================================
// 2. CONFIGURAÇÕES DA LOJA (HORÁRIOS, NOME, PIX)
// ==========================================
export async function getServerStore(): Promise<Store> {
  if (memoryStore) {
    return memoryStore;
  }

  const fromDisk = readJSON<Store>("store.json");
  if (fromDisk && typeof fromDisk === "object" && fromDisk.name) {
    memoryStore = fromDisk;
    return fromDisk;
  }

  try {
    const supabase = createClient();
    if (supabase) {
      const { data: dbStore, error } = await supabase.from("stores").select("*").limit(1).single();
      if (!error && dbStore) {
        memoryStore = dbStore;
        writeJSON("store.json", dbStore);
        return dbStore;
      }
    }
  } catch (err) {}

  memoryStore = DEFAULT_STORE;
  writeJSON("store.json", DEFAULT_STORE);
  return DEFAULT_STORE;
}

export async function saveServerStore(store: Store): Promise<Store> {
  if (!store || !store.name) {
    return memoryStore || DEFAULT_STORE;
  }

  memoryStore = store;
  writeJSON("store.json", store);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from("stores").upsert(store, { onConflict: "id" });
    }
  } catch (err) {}

  return store;
}

// ==========================================
// 3. CATEGORIAS DO CARDÁPIO
// ==========================================
export async function getServerCategories(): Promise<Category[]> {
  if (memoryCategories && memoryCategories.length > 0) {
    return memoryCategories;
  }

  const fromDisk = readJSON<Category[]>("categories.json");
  if (fromDisk && Array.isArray(fromDisk) && fromDisk.length > 0) {
    memoryCategories = fromDisk;
    return fromDisk;
  }

  memoryCategories = DEFAULT_CATEGORIES;
  writeJSON("categories.json", DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export async function saveServerCategories(categories: Category[]): Promise<Category[]> {
  if (!Array.isArray(categories)) {
    return memoryCategories || DEFAULT_CATEGORIES;
  }

  memoryCategories = categories;
  writeJSON("categories.json", categories);
  return categories;
}

// ==========================================
// 4. BANNERS PROMOCIONAIS
// ==========================================
export async function getServerBanners(): Promise<PromoBanner[]> {
  if (memoryBanners && memoryBanners.length > 0) {
    return memoryBanners;
  }

  const fromDisk = readJSON<PromoBanner[]>("banners.json");
  if (fromDisk && Array.isArray(fromDisk)) {
    memoryBanners = fromDisk;
    return fromDisk;
  }

  memoryBanners = DEFAULT_PROMO_BANNERS;
  writeJSON("banners.json", DEFAULT_PROMO_BANNERS);
  return DEFAULT_PROMO_BANNERS;
}

export async function saveServerBanners(banners: PromoBanner[]): Promise<PromoBanner[]> {
  if (!Array.isArray(banners)) {
    return memoryBanners || DEFAULT_PROMO_BANNERS;
  }

  memoryBanners = banners;
  writeJSON("banners.json", banners);
  return banners;
}
