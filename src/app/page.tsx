"use client";

import React, { useState, useEffect } from "react";
import { DEFAULT_STORE, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_PROMO_BANNERS } from "@/lib/constants";
import { Store, Product, ProductVariation, Category, PromoBanner } from "@/types";
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
import { Heart, Sparkles, Instagram, MapPin } from "lucide-react";

export default function HomePage() {
  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [banners, setBanners] = useState<PromoBanner[]>(DEFAULT_PROMO_BANNERS);

  // Carregar produtos, banners e configurações salvas da confeitaria com migração de cache
  useEffect(() => {
    const loadCustomData = () => {
      try {
        const CACHE_VERSION_KEY = "nice_products_v3_real";
        const hasV3 = localStorage.getItem(CACHE_VERSION_KEY);
        const savedProds = localStorage.getItem("nice_custom_products");

        if (!hasV3) {
          // Migra o cache antigo para carregar as fotos reais e exclusivas de cada produto
          localStorage.removeItem("nice_custom_products");
          localStorage.setItem(CACHE_VERSION_KEY, "true");
          setProducts(DEFAULT_PRODUCTS);
        } else if (savedProds) {
          const parsed = JSON.parse(savedProds);
          // Garante que não haja cache antigo com foto duplicada de bolo de chocolate
          const hasOldRepeatedCake = parsed.filter((p: Product) =>
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

        const savedBanners = localStorage.getItem("nice_promo_banners");
        if (savedBanners) {
          setBanners(JSON.parse(savedBanners));
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

  const [activeCategoryId, setActiveCategoryId] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Estados para Lightbox de Imagem em Tela Cheia
  const [lightboxData, setLightboxData] = useState<{ isOpen: boolean; src: string; title: string }>({
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

  // Filtragem com busca que busca no nome do produto E no nome de qualquer um dos sabores!
  const filterProductsForCategory = (categoryId: string) => {
    return products.filter((p) => {
      if (p.category_id !== categoryId) return false;

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
