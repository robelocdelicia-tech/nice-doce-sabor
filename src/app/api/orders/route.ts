import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/types";

// Memória local em runtime para fallback caso o Supabase não esteja conectado
let memoryOrders: Order[] = [];

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    orders: memoryOrders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: Order = await request.json();

    if (!body.customer_name || !body.customer_phone) {
      return NextResponse.json(
        { success: false, error: "Nome e WhatsApp são obrigatórios." },
        { status: 400 }
      );
    }

    const orderWithTimestamp: Order = {
      ...body,
      created_at: body.created_at || new Date().toISOString(),
    };

    memoryOrders = [orderWithTimestamp, ...memoryOrders];

    return NextResponse.json({
      success: true,
      order: orderWithTimestamp,
    });
  } catch (error) {
    console.error("Erro na API de pedidos:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar pedido." },
      { status: 500 }
    );
  }
}
