import { Coupon } from "@/types";
import { DEFAULT_COUPONS } from "@/lib/constants";

export const COUPONS_STORAGE_KEY = "nice_custom_coupons";
export const DELETED_COUPONS_KEY = "nice_deleted_coupon_codes";
export const COUPONS_INIT_KEY = "nice_coupons_v2_initialized";

/**
 * Retorna os códigos de cupons que foram excluídos pelo usuário (em maiúsculo).
 */
export function getDeletedCouponCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_COUPONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((c) => String(c).trim().toUpperCase());
      }
    }
  } catch (e) {}
  return [];
}

/**
 * Adiciona um código à lista negra permanente de cupons excluídos.
 */
export function markCouponAsDeleted(code: string): string[] {
  if (typeof window === "undefined" || !code) return [];
  const cleanCode = code.trim().toUpperCase();
  const current = new Set(getDeletedCouponCodes());
  current.add(cleanCode);
  const list = Array.from(current);
  try {
    localStorage.setItem(DELETED_COUPONS_KEY, JSON.stringify(list));
  } catch (e) {}
  return list;
}

/**
 * Filtra qualquer lista de cupons removendo códigos que foram excluídos permanentemente.
 */
export function filterDeletedCoupons(coupons: Coupon[]): Coupon[] {
  if (!Array.isArray(coupons)) return [];
  const deleted = new Set(getDeletedCouponCodes());
  return coupons.filter((c) => {
    if (!c || !c.code) return false;
    return !deleted.has(c.code.trim().toUpperCase());
  });
}

/**
 * Retorna os cupons salvos pelo usuário garantindo que nenhum cupom excluído retorne.
 */
export function getStoredCoupons(): Coupon[] {
  if (typeof window === "undefined") return DEFAULT_COUPONS;
  try {
    const isInitialized = localStorage.getItem(COUPONS_INIT_KEY);
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Retorna a lista salva (mesmo que vazia []), filtrada de códigos deletados
        return filterDeletedCoupons(parsed);
      }
    }

    // Se ainda não foi inicializado nenhuma vez, usa DEFAULT_COUPONS sem os excluídos
    if (!isInitialized) {
      localStorage.setItem(COUPONS_INIT_KEY, "true");
      const initial = filterDeletedCoupons(DEFAULT_COUPONS);
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    // Se já foi inicializado e não tinha dados salvos, retorna array vazio para não recriar os antigos
    return [];
  } catch (e) {
    console.error("Erro ao ler cupons do localStorage:", e);
    return [];
  }
}

/**
 * Salva a lista de cupons de forma permanente e sincroniza com a API / Servidor.
 */
export function saveStoredCoupons(coupons: Coupon[], newlyDeletedCode?: string): Coupon[] {
  if (typeof window === "undefined") return coupons;
  try {
    if (newlyDeletedCode) {
      markCouponAsDeleted(newlyDeletedCode);
    }

    const filtered = filterDeletedCoupons(coupons);
    const deletedCodes = getDeletedCouponCodes();

    localStorage.setItem(COUPONS_INIT_KEY, "true");
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(filtered));

    // Notifica re-render em outras abas e componentes
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("coupons_update", { detail: filtered }));

    // Sincroniza com a API do servidor informando tanto os cupons válidos quanto os códigos deletados
    fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coupons: filtered,
        deleted_codes: deletedCodes,
        updated_at: Date.now(),
      }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.deleted_codes)) {
          data.deleted_codes.forEach((code: string) => {
            if (code) markCouponAsDeleted(code);
          });
        }
      })
      .catch(() => {});

    if (newlyDeletedCode) {
      fetch(`/api/coupons?code=${encodeURIComponent(newlyDeletedCode.trim().toUpperCase())}`, {
        method: "DELETE",
        keepalive: true,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.deleted_codes)) {
            data.deleted_codes.forEach((code: string) => {
              if (code) markCouponAsDeleted(code);
            });
          }
        })
        .catch(() => {});
    }

    return filtered;
  } catch (e) {
    console.error("Erro ao salvar cupons:", e);
    return coupons;
  }
}

/**
 * Exclui permanentemente um cupom pelo código ou ID.
 */
export function deleteStoredCoupon(codeOrId: string): Coupon[] {
  if (typeof window === "undefined") return [];
  const cleanTarget = codeOrId.trim().toUpperCase();
  markCouponAsDeleted(cleanTarget);

  const current = getStoredCoupons();
  const updated = current.filter(
    (c) => c.id !== codeOrId && c.code.trim().toUpperCase() !== cleanTarget
  );

  return saveStoredCoupons(updated, cleanTarget);
}
