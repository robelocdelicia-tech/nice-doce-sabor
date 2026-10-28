import { Coupon } from "@/types";
import { DEFAULT_COUPONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getCloudItem, setCloudItem } from "@/lib/cloudStorage";

// Memória em runtime
let memoryCoupons: Coupon[] = [...DEFAULT_COUPONS];
let memoryDeletedCodes: Set<string> = new Set();
let deletedCodesLoaded = false;

export async function loadDeletedCodes(): Promise<Set<string>> {
  try {
    const cloud = await getCloudItem<string[]>("deleted_coupons", []);
    if (Array.isArray(cloud.data)) {
      memoryDeletedCodes = new Set(cloud.data.map((c) => String(c).trim().toUpperCase()));
      deletedCodesLoaded = true;
      return memoryDeletedCodes;
    }
  } catch (err) {}
  return memoryDeletedCodes;
}

export function isCouponDeleted(code: string): boolean {
  if (!code) return false;
  return memoryDeletedCodes.has(code.trim().toUpperCase());
}

export async function checkCouponDeleted(code: string): Promise<boolean> {
  if (!code) return false;
  if (!deletedCodesLoaded) {
    await loadDeletedCodes();
  }
  return memoryDeletedCodes.has(code.trim().toUpperCase());
}

export async function saveDeletedCodes(codes: Set<string>, updatedAt?: number): Promise<void> {
  memoryDeletedCodes = codes;
  await setCloudItem("deleted_coupons", Array.from(codes), updatedAt);
}

