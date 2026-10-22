"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  DEFAULT_STORE,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_PROMO_BANNERS,
  DEFAULT_COUPONS,
} from "@/lib/constants";
import {
  Store,
  Product,
  ProductVariation,
  Category,
  PromoBanner,
  Coupon,
  Order,
} from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { calculateBestSellers } from "@/lib/bestSellers";
import { Header } from "@/components/Header";
import { TestimonialsStories } from "@/components/TestimonialsStories";
import { BannerCarousel } from "@/components/BannerCarousel";
import { CategoryNav } from "@/components/CategoryNav";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ImageLightboxModal } from "@/components/ImageLightboxModal";
import { CustomNoteModal } from "@/components/CustomNoteModal";
import {
  Heart,
  Sparkles,
  Instagram,
  MapPin,
  Flame,
  Tag,
  Copy,
  Check,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [banners, setBanners] = useState<PromoBanner[]>(DEFAULT_PROMO_BANNERS);
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [orders, setOrders] = useState<Order[]>([]);

  const { items: cartItems, removeItem, quickIncrement } = useCart();
  const [removedItemNotice, setRemovedItemNotice] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Carregar produtos, categorias, cupons, banners e configurações salvas da confeitaria com migração de cache
  useEffect(() => {
    const loadCustomData = () => {
      try {
        const CACHE_VERSION_KEY = "nice_products_v3_real";
        const hasV3 = localStorage.getItem(CACHE_VERSION_KEY);
        const savedProds = localStorage.getItem("nice_custom_products");

        if (!hasV3) {
          localStorage.removeItem("nice_custom_products");
          localStorage.setItem(CACHE_VERSION_KEY, "true");
          setProducts(DEFAULT_PRODUCTS);
        } else if (savedProds) {
          const parsed = JSON.parse(savedProds);
          const hasOldRepeatedCake =
            parsed.filter((p: Product) =>
              p.images?.[0]?.includes("photo-1578985545062-69928b1d9587")
            ).length > 1;

          if (hasOldRepeatedCake) {
            localStorage.removeItem("nice_custom_products");
            setProducts(DEFAULT_PRODUCTS);
          } else {
            setProducts(parsed);
          }
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }

        const savedCats = localStorage.getItem("nice_custom_categories");
        if (savedCats) {
          setCategories(JSON.parse(savedCats));
        }

        const savedBanners = localStorage.getItem("nice_promo_banners");
        if (savedBanners) {
          setBanners(JSON.parse(savedBanners));
        }

        const savedCoupons = localStorage.getItem("nice_custom_coupons");
        if (savedCoupons) {
          setCoupons(JSON.parse(savedCoupons));
        }

        // Sincroniza com a API do servidor
        fetch("/api/coupons")
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.coupons)) {
              setCoupons(data.coupons);
              localStorage.setItem("nice_custom_coupons", JSON.stringify(data.coupons));
            }
          })
          .catch((err) => console.warn("Aviso ao carregar cupons:", err));

        const savedOrders = localStorage.getItem("nice_orders");
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }

        const savedStore = localStorage.getItem("nice_store_settings");
        if (savedStore) {
          setStore(JSON.parse(savedStore));
        }
      } catch (e) {
        console.error("Erro ao sincronizar dados:", e);
      }
    };

    loadCustomData();
    window.addEventListener("storage", loadCustomData);
    return () => window.removeEventListener("storage", loadCustomData);
  }, []);

  // Leitura automática de cupom via parâmetro URL (?cupom=CODIGO)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCupom = params.get("cupom");
      if (urlCupom) {
        localStorage.setItem("nice_active_coupon", urlCupom.toUpperCase());
        setCopiedCoupon(urlCupom.toUpperCase());
      }
    }
  }, []);

  // Auditoria do carrinho: se um item pausado ou excluído estiver no carrinho, avisar e remover
  useEffect(() => {
    if (products.length > 0 && cartItems.length > 0) {
      const removed: string[] = [];
      cartItems.forEach((ci) => {
        const prod = products.find((p) => p.id === ci.product.id);
        if (!prod || prod.is_archived || prod.is_paused) {
          removeItem(ci.cart_item_id);
          removed.push(ci.product.name);
        } else if (ci.selected_variation) {
          const v = prod.variations?.find((va) => va.name === ci.selected_variation?.name);
          if (v?.is_paused) {
            removeItem(ci.cart_item_id);
            removed.push(`${ci.product.name} (${ci.selected_variation.name})`);
          }
        }
      });
      if (removed.length > 0) {
        setRemovedItemNotice(
          `Atenção: O item "${removed.join(", ")}" esgotou e foi removido do seu carrinho.`
        );
      }
    }
  }, [products]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Estados para Lightbox de Imagem em Tela Cheia
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    src: string;
    title: string;
  }>({
    isOpen: false,
    src: "",
    title: "",
  });

  // Estados para Modal de Observação Customizada
  const [customNoteData, setCustomNoteData] = useState<{
    isOpen: boolean;
    product: Product | null;
    variation?: ProductVariation | null;
  }>({
    isOpen: false,
    product: null,
    variation: null,
  });

  // Cálculo dos Mais Vendidos
  const bestSellers = useMemo(() => {
    return calculateBestSellers(
      orders,
      products,
      store.best_sellers_config?.period || "30d",
      store.best_sellers_config
    );
  }, [orders, products, store.best_sellers_config]);

  const topSellerIds = useMemo(() => {
    return new Set(bestSellers.map((b) => b.product_id));
  }, [bestSellers]);

  // Cupom promocional ativo para exibição no cardápio
  const promoCoupon = useMemo(() => {
    return coupons.find(
      (c) => c.is_active && (c.show_on_menu !== false || c.show_banner !== false)
    );
  }, [coupons]);

  // Aplicar cupom com 1 clique a partir da faixa
  const handleApplyPromoCoupon = (code: string) => {
    localStorage.setItem("nice_active_coupon", code);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 4000);
  };

  // Rolagem suave até a categoria selecionada
  const handleSelectCategory = (id: string, slug: string) => {
    setActiveCategoryId(id);
    const targetElement = document.getElementById(`section-${slug}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Abrir foto em tela cheia
  const handleOpenImage = (src: string, title: string) => {
    setLightboxData({ isOpen: true, src, title });
  };

  // Abrir modal de observação
  const handleOpenCustomNote = (product: Product, variation?: ProductVariation) => {
    setCustomNoteData({ isOpen: true, product, variation });
  };

  // Filtragem com verificação de arquivamento, pausa de categoria, pausa de produto e busca
  const filterProductsForCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return [];

    const isCategoryPaused = Boolean(category.is_paused);
    const hideSoldOut = (store.stock_display_mode || "hide") === "hide";

    // Se a categoria inteira estiver pausada e configurada para ocultar
    if (isCategoryPaused && hideSoldOut) {
      return [];
    }

    return products.filter((p) => {
      if (p.category_id !== categoryId) return false;
      if (p.is_archived) return false;

      // Verifica se todos os sabores estão pausados
      const allFlavorsPaused =
        p.variations &&
        p.variations.length > 0 &&
        p.variations.every((v) => v.is_paused);

      const isProductPaused = p.is_paused || isCategoryPaused || allFlavorsPaused;

      // Se estiver pausado e o modo de estoque for ocultar totalmente
      if (isProductPaused && hideSoldOut) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchFlavors =
        p.variations &&
        p.variations.some((v) => v.name.toLowerCase().includes(q));

      return matchName || matchDesc || matchFlavors;
    });
  };

  return (
    <main className="min-h-screen bg-[#FFF5FA] flex flex-col pb-24">
      {/* Aviso de item esgotado removido do carrinho */}
      {removedItemNotice && (
        <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-md">
          <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{removedItemNotice}</span>
          </div>
          <button
            onClick={() => setRemovedItemNotice(null)}
            className="text-white hover:text-amber-100 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Cabeçalho com Logo Oficial e Horários */}
      <Header
        store={store}
        onOpenStory={() => setIsStoryModalOpen(true)}
      />

      {/* 2. Destaques e Histórias (Instagram Stories) */}
      <TestimonialsStories />

      {/* 2.1 Carrossel de Anúncios e Promoções Profissionais */}
      <BannerCarousel
        banners={banners}
        onSelectSection={(sectionId) => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* 2.2 Faixa Promocional de Cupom de Desconto Ativo */}
      {promoCoupon && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-3">
          <div className="bg-gradient-to-r from-nice-wine via-pink-900 to-nice-wine text-white p-3 sm:p-4 rounded-3xl shadow-card-3d border border-pink-300/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
                <Tag className="w-5 h-5 text-nice-gold" />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-nice-pink text-white">
                    Cupom Especial
                  </span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-nice-gold">
                    {promoCoupon.code}
                  </span>
                </div>
                <p className="text-xs text-pink-100 mt-0.5">
                  {promoCoupon.discount_type === "percentage" || promoCoupon.discount_type === "percent"
                    ? `Ganhe ${promoCoupon.discount_value}% OFF no seu pedido!`
                    : `Ganhe ${formatCurrency(promoCoupon.discount_value)} de desconto!`}
                  {promoCoupon.min_order_value ? ` Válido acima de ${formatCurrency(promoCoupon.min_order_value)}.` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApplyPromoCoupon(promoCoupon.code)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-nice-gold to-amber-500 hover:from-amber-500 hover:to-nice-gold text-nice-wine font-extrabold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
              >
                {copiedCoupon === promoCoupon.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aplicado no Carrinho!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar e Aplicar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.3 Faixa "🔥 Mais Pedidos" (Top Mais Vendidos em Carrossel/Linha Rápida) */}
      {bestSellers.length > 0 && !searchQuery.trim() && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h2 className="font-extrabold text-nice-wine text-base sm:text-lg flex items-center gap-1.5">
                  <span>Mais Pedidos da Nice</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    Top
                  </span>
                </h2>
                <p className="text-[11px] text-gray-500">
                  Os queridinhos e mais amados pelos nossos clientes
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
            {bestSellers.map((item) => {
              const prod = item.product;
              if (!prod || prod.is_paused || prod.is_archived) return null;
              const hasFlavors = prod.variations && prod.variations.length > 0;
              const img = prod.images?.[0] || "/logo.jpg";

              return (
                <div
                  key={item.product_id}
                  className="w-44 sm:w-48 flex-shrink-0 bg-white rounded-2xl p-3 border border-pink-100 hover:border-pink-300 shadow-card-3d snap-start flex flex-col justify-between transition-all"
                >
                  <div>
                    <div
                      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-pink-50 mb-2 cursor-pointer group"
                      onClick={() => handleOpenImage(img, prod.name)}
                    >
                      <Image
                        src={img}
                        alt={prod.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                        🔥 Top
                      </span>
                    </div>

                    <h3 className="font-bold text-nice-wine text-xs line-clamp-1">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-pink-100 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-nice-wine">
                      {formatCurrency(prod.base_price)}
                    </span>
                    <button
                      onClick={() => {
                        if (hasFlavors) {
                          handleOpenCustomNote(prod, prod.variations?.[0]);
                        } else {
                          quickIncrement(prod, null);
                        }
                      }}
                      className="px-2.5 py-1 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Pedir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Navegação de Categorias Fixas no Topo com Rolagem Automática */}
      <CategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 4. Seções do Cardápio Totalmente Organizadas por Categoria */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-6 flex-1 space-y-10">
        {categories.map((category) => {
          const categoryProducts = filterProductsForCategory(category.id);

          // Se estiver pesquisando e a categoria não tiver nenhum produto correspondente, oculta a seção
          if (searchQuery.trim() && categoryProducts.length === 0) {
            return null;
          }

          // Se a categoria não possuir produtos disponíveis
          if (categoryProducts.length === 0) {
            return null;
          }

          return (
            <section
              key={category.id}
              id={`section-${category.slug}`}
              className="scroll-mt-28 space-y-4"
            >
              {/* Título da Categoria com Divisor Elegante */}
              <div className="flex items-center justify-between pb-2 border-b-2 border-pink-200">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-nice-wine text-lg sm:text-xl tracking-tight">
                    {category.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-nice-pink-light text-nice-pink border border-pink-200">
                    {categoryProducts.length} {categoryProducts.length === 1 ? "item" : "itens"}
                  </span>
                </div>
              </div>

              {/* Grid de Cards dos Produtos da Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isTopSeller={topSellerIds.has(product.id)}
                    onOpenImageModal={handleOpenImage}
                    onOpenCustomModal={handleOpenCustomNote}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* 5. Rodapé Institucional */}
      <footer className="mt-16 bg-white border-t border-pink-100 py-8 px-4 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <p className="font-script text-3xl text-nice-pink">Nice Doce Sabor</p>
          <p className="text-xs text-nice-wine/80">
            Confeitaria artesanal com doces, bolos no pote e salgados finos por Eunice Pereira.
          </p>

          <div className="flex items-center justify-center gap-4 text-xs font-medium text-nice-wine pt-2">
            <a
              href={`https://wa.me/${store.phone_whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nice-pink transition flex items-center gap-1"
            >
              <span>WhatsApp Oficial</span>
            </a>
            <span>•</span>
            <a
              href={`https://instagram.com/${store.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nice-pink transition flex items-center gap-1"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>{store.instagram}</span>
            </a>
          </div>

          <p className="text-[10px] text-gray-400 pt-3">
            Recife - PE • Quarta a Segunda das 12h às 19h (Terça Fechado)
          </p>
        </div>
      </footer>

      {/* 6. Modais */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        store={store}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        imageSrc={lightboxData.src}
        title={lightboxData.title}
        onClose={() => setLightboxData({ isOpen: false, src: "", title: "" })}
      />

      <CustomNoteModal
        isOpen={customNoteData.isOpen}
        product={customNoteData.product}
        variation={customNoteData.variation}
        onClose={() =>
          setCustomNoteData({ isOpen: false, product: null, variation: null })
        }
      />

      <FloatingCartButton />
    </main>
  );
}
