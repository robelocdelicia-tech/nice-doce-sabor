import fs from "fs";
import path from "path";
import { Coupon } from "@/types";
import { DEFAULT_COUPONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

// Caminho de fallback para persistência local dos cupons no servidor
const CACHE_FILE_PATH = path.join(process.cwd(), ".next", "nice_custom_coupons.json");

// Memória em runtime
let memoryCoupons: Coupon[] = [...DEFAULT_COUPONS];

// Inicialização: tenta carregar do arquivo de cache local
function loadFromDisk(): Coupon[] {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const content = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    // Falha silenciosa em ambientes somente-leitura (ex: Vercel/Netlify read-only /var/task)
  }
  return memoryCoupons;
}

function saveToDisk(coupons: Coupon[]) {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(coupons, null, 2), "utf-8");
  } catch (err) {
    // Falha silenciosa
  }
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
    created_at: c.created_at || new Date().toISOString(),
  };
}

// Carrega todos os cupons (Supabase + Disco/Memória + Defaults)
export async function getServerCoupons(): Promise<Coupon[]> {
  let list = loadFromDisk();

  // Garante que os cupons padrão existam na lista
  const codeMap = new Map<string, Coupon>();
  DEFAULT_COUPONS.forEach((dc) => codeMap.set(dc.code.toUpperCase(), normalizeCoupon(dc)));
  list.forEach((c) => codeMap.set(c.code.toUpperCase(), normalizeCoupon(c)));

  try {
    const supabase = createClient();
    if (supabase) {
      const { data: dbCoupons, error } = await supabase
        .from("coupons")
        .select("*");

      if (!error && dbCoupons && dbCoupons.length > 0) {
        dbCoupons.forEach((dbc) => codeMap.set(dbc.code.toUpperCase(), normalizeCoupon(dbc)));
      }
    }
  } catch (err) {
    // Falha silenciosa de Supabase
  }

  const result = Array.from(codeMap.values());
  memoryCoupons = result;
  return result;
}

// Salva e atualiza cupons no servidor
export async function saveServerCoupons(coupons: Coupon[]): Promise<Coupon[]> {
  const normalized = coupons.map(normalizeCoupon);
  memoryCoupons = normalized;
  saveToDisk(normalized);

  try {
    const supabase = createClient();
    if (supabase) {
      // Upsert dos cupons no Supabase
      await supabase.from("coupons").upsert(
        normalized.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          discount_type: c.discount_type,
          discount_value: c.discount_value,
          scope: c.scope,
          target_ids: c.target_ids || [],
          scope_category_id: c.scope_category_id || null,
          scope_product_ids: c.scope_product_ids || [],
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
        })),
        { onConflict: "code" }
      );
    }
  } catch (err) {
    console.warn("Aviso ao salvar cupons no Supabase:", err);
  }

  return normalized;
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
