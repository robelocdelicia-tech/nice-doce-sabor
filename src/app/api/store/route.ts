import { NextRequest, NextResponse } from "next/server";
import { getServerStore, saveServerStore } from "@/lib/serverData";

export async function GET() {
  try {
    const store = await getServerStore();
    return NextResponse.json({
      success: true,
      store,
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

    if (!storeData || typeof storeData !== "object" || !storeData.name) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos da loja" },
        { status: 400 }
      );
    }

    const saved = await saveServerStore(storeData);
    return NextResponse.json({
      success: true,
      store: saved,
    });
  } catch (error) {
    console.error("Erro ao salvar loja no servidor:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar loja" },
      { status: 500 }
    );
  }
}
