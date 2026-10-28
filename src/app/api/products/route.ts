import { NextRequest, NextResponse } from "next/server";
import { getServerProducts, saveServerProducts } from "@/lib/serverData";

export async function GET() {
  try {
    const res = await getServerProducts();
    return NextResponse.json({
      success: true,
      products: res.products,
      updated_at: res.updated_at,
      is_customized: res.is_customized,
    });
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao listar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const products = body.products || body;
    const updatedAt = typeof body.updated_at === "number" ? body.updated_at : Date.now();

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: "Formato inválido. Esperava array de produtos." },
        { status: 400 }
      );
    }

    const saved = await saveServerProducts(products, updatedAt);
    return NextResponse.json({
      success: true,
      products: saved.products,
      updated_at: saved.updated_at,
    });
  } catch (error) {
    console.error("Erro ao salvar produtos no servidor:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar produtos" },
      { status: 500 }
    );
  }
}
