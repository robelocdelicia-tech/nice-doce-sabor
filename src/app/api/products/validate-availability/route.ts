import { NextRequest, NextResponse } from "next/server";
import { CartItem, Product, Category } from "@/types";
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ all_available: true, unavailable_items: [] });
    }

    let allProducts: Product[] = DEFAULT_PRODUCTS;
    let allCategories: Category[] = DEFAULT_CATEGORIES;

    const supabase = createClient();
    if (supabase) {
      const { data: dbProds } = await supabase.from("products").select("*");
      if (dbProds && dbProds.length > 0) allProducts = dbProds;

      const { data: dbCats } = await supabase.from("categories").select("*");
      if (dbCats && dbCats.length > 0) allCategories = dbCats;
    }

    const now = new Date();
    const unavailable: {
      cart_item_id: string;
      product_name: string;
      reason: string;
    }[] = [];

    for (const item of items as CartItem[]) {
      const liveProduct = allProducts.find((p) => p.id === item.product.id);

      if (!liveProduct) {
        unavailable.push({
          cart_item_id: item.cart_item_id,
          product_name: item.product.name,
          reason: "Item não encontrado ou removido do cardápio.",
        });
        continue;
      }

      // Checa se produto foi arquivado ou desativado
      if (liveProduct.is_archived || !liveProduct.is_active) {
        unavailable.push({
          cart_item_id: item.cart_item_id,
          product_name: liveProduct.name,
          reason: "Item indisponível no momento.",
        });
        continue;
      }

      // Checa se produto está pausado
      const isProductPaused =
        liveProduct.is_paused ||
        (liveProduct.pause_until && new Date(liveProduct.pause_until) > now);

      if (isProductPaused) {
        unavailable.push({
          cart_item_id: item.cart_item_id,
          product_name: liveProduct.name,
          reason: "Produto esgotado temporariamente.",
        });
        continue;
      }

      // Checa se a categoria inteira está pausada
      if (liveProduct.category_id) {
        const cat = allCategories.find((c) => c.id === liveProduct.category_id);
        const isCatPaused =
          cat?.is_paused || (cat?.pause_until && new Date(cat.pause_until) > now);

        if (isCatPaused) {
          unavailable.push({
            cart_item_id: item.cart_item_id,
            product_name: liveProduct.name,
            reason: `Categoria ${cat?.name || ""} temporariamente pausada.`,
          });
          continue;
        }
      }

      // Checa se o sabor específico selecionado está pausado
      if (item.selected_variation) {
        const liveVar = liveProduct.variations?.find(
          (v) => v.name === item.selected_variation?.name
        );

        const isVarPaused =
          liveVar?.is_paused ||
          (liveVar?.pause_until && new Date(liveVar.pause_until) > now);

        if (isVarPaused) {
          unavailable.push({
            cart_item_id: item.cart_item_id,
            product_name: `${liveProduct.name} (${item.selected_variation.name})`,
            reason: `O sabor "${item.selected_variation.name}" acabou e está pausado.`,
          });
          continue;
        }
      }
    }

    return NextResponse.json({
      all_available: unavailable.length === 0,
      unavailable_items: unavailable,
    });
  } catch (error) {
    console.error("Erro ao validar disponibilidade:", error);
    return NextResponse.json(
      { all_available: true, unavailable_items: [] },
      { status: 500 }
    );
  }
}
