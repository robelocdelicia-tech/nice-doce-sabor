import { NextRequest, NextResponse } from "next/server";
import { getServerBanners, saveServerBanners } from "@/lib/serverData";

export async function GET() {
  try {
    const banners = await getServerBanners();
    return NextResponse.json({
      success: true,
      banners,
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

    if (!Array.isArray(banners)) {
      return NextResponse.json(
        { success: false, error: "Array de banners inválido" },
        { status: 400 }
      );
    }

    const saved = await saveServerBanners(banners);
    return NextResponse.json({
      success: true,
      banners: saved,
    });
  } catch (error) {
    console.error("Erro ao salvar banners:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar banners" },
      { status: 500 }
    );
  }
}
