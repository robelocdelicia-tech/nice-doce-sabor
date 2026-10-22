import { NextRequest, NextResponse } from "next/server";
import {
  getServerCoupons,
  saveServerCoupons,
  deleteServerCoupon,
  normalizeCoupon,
} from "@/lib/serverCoupons";
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
      const exists = current.some(
        (c) => c.code.toUpperCase() === newCoupon.code.toUpperCase() || c.id === newCoupon.id
      );
      if (exists) {
        updatedCoupons = current.map((c) =>
          c.code.toUpperCase() === newCoupon.code.toUpperCase() || c.id === newCoupon.id
            ? newCoupon
            : c
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

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paramId = url.searchParams.get("id");
    const paramCode = url.searchParams.get("code");

    let idOrCode = paramId || paramCode;
    if (!idOrCode) {
      try {
        const body = await request.json();
        idOrCode = body.id || body.code;
      } catch (e) {}
    }

    if (!idOrCode) {
      return NextResponse.json(
        { success: false, error: "ID ou código do cupom não informado" },
        { status: 400 }
      );
    }

    await deleteServerCoupon(idOrCode);
    const updated = await getServerCoupons();

    return NextResponse.json({
      success: true,
      coupons: updated,
    });
  } catch (error) {
    console.error("Erro ao excluir cupom:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao excluir cupom" },
      { status: 500 }
    );
  }
}
