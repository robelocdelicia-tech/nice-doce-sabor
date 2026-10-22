import { NextRequest, NextResponse } from "next/server";
import { Coupon } from "@/types";
import { DEFAULT_COUPONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import {
  getServerCoupons,
  calculateCouponDiscount,
  normalizeCoupon,
  ValidationItem,
} from "@/lib/serverCoupons";

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
      client_coupons = [],
    } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        {
          valid: false,
          discount: 0,
          discount_amount: 0,
          message: "Código do cupom não informado.",
        },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    let coupon: Coupon | null = null;
    let customerUsageCount = 0;

    // 1. Procura nos cupons do servidor (cache / Supabase)
    const serverCoupons = await getServerCoupons();
    const foundServer = serverCoupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (foundServer) {
      coupon = foundServer;
    }

    // 2. Se não encontrou, tenta nos cupons enviados pelo cliente (fallback de localStorage)
    if (!coupon && Array.isArray(client_coupons)) {
      const foundClient = client_coupons.find(
        (c: any) => String(c?.code || "").trim().toUpperCase() === cleanCode
      );
      if (foundClient) {
        coupon = normalizeCoupon(foundClient);
      }
    }

    // 3. Fallback final nos cupons padrão do sistema
    if (!coupon) {
      const foundDefault = DEFAULT_COUPONS.find(
        (c) => c.code.toUpperCase() === cleanCode
      );
      if (foundDefault) {
        coupon = normalizeCoupon(foundDefault);
      }
    }

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        discount_amount: 0,
        message: "Cupom não encontrado ou inválido.",
      });
    }

    // 4. Se tiver WhatsApp informado, consulta histórico de usos se Supabase estiver ativo
    if (customer_phone) {
      try {
        const supabase = createClient();
        if (supabase) {
          const cleanPhone = customer_phone.replace(/\D/g, "");
          const { count } = await supabase
            .from("coupon_usages")
            .select("id", { count: "exact", head: true })
            .eq("coupon_code", cleanCode)
            .eq("customer_phone", cleanPhone);
          customerUsageCount = count || 0;
        }
      } catch (err) {
        console.warn("Aviso ao checar usos de cupom por cliente:", err);
      }
    }

    // 5. Executa cálculo seguro de elegibilidade e valor do desconto
    const calculation = calculateCouponDiscount(
      coupon,
      Number(subtotal) || 0,
      Number(delivery_fee) || 0,
      items as ValidationItem[],
      order_type,
      customer_phone,
      customerUsageCount
    );

    return NextResponse.json(calculation);
  } catch (error) {
    console.error("Erro interno ao validar cupom:", error);
    return NextResponse.json(
      {
        valid: false,
        discount: 0,
        discount_amount: 0,
        message: "Erro ao validar cupom. Verifique os dados e tente novamente.",
      },
      { status: 500 }
    );
  }
}
