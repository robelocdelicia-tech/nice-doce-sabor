import { NextRequest, NextResponse } from "next/server";
import { getServerBanners, saveServerBanners } from "@/lib/serverData";

export async function GET() {
  try {
    const res = await getServerBanners();
    return NextResponse.json({
      success: true,
      banners: res.banners,
      updated_at: res.updated_at,
      is_customized: res.is_customized,
    });
  } catch (error) {
    console.error("Erro ao carregar banners:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const banners = body.banners || body;
    const updatedAt = typeof body.updated_at === "number" ? body.updated_at : Date.now();

    if (!Array.isArray(banners)) {
      return NextResponse.json(
        { success: false, error: "Array de banners inválido" },
        { status: 400 }
      );
    }

    const saved = await saveServerBanners(banners, updatedAt);
    return NextResponse.json({
      success: true,
      banners: saved.banners,
      updated_at: saved.updated_at,
    });
  } catch (error) {
    console.error("Erro ao salvar banners:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar banners" },
      { status: 500 }
    );
  }
}
