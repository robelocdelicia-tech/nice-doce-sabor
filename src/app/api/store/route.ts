import { NextRequest, NextResponse } from "next/server";
import { getServerStore, saveServerStore } from "@/lib/serverData";

export async function GET() {
  try {
    const res = await getServerStore();
    return NextResponse.json({
      success: true,
      store: res.store,
      updated_at: res.updated_at,
      is_customized: res.is_customized,
    });
  } catch (error) {
    console.error("Erro ao carregar configurações da loja:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar loja" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const storeData = body.store || body;
    const updatedAt = typeof body.updated_at === "number" ? body.updated_at : Date.now();

    if (!storeData || typeof storeData !== "object" || !storeData.name) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos da loja" },
        { status: 400 }
      );
    }

    const saved = await saveServerStore(storeData, updatedAt);
    return NextResponse.json({
      success: true,
      store: saved.store,
      updated_at: saved.updated_at,
    });
  } catch (error) {
    console.error("Erro ao salvar loja no servidor:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar loja" },
      { status: 500 }
    );
  }
}