// Normaliza campos do cupom para garantir total interoperabilidade
export function normalizeCoupon(c: any): Coupon {
  const isPercent =
    c.discount_type === "percentage" ||
    c.discount_type === "percent" ||
    String(c.discount_type).toLowerCase().includes("percent");

  const discountType = isPercent ? "percentage" : "fixed";

  const rawScope = c.scope || "all";
  const scope =
    rawScope === "products" || rawScope === "product"
      ? "product"
      : rawScope === "category"
      ? "category"
      : rawScope === "delivery"
      ? "delivery"
      : "all";

  const maxCap =
    typeof c.max_discount_cap === "number"
      ? c.max_discount_cap
      : typeof c.max_discount_value === "number"
      ? c.max_discount_value
      : undefined;

  const maxUses =
    typeof c.max_uses === "number"
      ? c.max_uses
      : typeof c.usage_limit_total === "number"
      ? c.usage_limit_total
      : undefined;

  const maxUsesCustomer =
    typeof c.max_uses_per_customer === "number"
      ? c.max_uses_per_customer
      : typeof c.usage_limit_per_customer === "number"
      ? c.usage_limit_per_customer
      : 1;

  const orderType = c.order_type_restriction || c.order_type_allowed || "all";

  const targetIds: string[] = Array.isArray(c.target_ids)
    ? c.target_ids
    : c.scope_category_id
    ? [c.scope_category_id]
    : Array.isArray(c.scope_product_ids)
    ? c.scope_product_ids
    : [];

  return {
    ...c,
    id: c.id || `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: String(c.code || "").trim().toUpperCase(),
    name: c.name || c.code,
    discount_type: discountType,
    discount_value: Number(c.discount_value) || 0,
    scope,
    target_ids: targetIds,
    scope_category_id: c.scope_category_id || (scope === "category" ? targetIds[0] : undefined),
    scope_product_ids: c.scope_product_ids || (scope === "product" ? targetIds : undefined),
    min_order_value: c.min_order_value ? Number(c.min_order_value) : undefined,
    max_discount_cap: maxCap,
    max_discount_value: maxCap,
    start_date: c.start_date || undefined,
    end_date: c.end_date || undefined,
    max_uses: maxUses,
    usage_limit_total: maxUses,
    uses_count: Number(c.uses_count) || 0,
    max_uses_per_customer: maxUsesCustomer,
    usage_limit_per_customer: maxUsesCustomer,
    first_order_only: Boolean(c.first_order_only || c.first_purchase_only),
    first_purchase_only: Boolean(c.first_order_only || c.first_purchase_only),
    order_type_allowed: orderType,
    order_type_restriction: orderType,
    is_active: c.is_active !== false,
    show_banner: c.show_banner !== false && c.show_on_menu !== false,
    show_on_menu: c.show_banner !== false && c.show_on_menu !== false,
    banner_text: c.banner_text || undefined,
    revenue_generated: Number(c.revenue_generated) || 0,
    total_discount_given: Number(c.total_discount_given) || 0,
    created_at: c.created_at || new Date().toISOString(),
  };
}

// Carrega todos os cupons com metadados (Netlify Blobs + Supabase + Defaults ignorando deletados)
export async function getServerCouponsMeta(): Promise<{
  coupons: Coupon[];
  deleted_codes: string[];
  updated_at: number;
  is_customized: boolean;
}> {
  const deletedCodes = await loadDeletedCodes();

  // 1. Tenta carregar do Netlify Blobs
  const cloud = await getCloudItem<Coupon[]>("coupons", DEFAULT_COUPONS);
  const rawList = Array.isArray(cloud.data) ? cloud.data : DEFAULT_COUPONS;

  const activeList = rawList
    .filter((c) => !deletedCodes.has(c.code.trim().toUpperCase()))
    .map(normalizeCoupon);

  memoryCoupons = activeList;

  // 2. Se não houver cupons customizados, tenta Supabase se configurado
  if (!cloud.is_customized) {
    try {
      const supabase = createClient();
      if (supabase) {
        const { data: dbCoupons, error } = await supabase.from("coupons").select("*");
        if (!error && dbCoupons && dbCoupons.length > 0) {
          const dbList = dbCoupons
            .filter((dbc) => !deletedCodes.has(dbc.code?.trim().toUpperCase()))
            .map(normalizeCoupon);
          memoryCoupons = dbList;
          await setCloudItem("coupons", dbList, Date.now());
          return {
            coupons: dbList,
            deleted_codes: Array.from(deletedCodes),
            updated_at: Date.now(),
            is_customized: true,
          };
        }
      }
    } catch (err) {}
  }

  return {
    coupons: activeList,
    deleted_codes: Array.from(deletedCodes),
    updated_at: cloud.updated_at || 0,
    is_customized: cloud.is_customized,
  };
}

// Carrega todos os cupons (compatibilidade)
export async function getServerCoupons(): Promise<Coupon[]> {
  const meta = await getServerCouponsMeta();
  return meta.coupons;
}

// Salva e atualiza cupons no servidor com sincronização persistente na nuvem
export async function saveServerCoupons(
  coupons: Coupon[],
  explicitDeletedCodes?: string[],
  updatedAt?: number
): Promise<{
  coupons: Coupon[];
  deleted_codes: string[];
  updated_at: number;
}> {
  const ts = updatedAt && updatedAt > 0 ? updatedAt : Date.now();
  const normalized = coupons.map(normalizeCoupon);
  const deletedCodes = await loadDeletedCodes();

  if (Array.isArray(explicitDeletedCodes)) {
    explicitDeletedCodes.forEach((code) => {
      if (code) deletedCodes.add(String(code).trim().toUpperCase());
    });
  }

  const currentCodes = new Set(normalized.map((c) => c.code.trim().toUpperCase()));

  // Cupons padrão que não estão na lista são marcados como deletados permanentemente
  DEFAULT_COUPONS.forEach((dc) => {
    const cCode = dc.code.trim().toUpperCase();
    if (!currentCodes.has(cCode)) {
      deletedCodes.add(cCode);
    }
  });

  memoryCoupons.forEach((pm) => {
    const pCode = pm.code.trim().toUpperCase();
    if (!currentCodes.has(pCode)) {
      deletedCodes.add(pCode);
    }
  });

  await saveDeletedCodes(deletedCodes, ts);

  const filtered = normalized.filter((c) => !deletedCodes.has(c.code.trim().toUpperCase()));
  memoryCoupons = filtered;
  await setCloudItem("coupons", filtered, ts);

  // Espelha no Supabase se disponível
  try {
    const supabase = createClient();
    if (supabase) {
      const { data: dbAll } = await supabase.from("coupons").select("id, code");
      if (dbAll && dbAll.length > 0) {
        const toDeleteIds = dbAll
          .filter((d) => !currentCodes.has(d.code?.trim().toUpperCase()))
          .map((d) => d.id);

        if (toDeleteIds.length > 0) {
          await supabase.from("coupons").delete().in("id", toDeleteIds);
        }
      }

      if (filtered.length > 0) {
        const rows = filtered.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          discount_type:
            c.discount_type === "percentage" || c.discount_type === "percent" ? "percent" : "fixed",
          discount_value: c.discount_value,
          scope: c.scope === "product" ? "products" : c.scope,
          target_ids: c.target_ids || [],
          min_order_value: c.min_order_value || null,
          max_discount_cap: c.max_discount_cap || null,
          start_date: c.start_date || null,
          end_date: c.end_date || null,
          max_uses: c.max_uses || null,
          uses_count: c.uses_count || 0,
          max_uses_per_customer: c.max_uses_per_customer || 1,
          first_order_only: c.first_order_only || false,
          order_type_allowed: c.order_type_allowed || "all",
          is_active: c.is_active,
          show_banner: c.show_banner,
          banner_text: c.banner_text || null,
        }));

        await supabase.from("coupons").upsert(rows, { onConflict: "code" });
      }
    }
  } catch (err) {
    console.warn("Aviso ao salvar cupons no Supabase:", err);
  }

  return {
    coupons: filtered,
    deleted_codes: Array.from(deletedCodes),
    updated_at: ts,
  };
}

// Exclusão definitiva de um cupom com remoção na nuvem
export async function deleteServerCoupon(
  idOrCode: string
): Promise<{
  success: boolean;
  coupons: Coupon[];
  deleted_codes: string[];
  updated_at: number;
}> {
  const clean = String(idOrCode || "").trim().toUpperCase();
  if (!clean) {
    const meta = await getServerCouponsMeta();
    return { success: false, coupons: meta.coupons, deleted_codes: meta.deleted_codes, updated_at: meta.updated_at };
  }

  const deletedCodes = await loadDeletedCodes();
  const target = memoryCoupons.find(
    (c) => c.id === idOrCode || c.code.toUpperCase() === clean
  );
  const codeToDelete = target ? target.code.toUpperCase() : clean;

  if (codeToDelete) {
    deletedCodes.add(codeToDelete);
  }

  const ts = Date.now();
  await saveDeletedCodes(deletedCodes, ts);

  memoryCoupons = memoryCoupons.filter(
    (c) => c.id !== idOrCode && c.code.toUpperCase() !== codeToDelete
  );

  await setCloudItem("coupons", memoryCoupons, ts);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase
        .from("coupons")
        .delete()
        .or(`id.eq.${idOrCode},code.eq.${codeToDelete}`);
    }
  } catch (err) {
    console.warn("Aviso ao excluir cupom no Supabase:", err);
  }

  return {
    success: true,
    coupons: memoryCoupons,
    deleted_codes: Array.from(deletedCodes),
    updated_at: ts,
  };
}

export interface ValidationItem {
  product_id?: string;
  category_id?: string;
  quantity?: number;
  total_price?: number;
  product?: {
    id: string;
    category_id?: string;
  };
}

export interface CouponCalculationResult {
  valid: boolean;
  discount: number;
  discount_amount: number;
  message: string;
  coupon?: Coupon;
}

// Função unificada de cálculo e validação de cupom
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotal: number,
  deliveryFee: number,
  items: ValidationItem[] = [],
  orderType: string = "pickup",
  customerPhone?: string,
  customerUsageCount: number = 0
): CouponCalculationResult {
  const norm = normalizeCoupon(coupon);

  // 1. Atividade
  if (!norm.is_active) {
    return {
      valid: false,
      discount: 0,
      discount_amount: 0,
      message: "Este cupom não está mais ativo.",
    };
  }

  // 2. Vigência de data
  const now = new Date();
  if (norm.start_date && new Date(norm.start_date) > now) {
    return {
      valid: false,
      discount: 0,
      discount_amount: 0,
      message: "Este cupom ainda não começou a valer.",
    };
  }

  if (norm.end_date && new Date(norm.end_date) < now) {
    return {
      valid: false,
      discount: 0,
      discount_amount: 0,
      message: "Este cupom já expirou.",
    };
  }

  // 3. Limite total de usos
  if (norm.max_uses && (norm.uses_count ?? 0) >= norm.max_uses) {
    return {
      valid: false,
      discount: 0,
      discount_amount: 0,
      message: "Este cupom atingiu o limite máximo de utilizações.",
    };
  }

  // 4. Limite por cliente (telefone)
  if (norm.max_uses_per_customer && customerUsageCount >= norm.max_uses_per_customer) {
    return {
      valid: false,
      discount: 0,
      discount_amount: 0,
      message: "Você já atingiu o limite de utilizações deste cupom para seu WhatsApp.",
    };
  }

  // 5. Restrição de Entrega vs Retirada
  const allowedOrderType = norm.order_type_allowed || norm.order_type_restriction || "all";
  if (allowedOrderType !== "all" && allowedOrderType !== orderType) {
    const label =
      allowedOrderType === "pickup"
        ? "apenas para Retirada no balcão"
        : "apenas para pedidos com Entrega";
    return {
      valid: false,
      discount: 0,
      discount_amount: 0,
      message: `Este cupom é válido ${label}.`,
    };
  }

  // 6. Pedido mínimo
  if (norm.min_order_value && subtotal < norm.min_order_value) {
    const minFmt = norm.min_order_value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return {
      valid: false,
      discount: 0,
      discount_amount: 0,
      message: `Pedido mínimo de ${minFmt} para ativar este cupom (seu pedido atual: ${subtotal.toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" }
      )}).`,
    };
  }

  // 7. Base de cálculo do desconto pelo escopo
  let eligibleSubtotal = subtotal;

  if (norm.scope === "category") {
    const targetCats = [
      ...(norm.target_ids || []),
      ...(norm.scope_category_id ? [norm.scope_category_id] : []),
    ];

    if (targetCats.length > 0) {
      eligibleSubtotal = items.reduce((acc, it) => {
        const catId = it.category_id || it.product?.category_id || "";
        const itemPrice = Number(it.total_price) || 0;
        if (targetCats.includes(catId)) {
          return acc + itemPrice;
        }
        return acc;
      }, 0);

      if (eligibleSubtotal <= 0) {
        return {
          valid: false,
          discount: 0,
          discount_amount: 0,
          message: "Este cupom é válido apenas para categorias específicas que não estão no seu carrinho.",
        };
      }
    }
  } else if (norm.scope === "product") {
    const targetProds = [
      ...(norm.target_ids || []),
      ...(norm.scope_product_ids || []),
    ];

    if (targetProds.length > 0) {
      eligibleSubtotal = items.reduce((acc, it) => {
        const prodId = it.product_id || it.product?.id || "";
        const itemPrice = Number(it.total_price) || 0;
        if (targetProds.includes(prodId)) {
          return acc + itemPrice;
        }
        return acc;
      }, 0);

      if (eligibleSubtotal <= 0) {
        return {
          valid: false,
          discount: 0,
          discount_amount: 0,
          message: "Este cupom é válido apenas para produtos específicos que não estão no seu carrinho.",
        };
      }
    }
  }

  // 8. Cálculo matemático do desconto
  let calculatedDiscount = 0;

  if (norm.scope === "delivery") {
    calculatedDiscount = deliveryFee;
  } else if (norm.discount_type === "percentage" || (norm as any).discount_type === "percent") {
    calculatedDiscount = (eligibleSubtotal * norm.discount_value) / 100;
  } else {
    calculatedDiscount = Math.min(norm.discount_value, eligibleSubtotal);
  }

  // Teto máximo de desconto se configurado
  const maxCap = norm.max_discount_cap ?? norm.max_discount_value;
  if (maxCap && maxCap > 0) {
    calculatedDiscount = Math.min(calculatedDiscount, maxCap);
  }

  // Garante que o desconto não exceda o subtotal elegível (ou taxa de entrega) e seja positivo
  calculatedDiscount = Math.max(0, Math.round(calculatedDiscount * 100) / 100);

  return {
    valid: true,
    discount: calculatedDiscount,
    discount_amount: calculatedDiscount,
    message: `Cupom ${norm.code} aplicado com sucesso!`,
    coupon: norm,
  };
}
