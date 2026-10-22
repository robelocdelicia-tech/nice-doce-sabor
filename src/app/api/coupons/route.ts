import { NextRequest, NextResponse } from "next/server";
import { getServerCoupons, saveServerCoupons, normalizeCoupon } from "@/lib/serverCoupons";
import { Coupon } from "@/types";

export async function GET() {
  try {
    const coupons = await getServerCoupons();
    return NextResponse.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Erro ao listar cupons:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao listar cupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let updatedCoupons: Coupon[] = [];

    if (Array.isArray(body.coupons)) {
      updatedCoupons = body.coupons;
    } else if (body.coupon && typeof body.coupon === "object") {
      const current = await getServerCoupons();
      const newCoupon = normalizeCoupon(body.coupon);
      const exists = current.some((c) => c.code === newCoupon.code || c.id === newCoupon.id);
      if (exists) {
        updatedCoupons = current.map((c) =>
          c.code === newCoupon.code || c.id === newCoupon.id ? newCoupon : c
        );
      } else {
        updatedCoupons = [newCoupon, ...current];
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Corpo da requisição inválido" },
        { status: 400 }
      );
    }

    const saved = await saveServerCoupons(updatedCoupons);
    return NextResponse.json({
      success: true,
      coupons: saved,
    });
  } catch (error) {
    console.error("Erro ao salvar cupons:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao salvar cupons" },
      { status: 500 }
    );
  }
}
