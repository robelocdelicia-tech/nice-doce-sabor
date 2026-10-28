import { NextRequest, NextResponse } from "next/server";
import { Order, Product, Category, Coupon, CartItem } from "@/types";
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, DEFAULT_COUPONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getCloudItem, setCloudItem } from "@/lib/cloudStorage";
import {
  getServerCoupons,
  calculateCouponDiscount,
  normalizeCoupon,
  saveServerCoupons,
  isCouponDeleted,
} from "@/lib/serverCoupons";

// Memória local em runtime para fallback caso o Supabase não esteja conectado
let memoryOrders: Order[] = [];

export async function GET(request: NextRequest) {
  try {
    const cloud = await getCloudItem<Order[]>("orders", []);
    let ordersList = Array.isArray(cloud.data) ? cloud.data : [];

    const supabase = createClient();
    if (supabase) {
      const { data: dbOrders, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });

      if (!error && dbOrders && dbOrders.length > 0) {
        const map = new Map<string, Order>();
        dbOrders.forEach((o: Order) => map.set(o.id, o));
        ordersList.forEach((o: Order) => map.set(o.id, o));
        ordersList = Array.from(map.values());
      }
    }

    if (ordersList.length > 0) {
      memoryOrders = ordersList;
    }

    return NextResponse.json({
      success: true,
      orders: ordersList.length > 0 ? ordersList : memoryOrders,
    });
  } catch (err) {
    console.warn("Fallback para pedidos em memória:", err);
  }

  return NextResponse.json({
    success: true,
    orders: memoryOrders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderData: Partial<Order> = body;

    // Se for balcão, o nome do cliente pode ser "Cliente Balcão"
    const isBalcao = orderData.origin === "balcao";
    const customerName = orderData.customer_name?.trim() || (isBalcao ? "Cliente Balcão" : "");
    const customerPhone = orderData.customer_phone?.trim() || (isBalcao ? "81988896169" : "");

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: "Nome e WhatsApp são obrigatórios." },
        { status: 400 }
      );
    }

    const items = orderData.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "O pedido deve conter pelo menos um item." },
        { status: 400 }
      );
    }

    // 1. VALIDAÇÃO NO SERVIDOR DA DISPONIBILIDADE DOS ITENS
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
    for (const item of items) {
      const liveProduct = allProducts.find(
        (p) =>
          (item.product_id && p.id === item.product_id) ||
          p.name.trim().toLowerCase() === item.product_name.trim().toLowerCase()
      );
      if (!liveProduct || liveProduct.is_archived || !liveProduct.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: `O item "${item.product_name}" não está mais disponível no cardápio.`,
          },
          { status: 400 }
        );
      }

      const isProductPaused =
        liveProduct.is_paused ||
        (liveProduct.pause_until && new Date(liveProduct.pause_until) > now);

      if (isProductPaused) {
        return NextResponse.json(
          {
            success: false,
            error: `O produto "${liveProduct.name}" acabou e está pausado no momento.`,
          },
          { status: 400 }
        );
      }

      // Categoria pausada
      if (liveProduct.category_id) {
        const cat = allCategories.find((c) => c.id === liveProduct.category_id);
        const isCatPaused =
          cat?.is_paused || (cat?.pause_until && new Date(cat.pause_until) > now);
        if (isCatPaused) {
          return NextResponse.json(
            {
              success: false,
              error: `A categoria "${cat?.name}" está temporariamente fechada para novos pedidos.`,
            },
            { status: 400 }
          );
        }
      }

      // Sabor pausado
      if (item.selected_variation) {
        const liveVar = liveProduct.variations?.find(
          (v) =>
            v.name.trim().toLowerCase() ===
            item.selected_variation?.name.trim().toLowerCase()
        );
        const isVarPaused =
          liveVar?.is_paused ||
          (liveVar?.pause_until && new Date(liveVar.pause_until) > now);
        if (isVarPaused) {
          return NextResponse.json(
            {
              success: false,
              error: `O sabor "${item.selected_variation.name}" de "${liveProduct.name}" acabou. Por favor, escolha outro sabor.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 2. RECÁLCULO SEGURO DO SUBTOTAL
    const calculatedSubtotal = items.reduce(
      (sum, it) => sum + (it.unit_price * it.quantity),
      0
    );

    const deliveryFee = orderData.order_type === "delivery" ? (orderData.delivery_fee || 0) : 0;
    let serverCouponDiscount = 0;
    const cleanCouponCode = orderData.coupon_code?.trim().toUpperCase();

    // 3. VALIDAÇÃO E RECÁLCULO DO CUPOM NO SERVIDOR (NUNCA CONFIAR NO CLIENTE)
    if (cleanCouponCode && !isCouponDeleted(cleanCouponCode)) {
      let coupon: Coupon | null = null;
      const allCoupons = await getServerCoupons();
      coupon = allCoupons.find((c) => c.code.toUpperCase() === cleanCouponCode) || null;

      if (!coupon && (orderData as any).applied_coupon) {
        coupon = normalizeCoupon((orderData as any).applied_coupon);
      }

      if (!coupon) {
        coupon = DEFAULT_COUPONS.find((c) => c.code.toUpperCase() === cleanCouponCode) || null;
      }

      if (coupon) {
        const calc = calculateCouponDiscount(
          coupon,
          calculatedSubtotal,
          deliveryFee,
          items as any,
          orderData.order_type || "pickup",
          customerPhone
        );
        if (calc.valid) {
          serverCouponDiscount = calc.discount;
        }
      }
    }

    const manualDiscount = orderData.manual_discount || 0;
    const totalDiscounts = serverCouponDiscount + manualDiscount;
    const finalTotal = Math.max(0, calculatedSubtotal + deliveryFee - totalDiscounts);

    // Gerador de número de comanda incremental
    const orderNumber =
      orderData.order_number ||
      Math.floor(1000 + (Date.now() % 9000));

    const finalOrder: Order = {
      id: orderData.id || `order-${Date.now()}`,
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      order_type: orderData.order_type || "pickup",
      origin: isBalcao ? "balcao" : "online",
      order_subtype: orderData.order_subtype,
      scheduled_for: orderData.scheduled_for || null,
      neighborhood_name: orderData.neighborhood_name || null,
      delivery_address: orderData.delivery_address || null,
      delivery_fee: deliveryFee,
      subtotal: calculatedSubtotal,
      discount: totalDiscounts,
      coupon_code: serverCouponDiscount > 0 ? cleanCouponCode : null,
      coupon_discount: serverCouponDiscount,
      manual_discount: manualDiscount,
      total: finalTotal,
      payment_method: orderData.payment_method || "pix",
      payment_status: orderData.payment_status || "pending",
      cash_change_for: orderData.cash_change_for || null,
      cash_tendered: orderData.cash_tendered || null,
      change_due: orderData.change_due || null,
      is_fiado: orderData.is_fiado || false,
      fiado_paid: orderData.fiado_paid || false,
      paid_at: orderData.paid_at || null,
      paid_confirmed_by: orderData.paid_confirmed_by || null,
      order_status: orderData.order_status || "received",
      cancellation_reason: null,
      notes: orderData.notes || null,
      is_printed: orderData.is_printed || false,
      printed_at: null,
      created_at: new Date().toISOString(),
      items: items,
    };

    // 4. PERSISTÊNCIA (SUPABASE E/OU MEMÓRIA)
    if (supabase) {
      try {
        const { error: insertOrderErr } = await supabase.from("orders").insert({
          id: finalOrder.id,
          order_number: finalOrder.order_number,
          customer_name: finalOrder.customer_name,
          customer_phone: finalOrder.customer_phone,
          order_type: finalOrder.order_type,
          origin: finalOrder.origin,
          order_subtype: finalOrder.order_subtype,
          scheduled_for: finalOrder.scheduled_for,
          neighborhood_name: finalOrder.neighborhood_name,
          delivery_address: finalOrder.delivery_address,
          delivery_fee: finalOrder.delivery_fee,
          subtotal: finalOrder.subtotal,
          discount: finalOrder.discount,
          coupon_code: finalOrder.coupon_code,
          coupon_discount: finalOrder.coupon_discount,
          manual_discount: finalOrder.manual_discount,
          total: finalOrder.total,
          payment_method: finalOrder.payment_method,
          payment_status: finalOrder.payment_status,
          cash_change_for: finalOrder.cash_change_for,
          cash_tendered: finalOrder.cash_tendered,
          change_due: finalOrder.change_due,
          is_fiado: finalOrder.is_fiado,
          fiado_paid: finalOrder.fiado_paid,
          order_status: finalOrder.order_status,
          notes: finalOrder.notes,
          is_printed: finalOrder.is_printed,
          created_at: finalOrder.created_at,
        });

        if (!insertOrderErr && items.length > 0) {
          const orderItemsRows = items.map((it) => ({
            order_id: finalOrder.id,
            product_id: it.product_id,
            product_name: it.product_name,
            unit_price: it.unit_price,
            quantity: it.quantity,
            selected_variation: it.selected_variation,
            selected_addons: it.selected_addons,
            custom_notes: it.custom_notes,
            total_price: it.total_price,
          }));
          await supabase.from("order_items").insert(orderItemsRows);
        }

        // Registra uso do cupom se aplicável
        if (finalOrder.coupon_code && finalOrder.coupon_discount && finalOrder.coupon_discount > 0) {
          const { data: cData } = await supabase
            .from("coupons")
            .select("id, uses_count, revenue_generated, total_discount_given")
            .eq("code", finalOrder.coupon_code)
            .maybeSingle();

          if (cData) {
            await supabase.from("coupon_usages").insert({
              coupon_id: cData.id,
              coupon_code: finalOrder.coupon_code,
              customer_phone: finalOrder.customer_phone.replace(/\D/g, ""),
              order_id: finalOrder.id,
              discount_applied: finalOrder.coupon_discount,
            });

            await supabase
              .from("coupons")
              .update({
                uses_count: (cData.uses_count || 0) + 1,
                revenue_generated: (cData.revenue_generated || 0) + finalOrder.total,
                total_discount_given:
                  (cData.total_discount_given || 0) + finalOrder.coupon_discount,
              })
              .eq("id", cData.id);
          }
        }
      } catch (dbErr) {
        console.warn("Erro ao salvar no Supabase (salvo em memória):", dbErr);
      }
    }

    // Registra estatística do cupom no cache local do servidor
    if (finalOrder.coupon_code && finalOrder.coupon_discount && finalOrder.coupon_discount > 0) {
      try {
        const allCoupons = await getServerCoupons();
        const updated = allCoupons.map((c) => {
          if (c.code.toUpperCase() === finalOrder.coupon_code?.toUpperCase()) {
            return {
              ...c,
              uses_count: (c.uses_count || 0) + 1,
              revenue_generated: (c.revenue_generated || 0) + finalOrder.total,
              total_discount_given: (c.total_discount_given || 0) + (finalOrder.coupon_discount || 0),
            };
          }
          return c;
        });
        await saveServerCoupons(updated);
      } catch (e) {}
    }

    memoryOrders = [finalOrder, ...memoryOrders];

    // Persiste o novo pedido na nuvem global (Netlify Blobs)
    try {
      const cloud = await getCloudItem<Order[]>("orders", []);
      const existing = Array.isArray(cloud.data) ? cloud.data : [];
      const updatedList = [finalOrder, ...existing.filter((o) => o.id !== finalOrder.id)];
      await setCloudItem("orders", updatedList);
    } catch (e) {
      console.warn("Aviso ao persistir pedido na nuvem:", e);
    }

    return NextResponse.json({
      success: true,
      order: finalOrder,
    });
  } catch (error) {
    console.error("Erro na API de pedidos:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar pedido." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updatedOrder: Order = body.order || body;

    if (!updatedOrder || !updatedOrder.id) {
      return NextResponse.json(
        { success: false, error: "Pedido inválido ou ID não informado" },
        { status: 400 }
      );
    }

    memoryOrders = memoryOrders.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));

    try {
      const cloud = await getCloudItem<Order[]>("orders", []);
      const existing = Array.isArray(cloud.data) ? cloud.data : [];
      const updatedList = existing.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
      await setCloudItem("orders", updatedList);
    } catch (e) {}

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase
          .from("orders")
          .update({
            order_status: updatedOrder.order_status,
            payment_status: updatedOrder.payment_status,
            paid_at: updatedOrder.paid_at || null,
            paid_confirmed_by: updatedOrder.paid_confirmed_by || null,
            is_printed: updatedOrder.is_printed,
          })
          .eq("id", updatedOrder.id);
      } catch (err) {}
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Erro ao atualizar pedido:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao atualizar pedido" },
      { status: 500 }
    );
  }
}
