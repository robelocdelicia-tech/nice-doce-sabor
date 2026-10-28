import { getStore } from "@netlify/blobs";
import os from "os";
import fs from "fs";
import path from "path";

// Nome da store global da confeitaria (compartilhada entre todos os links e dispositivos)
const STORE_NAME = "nice_data";

// Diretórios locais para fallback e espelhamento em disco
const PUBLIC_DATA_DIR = path.join(process.cwd(), "public", "data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "nice_data");

// Memória em runtime da instância atual
const memoryCache: Record<string, { data: any; updated_at?: number }> = {};

function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {}
}

function readDisk<T>(key: string): { data: T; updated_at?: number } | null {
  const filename = `${key}.json`;
  try {
    const pubPath = path.join(PUBLIC_DATA_DIR, filename);
    if (fs.existsSync(pubPath)) {
      const content = fs.readFileSync(pubPath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && "data" in parsed && "updated_at" in parsed) {
        return parsed;
      }
      return { data: parsed, updated_at: 0 };
    }
  } catch (err) {}

  try {
    const tmpPath = path.join(TMP_DATA_DIR, filename);
    if (fs.existsSync(tmpPath)) {
      const content = fs.readFileSync(tmpPath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && "data" in parsed && "updated_at" in parsed) {
        return parsed;
      }
      return { data: parsed, updated_at: 0 };
    }
  } catch (err) {}

  return null;
}

function writeDisk<T>(key: string, payload: { data: T; updated_at?: number }): void {
  const filename = `${key}.json`;
  try {
    ensureDir(PUBLIC_DATA_DIR);
    const pubPath = path.join(PUBLIC_DATA_DIR, filename);
    fs.writeFileSync(pubPath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {}

  try {
    ensureDir(TMP_DATA_DIR);
    const tmpPath = path.join(TMP_DATA_DIR, filename);
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {}
}

/**
 * Retorna a store do Netlify Blobs de forma segura.
 * Se estiver rodando fora do Netlify (ex: build ou dev local), retorna null sem quebrar.
 */
export function getNetlifyBlobStore() {
  try {
    return getStore(STORE_NAME);
  } catch (err) {
    return null;
  }
}

/**
 * Lê item da nuvem com suporte a Netlify Blobs, memória de runtime e fallback para disco
 */
export async function getCloudItem<T>(
  key: string,
  defaultValue: T
): Promise<{ data: T; updated_at: number; is_customized: boolean }> {
  // 1. Tenta ler do Netlify Blobs (armazenamento persistente em nuvem compartilhada)
  const store = getNetlifyBlobStore();
  if (store) {
    try {
      const blob = await store.get(key, { type: "json" });
      if (blob !== null && blob !== undefined) {
        let parsedData: T;
        let updatedAt = 0;

        if (blob && typeof blob === "object" && "data" in blob) {
          parsedData = blob.data as T;
          updatedAt = typeof blob.updated_at === "number" ? blob.updated_at : Date.now();
        } else {
          parsedData = blob as T;
          updatedAt = Date.now();
        }

        memoryCache[key] = { data: parsedData, updated_at: updatedAt };
        writeDisk(key, { data: parsedData, updated_at: updatedAt });
        return { data: parsedData, updated_at: updatedAt, is_customized: true };
      }
    } catch (err) {
      console.warn(`[CloudStore] Aviso ao ler "${key}" do Netlify Blobs:`, err);
    }
  }

  // 2. Tenta ler da memória da instância
  if (memoryCache[key]) {
    const cached = memoryCache[key];
    return {
      data: cached.data as T,
      updated_at: cached.updated_at || 0,
      is_customized: Boolean(cached.updated_at && cached.updated_at > 0),
    };
  }

  // 3. Tenta ler do disco local
  const disk = readDisk<T>(key);
  if (disk !== null && disk !== undefined) {
    memoryCache[key] = disk;
    return {
      data: disk.data,
      updated_at: disk.updated_at || 0,
      is_customized: Boolean(disk.updated_at && disk.updated_at > 0),
    };
  }

  // 4. Retorna valor padrão se ainda não foi salvo nada
  return { data: defaultValue, updated_at: 0, is_customized: false };
}

/**
 * Salva item na nuvem global (Netlify Blobs) e propaga para todas as camadas
 */
export async function setCloudItem<T>(
  key: string,
  data: T,
  updatedAt?: number
): Promise<{ success: boolean; updated_at: number }> {
  const ts = updatedAt && updatedAt > 0 ? updatedAt : Date.now();
  const payload = {
    data,
    updated_at: ts,
  };

  memoryCache[key] = payload;
  writeDisk(key, payload);

  // Grava no Netlify Blobs para persistência entre todos os dispositivos
  const store = getNetlifyBlobStore();
  if (store) {
    try {
      await store.setJSON(key, payload);
      return { success: true, updated_at: ts };
    } catch (err) {
      console.warn(`[CloudStore] Aviso ao salvar "${key}" no Netlify Blobs:`, err);
    }
  }

  return { success: true, updated_at: ts };
}

/**
 * Remove uma chave do armazenamento em nuvem
 */
export async function deleteCloudItem(key: string): Promise<boolean> {
  delete memoryCache[key];
  const store = getNetlifyBlobStore();
  if (store) {
    try {
      await store.delete(key);
      return true;
    } catch (err) {
      console.warn(`[CloudStore] Aviso ao deletar "${key}":`, err);
    }
  }
  return false;
}
