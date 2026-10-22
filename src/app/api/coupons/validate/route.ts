import { NextRequest, NextResponse } from "next/server";
import { Coupon, CartItem } from "@/types";
import { DEFAULT_COUPONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      subtotal = 0,
      delivery_fee = 0,
      items = [],
      order_type = "pickup",
      customer_phone = "",
    } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Código do cupom não informado." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    let coupon: Coupon | null = null;
    let customerUsageCount = 0;

    // 1. Tenta buscar no Supabase
    const supabase = createClient();
    if (supabase) {
      const { data: dbCoupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", cleanCode)
        .maybeSingle();

      if (dbCoupon) {
        coupon = dbCoupon;
      }

      if (customer_phone && coupon) {
        const cleanPhone = customer_phone.replace(/\D/g, "");
        const { count } = await supabase
          .from("coupon_usages")
          .select("id", { count: "exact", head: true })
          .eq("coupon_code", cleanCode)
          .eq("customer_phone", cleanPhone);
        customerUsageCount = count || 0;
      }
    }

    // Fallback: se não estiver no Supabase, procura nos cupons padrão / localStorage
    if (!coupon) {
      coupon = DEFAULT_COUPONS.find((c) => c.code === cleanCode) || null;
    }

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "Cupom inválido ou não encontrado.",
      });
    }

    // 2. Validações de Atividade e Vigência
    if (!coupon.is_active) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "Este cupom não está mais ativo.",
      });
    }

    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "Este cupom ainda não começou a valer.",
      });
    }

    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "Este cupom já expirou.",
      });
    }

    // 3. Validação de Limite Global de Usos
    if (coupon.max_uses && (coupon.uses_count ?? 0) >= coupon.max_uses) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "Este cupom atingiu o limite máximo de utilizações.",
      });
    }

    // 4. Validação de Limite por Cliente (Telefone)
    if (
      coupon.max_uses_per_customer &&
      customerUsageCount >= coupon.max_uses_per_customer
    ) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "Você já atingiu o limite de utilizações deste cupom para seu número.",
      });
    }

    // 5. Validação de Tipo de Pedido (Retirada ou Entrega)
    if (
      coupon.order_type_allowed &&
      coupon.order_type_allowed !== "all" &&
      coupon.order_type_allowed !== order_type
    ) {
      const label =
        coupon.order_type_allowed === "pickup"
          ? "apenas para Retirada no balcão"
          : "apenas para pedidos de Entrega";
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: `Este cupom é válido ${label}.`,
      });
    }

    // 6. Validação de Valor Mínimo do Pedido
    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      const minFmt = coupon.min_order_value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: `Pedido mínimo de ${minFmt} para utilizar este cupom.`,
      });
    }

    // 7. Cálculo do Desconto de acordo com o Escopo
    let eligibleSubtotal = subtotal;

    if (coupon.scope === "category" && coupon.target_ids && coupon.target_ids.length > 0) {
      eligibleSubtotal = (items as CartItem[]).reduce((acc, item) => {
        if (coupon?.target_ids?.includes(item.product.category_id || "")) {
          return acc + item.total_price;
        }
        return acc;
      }, 0);

      if (eligibleSubtotal <= 0) {
        return NextResponse.json({
          valid: false,
          discount: 0,
          message: "Este cupom é válido apenas para categorias selecionadas.",
        });
      }
    } else if (
      coupon.scope === "products" &&
      coupon.target_ids &&
      coupon.target_ids.length > 0
    ) {
      eligibleSubtotal = (items as CartItem[]).reduce((acc, item) => {
        if (coupon?.target_ids?.includes(item.product.id)) {
          return acc + item.total_price;
        }
        return acc;
      }, 0);

      if (eligibleSubtotal <= 0) {
        return NextResponse.json({
          valid: false,
          discount: 0,
          message: "Este cupom é válido apenas para produtos específicos que não estão no seu carrinho.",
        });
      }
    }

    let calculatedDiscount = 0;

    if (coupon.scope === "delivery") {
      calculatedDiscount = delivery_fee;
    } else if (coupon.discount_type === "percent") {
      calculatedDiscount = (eligibleSubtotal * coupon.discount_value) / 100;
    } else {
      calculatedDiscount = Math.min(coupon.discount_value, eligibleSubtotal);
    }

    // Aplica Teto Máximo de Desconto se configurado
    if (coupon.max_discount_cap && coupon.max_discount_cap > 0) {
      calculatedDiscount = Math.min(calculatedDiscount, coupon.max_discount_cap);
    }

    // Garante precisão decimal
    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    return NextResponse.json({
      valid: true,
      discount: calculatedDiscount,
      message: `Cupom ${coupon.code} aplicado com sucesso!`,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        scope: coupon.scope,
      },
    });
  } catch (error) {
    console.error("Erro na validação do cupom:", error);
    return NextResponse.json(
      { valid: false, discount: 0, message: "Erro ao processar cupom." },
      { status: 500 }
    );
  }
}
