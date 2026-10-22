import { NextRequest, NextResponse } from "next/server";
import { CartItem, Product, Category } from "@/types";
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items = [], client_products = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        valid: true,
        all_available: true,
        unavailable_items: [],
      });
    }

    let allProducts: Product[] = DEFAULT_PRODUCTS;
    let allCategories: Category[] = DEFAULT_CATEGORIES;

    // Se o cliente enviou produtos locais personalizados, mescla
    if (Array.isArray(client_products) && client_products.length > 0) {
      const clientMap = new Map(allProducts.map((p) => [p.id, p]));
      client_products.forEach((cp: Product) => {
        if (cp && cp.id) clientMap.set(cp.id, cp);
      });
      allProducts = Array.from(clientMap.values());
    }

    const supabase = createClient();
    if (supabase) {
      try {
        const { data: dbProds } = await supabase.from("products").select("*");
        if (dbProds && dbProds.length > 0) {
          const map = new Map(allProducts.map((p) => [p.id, p]));
          dbProds.forEach((dp: Product) => map.set(dp.id, dp));
          allProducts = Array.from(map.values());
        }

        const { data: dbCats } = await supabase.from("categories").select("*");
        if (dbCats && dbCats.length > 0) allCategories = dbCats;
      } catch (err) {}
    }

    const now = new Date();
    const unavailable: {
      cart_item_id: string;
      name: string;
      product_name: string;
      reason: string;
    }[] = [];

    for (const item of items) {
      const prodId = item.product_id || item.product?.id || item.id;
      const varName = item.variation_name || item.selected_variation?.name;
      const prodName = item.product_name || item.product?.name || item.name || "Item";

      const liveProduct = allProducts.find(
        (p) => p.id === prodId || p.name.trim().toLowerCase() === prodName.trim().toLowerCase()
      );

      if (!liveProduct) {
        // Se não encontrou nem por id nem por nome, não bloqueia pedidos de itens recém-criados localmente
        continue;
      }

      // Checa se produto foi arquivado ou desativado
      if (liveProduct.is_archived || liveProduct.is_active === false) {
        unavailable.push({
          cart_item_id: item.cart_item_id || prodId,
          name: liveProduct.name,
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
          cart_item_id: item.cart_item_id || prodId,
          name: liveProduct.name,
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
            cart_item_id: item.cart_item_id || prodId,
            name: liveProduct.name,
            product_name: liveProduct.name,
            reason: `Categoria ${cat?.name || ""} temporariamente pausada.`,
          });
          continue;
        }
      }

      // Checa se o sabor específico selecionado está pausado
      if (varName && liveProduct.variations) {
        const liveVar = liveProduct.variations.find(
          (v) => v.name.trim().toLowerCase() === varName.trim().toLowerCase()
        );

        const isVarPaused =
          liveVar?.is_paused ||
          (liveVar?.pause_until && new Date(liveVar.pause_until) > now);

        if (isVarPaused) {
          unavailable.push({
            cart_item_id: item.cart_item_id || prodId,
            name: `${liveProduct.name} (${varName})`,
            product_name: `${liveProduct.name} (${varName})`,
            reason: `O sabor "${varName}" acabou e está pausado.`,
          });
          continue;
        }
      }
    }

    return NextResponse.json({
      valid: unavailable.length === 0,
      all_available: unavailable.length === 0,
      unavailable_items: unavailable,
    });
  } catch (error) {
    console.error("Erro ao validar disponibilidade:", error);
    return NextResponse.json(
      { valid: true, all_available: true, unavailable_items: [] },
      { status: 200 }
    );
  }
}
