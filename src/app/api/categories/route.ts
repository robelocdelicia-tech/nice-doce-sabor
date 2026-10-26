import { NextRequest, NextResponse } from "next/server";
import { getServerCategories, saveServerCategories } from "@/lib/serverData";

export async function GET() {
  try {
    const categories = await getServerCategories();
    return NextResponse.json({
      success: true,
      categories,
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

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: "Array de categorias inválido" },
        { status: 400 }
      );
    }

    const saved = await saveServerCategories(categories);
    return NextResponse.json({
      success: true,
      categories: saved,
    });
  } catch (error) {
    console.error("Erro ao salvar categorias:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar categorias" },
      { status: 500 }
    );
  }
}
