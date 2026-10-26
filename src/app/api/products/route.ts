import { NextRequest, NextResponse } from "next/server";
import { getServerProducts, saveServerProducts } from "@/lib/serverData";

export async function GET() {
  try {
    const products = await getServerProducts();
    return NextResponse.json({
      success: true,
      products,
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

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: "Formato inválido. Esperava array de produtos." },
        { status: 400 }
      );
    }

    const saved = await saveServerProducts(products);
    return NextResponse.json({
      success: true,
      products: saved,
    });
  } catch (error) {
    console.error("Erro ao salvar produtos no servidor:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar produtos" },
      { status: 500 }
    );
  }
}
