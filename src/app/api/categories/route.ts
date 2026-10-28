import { NextRequest, NextResponse } from "next/server";
import { getServerCategories, saveServerCategories } from "@/lib/serverData";

export async function GET() {
  try {
    const res = await getServerCategories();
    return NextResponse.json({
      success: true,
      categories: res.categories,
      updated_at: res.updated_at,
      is_customized: res.is_customized,
    });
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar categorias" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const categories = body.categories || body;
    const updatedAt = typeof body.updated_at === "number" ? body.updated_at : Date.now();

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: "Array de categorias inválido" },
        { status: 400 }
      );
    }

    const saved = await saveServerCategories(categories, updatedAt);
    return NextResponse.json({
      success: true,
      categories: saved.categories,
      updated_at: saved.updated_at,
    });
  } catch (error) {
    console.error("Erro ao salvar categorias:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar categorias" },
      { status: 500 }
    );
  }
}
