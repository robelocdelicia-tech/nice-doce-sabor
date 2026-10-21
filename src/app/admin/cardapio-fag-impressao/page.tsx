"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import {
  DEFAULT_STORE,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
} from "@/lib/constants";
import { Store, Category, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Printer,
  ArrowLeft,
  QrCode as QrIcon,
  Sparkles,
  Phone,
  Clock,
  MapPin,
  Heart,
  Scissors,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function CardapioImpressaoPage() {
  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);

  // URL para onde o QR Code vai direcionar
  const [menuUrl, setMenuUrl] = useState<string>("https://nicedocesabor.com.br");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Modo de exibição/impressão
  const [printFilter, setPrintFilter] = useState<"all" | "menu" | "plaquinhas">(
    "all"
  );

  // Carrega dados dinâmicos do Supabase (com fallback seguro para localStorage e defaults)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        if (typeof window !== "undefined") {
          // Detecta a URL base do site atual se estiver rodando em produção ou local
          const currentOrigin = window.location.origin;
          if (currentOrigin && !currentOrigin.includes("localhost")) {
            setMenuUrl(currentOrigin);
          }
        }

        const supabase = createClient();
        if (supabase) {
          // Busca categorias ativas ordenadas
          const { data: dbCats } = await supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

          // Busca produtos ativos ordenados
          const { data: dbProds } = await supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

          // Busca dados da loja
          const { data: dbStore } = await supabase
            .from("store_settings")
            .select("*")
            .maybeSingle();

          if (isMounted) {
            if (dbCats && dbCats.length > 0) setCategories(dbCats);
            if (dbProds && dbProds.length > 0) setProducts(dbProds);
            if (dbStore) setStore((prev) => ({ ...prev, ...dbStore }));
          }
        } else {
          // Fallback para dados salvos no localStorage do navegador
          const savedStore = localStorage.getItem("nice_store_settings");
          if (savedStore) setStore(JSON.parse(savedStore));

          const savedProds = localStorage.getItem("nice_custom_products");
          if (savedProds) setProducts(JSON.parse(savedProds));
        }
      } catch (err) {
        console.warn("Aviso ao carregar dados do Supabase:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Gera o QR Code em alta resolução
  useEffect(() => {
    async function generateQR() {
      try {
        const urlToEncode = menuUrl.trim() || "https://nicedocesabor.com.br";
        const dataUrl = await QRCode.toDataURL(urlToEncode, {
          width: 600,
          margin: 1,
          color: {
            dark: "#4A122E", // Vinho nobre da marca
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("Erro ao gerar QR Code:", err);
      }
    }

    generateQR();
  }, [menuUrl]);

  const handlePrint = () => {
    window.print();
  };

  // Separa os produtos por categorias do cardápio
  const docesProducts = products.filter(
    (p) => p.category_id === "cat-doces" && p.is_active
  );
  const boloPoteProducts = products.filter(
    (p) => p.category_id === "cat-bolo-pote" && p.is_active
  );
  const fatiasProducts = products.filter(
    (p) => p.category_id === "cat-fatias" && p.is_active
  );
  const conesProducts = products.filter(
    (p) => p.category_id === "cat-cones" && p.is_active
  );
  const salgadosProducts = products.filter(
    (p) => p.category_id === "cat-salgados" && p.is_active
  );
  const kitsProducts = products.filter(
    (p) => p.category_id === "cat-kits" && p.is_active
  );
  const bebidasProducts = products.filter(
    (p) => p.category_id === "cat-bebidas" && p.is_active
  );

  return (
    <div className="min-h-screen bg-neutral-100 text-gray-900 font-sans print:bg-white print:p-0">
      {/* ========================================================================= */}
      {/* 1. BARRA DE CONTROLES DO TOPO (OCULTA NA IMPRESSÃO E NO PDF)              */}
      {/* ========================================================================= */}
      <header className="no-print bg-white border-b border-pink-200 sticky top-0 z-50 shadow-md px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-nice-wine border border-pink-200 transition"
              title="Voltar ao Painel Administrativo"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-nice-wine text-base sm:text-lg flex items-center gap-2">
                <span>Impressão do Cardápio Físico em PDF (A4)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-nice-pink text-white">
                  Pronto para Balcão
                </span>
              </h1>
              <p className="text-xs text-gray-500">
                Páginas 1 e 2 (Cardápio A4 frente e verso) + Página 3 (Plaquinhas de Mesa)
              </p>
            </div>
          </div>

          {/* Filtro de páginas a imprimir */}
          <div className="flex items-center gap-1 bg-pink-50 p-1 rounded-2xl border border-pink-200 text-xs font-semibold">
            <button
              onClick={() => setPrintFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition ${
                printFilter === "all"
                  ? "bg-nice-pink text-white shadow-sm"
                  : "text-nice-wine hover:bg-white/60"
              }`}
            >
              Imprimir Tudo (3 Páginas)
            </button>
            <button
              onClick={() => setPrintFilter("menu")}
              className={`px-3 py-1.5 rounded-xl transition ${
                printFilter === "menu"
                  ? "bg-nice-pink text-white shadow-sm"
                  : "text-nice-wine hover:bg-white/60"
              }`}
            >
              Apenas Cardápio (Págs 1 e 2)
            </button>
            <button
              onClick={() => setPrintFilter("plaquinhas")}
              className={`px-3 py-1.5 rounded-xl transition ${
                printFilter === "plaquinhas"
                  ? "bg-nice-pink text-white shadow-sm"
                  : "text-nice-wine hover:bg-white/60"
              }`}
            >
              Apenas Plaquinhas (Pág 3)
            </button>
          </div>

          {/* Campo de link do QR Code e Botão de Ação */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-gray-400">Link do QR:</span>
              <input
                type="text"
                value={menuUrl}
                onChange={(e) => setMenuUrl(e.target.value)}
                placeholder="https://seu-site.com"
                className="bg-transparent font-mono text-[11px] text-nice-wine focus:outline-none w-44"
              />
            </div>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-nice-pink via-rose-500 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 transition transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar em PDF</span>
            </button>
          </div>
        </div>

        {/* Dica amigável de impressão */}
        <div className="max-w-6xl mx-auto mt-2 pt-2 border-t border-pink-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-nice-gold" />
            <span>
              <strong>Dica de Impressão:</strong> Na janela que se abrir, escolha o destino <em>"Salvar como PDF"</em> para descarregar o arquivo ou selecione sua impressora. Marque a opção <em>"Gráficos de segundo plano"</em> para manter os tons rosados e dourados.
            </span>
          </div>
          <span className="text-nice-pink font-semibold">
            Formato configurado: Folha A4 Retrato (210mm x 297mm)
          </span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ÁREA DE PÁGINAS A4 (ESTILOS VISUAIS E DE IMPRESSÃO)                    */}
      {/* ========================================================================= */}
      <main className="py-6 px-2 sm:px-4 flex flex-col items-center gap-8 print:p-0 print:gap-0">
        {/* ======================================================================= */}
        {/* PÁGINA 1: CABEÇALHO DE LUXO, DOCES, BOLO NO POTE, FATIAS & CONES       */}
        {/* ======================================================================= */}
        {(printFilter === "all" || printFilter === "menu") && (
          <article className="a4-page relative bg-white w-[210mm] min-h-[297mm] h-[297mm] p-[10mm] shadow-2xl rounded-2xl print:rounded-none print:shadow-none border border-pink-200 print:border-none flex flex-col justify-between overflow-hidden page-break">
            {/* Moldura decorativa sutil da folha */}
            <div className="absolute inset-2 border-2 border-dashed border-pink-200/90 pointer-events-none rounded-xl" />

            <div>
              {/* TOPO: Cabeçalho com Logo, Tipografia Nobre e QR Code de Acesso Rápido */}
              <div className="flex items-center justify-between border-b-2 border-pink-200 pb-3 mb-3 gap-3">
                <div className="flex items-center gap-3.5">
                  {/* Medalhão da Logo */}
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-nice-pink p-0.5 bg-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Image
                      src={store.logo_url || "/logo.jpg"}
                      alt={store.name}
                      width={80}
                      height={80}
                      className="rounded-full object-cover w-full h-full"
                      priority
                    />
                  </div>

                  <div>
                    <h1 className="font-script text-4xl text-nice-pink leading-none drop-shadow-sm">
                      {store.name}
                    </h1>
                    <p className="text-nice-wine font-bold text-xs uppercase tracking-wider mt-0.5">
                      Confeitaria Artesanal por {store.owner_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600 mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-nice-pink" />
                        {store.city} • Retirada no Local
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-nice-gold" />
                        Quarta a Segunda das 12h às 19h (Terça Fechado)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloco de QR Code no Cabeçalho */}
                <div className="flex flex-col items-center p-2 rounded-xl bg-pink-50/80 border border-pink-200/90 flex-shrink-0 text-center max-w-[130px]">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Cardápio"
                      className="w-16 h-16 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-pink-100 rounded-lg flex items-center justify-center">
                      <QrIcon className="w-6 h-6 text-nice-pink" />
                    </div>
                  )}
                  <span className="text-[9px] font-black uppercase tracking-wider text-nice-wine mt-1">
                    Pedir pelo Celular
                  </span>
                  <span className="text-[8px] text-nice-pink font-semibold">
                    Aponte a Câmera 📱
                  </span>
                </div>
              </div>

              {/* GRID PRINCIPAL EM 2 COLUNAS (PÁGINA 1) */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                {/* ========================================== */}
                {/* COLUNA 1: DOCES ARTESANAIS & CONES TRUFADOS */}
                {/* ========================================== */}
                <div className="space-y-3">
                  {/* SEÇÃO 1: DOCES ARTESANAIS */}
                  <section className="bg-[#FFFDFE] p-2.5 rounded-xl border border-pink-100/90">
                    <div className="flex items-center justify-between border-b border-pink-200 pb-1 mb-2">
                      <h2 className="font-bold text-nice-wine text-xs uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-nice-gold" />
                        <span>Doces Artesanais</span>
                      </h2>
                      <span className="text-[9px] font-semibold text-nice-pink uppercase">
                        Feitos à mão
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {docesProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-start justify-between gap-1 pb-1 border-b border-pink-50 last:border-b-0"
                        >
                          <div className="min-w-0 pr-1">
                            <span className="font-bold text-gray-900 block text-[11px] leading-tight">
                              {p.name}
                            </span>
                            <span className="text-[9px] text-gray-500 block truncate leading-tight">
                              {p.description}
                            </span>
                          </div>
                          <span className="font-black text-nice-pink text-xs whitespace-nowrap">
                            {formatCurrency(p.base_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* SEÇÃO 2: CONES TRUFADOS */}
                  <section className="bg-[#FFFDFE] p-2.5 rounded-xl border border-pink-100/90">
                    <div className="flex items-center justify-between border-b border-pink-200 pb-1 mb-2">
                      <h2 className="font-bold text-nice-wine text-xs uppercase tracking-wider flex items-center gap-1">
                        <Heart className="w-3 h-3 text-nice-pink fill-current" />
                        <span>Cones Trufados</span>
                      </h2>
                      <span className="text-[9px] font-bold text-nice-pink">
                        R$ 8,00 cada
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-1.5 leading-tight">
                      Casquinha crocante banhada no chocolate nobre por dentro e por fora.
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="p-1 rounded bg-pink-50 text-nice-wine font-semibold text-center border border-pink-100">
                        🍫 Brigadeiro
                      </span>
                      <span className="p-1 rounded bg-pink-50 text-nice-wine font-semibold text-center border border-pink-100">
                        🌰 Ninho com Nutella
                      </span>
                    </div>
                  </section>
                </div>

                {/* ========================================== */}
                {/* COLUNA 2: BOLO NO POTE & FATIAS DE BOLO    */}
                {/* ========================================== */}
                <div className="space-y-3">
                  {/* SEÇÃO 3: BOLO NO POTE */}
                  <section className="bg-[#FFFDFE] p-2.5 rounded-xl border border-pink-100/90">
                    <div className="flex items-center justify-between border-b border-pink-200 pb-1 mb-1.5">
                      <h2 className="font-bold text-nice-wine text-xs uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-nice-gold" />
                        <span>Bolo no Pote Artesanal</span>
                      </h2>
                      <span className="text-[9px] font-bold text-nice-pink">
                        Camadas Fartas
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-2 leading-tight">
                      Massa fofinha intercalada com cremes nobres e frutas selecionadas.
                    </p>

                    {/* Faixa R$ 10,00 */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-nice-pink-light text-nice-pink border border-pink-200">
                          SABORES ESPECIAIS: R$ 10,00
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-700">
                        <span>• Prestígio</span>
                        <span>• Choconinho c/ Nutella</span>
                        <span>• Brigadeiro</span>
                        <span>• Ninho com Nutella</span>
                        <span>• Cenoura c/ chocolate</span>
                        <span>• Doce de leite c/ beijinho</span>
                        <span>• Chocolate c/ maracujá</span>
                        <span>• Limão Refrescante</span>
                        <span>• Maracujá Cremoso</span>
                      </div>
                    </div>

                    {/* Faixa R$ 12,00 */}
                    <div className="pt-1.5 border-t border-pink-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-nice-pink text-white">
                          SABORES COM MORANGO: R$ 12,00
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-[10px] text-gray-800 font-medium">
                        <span>🍓 Ninho com morango</span>
                        <span>🍓 Choconinho c/ morango</span>
                      </div>
                    </div>
                  </section>

                  {/* SEÇÃO 4: FATIAS DE BOLO DE FESTA */}
                  <section className="bg-[#FFFDFE] p-2.5 rounded-xl border border-pink-100/90">
                    <div className="flex items-center justify-between border-b border-pink-200 pb-1 mb-1.5">
                      <h2 className="font-bold text-nice-wine text-xs uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-nice-gold" />
                        <span>Fatia de Bolo de Festa</span>
                      </h2>
                      <span className="text-[9px] font-bold text-nice-pink">
                        R$ 14,00 cada
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-1.5 leading-tight">
                      Fatia bem farta de bolo decorado com camadas generosas de recheio nobre.
                    </p>
                    <div className="space-y-1 text-[10px] text-gray-700">
                      <div className="flex items-center justify-between border-b border-pink-50 pb-0.5">
                        <span className="font-medium">• Prestígio com Chocolate Nobre</span>
                        <span className="font-bold text-nice-pink">R$ 14,00</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-pink-50 pb-0.5">
                        <span className="font-medium">• Brigadeiro Tradicional Intenso</span>
                        <span className="font-bold text-nice-pink">R$ 14,00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">• Ninho com Geleia de Morango Artesanal</span>
                        <span className="font-bold text-nice-pink">R$ 14,00</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* RODAPÉ DA PÁGINA 1 */}
            <div className="border-t-2 border-pink-200 pt-2.5 flex items-center justify-between text-[10px] text-nice-wine font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 font-bold text-nice-pink text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp: (81) 98889-6169
                </span>
                <span>Instagram: {store.instagram}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span>Página 1 de 2 • Doces & Bolos</span>
                <span className="text-[9px] bg-pink-100 text-nice-pink px-2 py-0.5 rounded-full font-bold">
                  Cardápio de Balcão
                </span>
              </div>
            </div>
          </article>
        )}

        {/* ======================================================================= */}
        {/* PÁGINA 2: SALGADOS, KITS FESTA, BEBIDAS & FORMAS DE PAGAMENTO           */}
        {/* ======================================================================= */}
        {(printFilter === "all" || printFilter === "menu") && (
          <article className="a4-page relative bg-white w-[210mm] min-h-[297mm] h-[297mm] p-[10mm] shadow-2xl rounded-2xl print:rounded-none print:shadow-none border border-pink-200 print:border-none flex flex-col justify-between overflow-hidden page-break">
            {/* Moldura decorativa sutil da folha */}
            <div className="absolute inset-2 border-2 border-dashed border-pink-200/90 pointer-events-none rounded-xl" />

            <div>
              {/* TOPO PÁGINA 2: Cabeçalho compacto com identidade visual */}
              <div className="flex items-center justify-between border-b-2 border-pink-200 pb-2.5 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-full border border-nice-pink p-0.5 bg-white flex items-center justify-center overflow-hidden">
                    <Image
                      src={store.logo_url || "/logo.jpg"}
                      alt={store.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <h2 className="font-script text-2xl text-nice-pink leading-none">
                      Nice Doce Sabor
                    </h2>
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-nice-wine">
                      Salgados de Festa, Kits & Bebidas
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-nice-pink to-amber-500 text-white shadow-sm">
                    Encomendas & Balcão • Recife-PE
                  </span>
                </div>
              </div>

              {/* GRID PRINCIPAL EM 2 COLUNAS (PÁGINA 2) */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                {/* ========================================== */}
                {/* COLUNA 1: SALGADOS DE FESTA & BEBIDAS      */}
                {/* ========================================== */}
                <div className="space-y-3">
                  {/* SEÇÃO 1: SALGADOS DE FESTA */}
                  <section className="bg-[#FFFDFE] p-2.5 rounded-xl border border-pink-100/90">
                    <div className="flex items-center justify-between border-b border-pink-200 pb-1 mb-1.5">
                      <h3 className="font-bold text-nice-wine text-xs uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-nice-gold" />
                        <span>Salgados Fritos na Hora</span>
                      </h3>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Sequinhos & Crocantes
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-1.5 leading-tight">
                      Coxinhas douradas, bolinhas de queijo, risoles e kibe artesanal.
                    </p>

                    <div className="space-y-1 text-xs mb-2">
                      <div className="flex items-center justify-between p-1 rounded bg-pink-50/50">
                        <span className="font-semibold text-[10px]">Porção com 15 salgados</span>
                        <span className="font-black text-nice-pink text-xs">R$ 17,00</span>
                      </div>
                      <div className="flex items-center justify-between p-1 rounded bg-pink-50/50">
                        <span className="font-semibold text-[10px]">Porção com 25 salgados</span>
                        <span className="font-black text-nice-pink text-xs">R$ 27,00</span>
                      </div>
                      <div className="flex items-center justify-between p-1 rounded bg-pink-50/50">
                        <span className="font-semibold text-[10px]">Porção com 50 salgados</span>
                        <span className="font-black text-nice-pink text-xs">R$ 52,50</span>
                      </div>
                      <div className="flex items-center justify-between p-1 rounded bg-pink-100/70 border border-pink-200">
                        <span className="font-bold text-[10px] text-nice-wine">
                          Cento de Salgados (100 un.)
                        </span>
                        <span className="font-black text-nice-pink text-xs">R$ 95,00</span>
                      </div>
                    </div>

                    {/* Empadas & Salgadinhos */}
                    <div className="pt-1.5 border-t border-pink-100 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span>• Empada de Frango Artesanal</span>
                        <span className="font-bold text-nice-pink">R$ 7,00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Empada de Charque c/ Requeijão</span>
                        <span className="font-bold text-nice-pink">R$ 10,00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Empadão de Frango Farto</span>
                        <span className="font-bold text-nice-pink">R$ 13,00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Salgadinho no Pacote (Queijo / Cebola)</span>
                        <span className="font-bold text-nice-pink">R$ 6,00</span>
                      </div>
                    </div>
                  </section>

                  {/* SEÇÃO 2: BEBIDAS GELADAS */}
                  <section className="bg-[#FFFDFE] p-2.5 rounded-xl border border-pink-100/90">
                    <div className="flex items-center justify-between border-b border-pink-200 pb-1 mb-1.5">
                      <h3 className="font-bold text-nice-wine text-xs uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-nice-gold" />
                        <span>Bebidas Geladas</span>
                      </h3>
                      <span className="text-[9px] font-semibold text-nice-pink">
                        Bem Geladinho
                      </span>
                    </div>

                    {/* Sucos da Polpa 500ml */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="font-bold text-nice-wine">Sucos Naturais da Polpa (500ml)</span>
                        <span className="font-extrabold text-nice-pink">R$ 6,00 / R$ 7,00</span>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-tight">
                        Maracujá, Acerola, Cajá, Caju, Graviola e Manga.
                      </p>
                      <span className="text-[8px] text-gray-400 block">
                        (Sem leite: R$ 6,00 • Com leite: R$ 7,00)
                      </span>
                    </div>

                    {/* Refrigerantes & Água */}
                    <div className="space-y-1 text-[10px] pt-1.5 border-t border-pink-100">
                      <div className="flex items-center justify-between">
                        <span>• Refrigerante Mini 200ml (Guaraná/Fanta)</span>
                        <span className="font-bold text-nice-pink">R$ 3,50</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Refrigerante Mini 200ml (Coca-Cola Original/Zero)</span>
                        <span className="font-bold text-nice-pink">R$ 4,00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Refrigerante Lata 350ml (Coca-Cola/Antarctica)</span>
                        <span className="font-bold text-nice-pink">R$ 6,00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Coca-Cola 1,5L Garrafa Família</span>
                        <span className="font-bold text-nice-pink">R$ 10,00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Água Mineral 500ml Sem Gás</span>
                        <span className="font-bold text-nice-pink">R$ 2,00</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* ========================================== */}
                {/* COLUNA 2: KITS FESTA & INFORMAÇÕES PIX     */}
                {/* ========================================== */}
                <div className="space-y-3">
                  {/* SEÇÃO 3: KITS FESTA COMPLETOS */}
                  <section className="bg-[#FFFDFE] p-2.5 rounded-xl border-2 border-pink-200">
                    <div className="flex items-center justify-between border-b border-pink-200 pb-1 mb-1.5">
                      <h3 className="font-bold text-nice-wine text-xs uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Kits Festa & Combos Especiais</span>
                      </h3>
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        A Festa Pronta!
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Kit Delícia 2 pessoas */}
                      <div className="p-1.5 rounded-lg bg-pink-50/60 border border-pink-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-nice-wine">
                            Kit Delícia 2 Pessoas
                          </span>
                          <span className="font-black text-nice-pink text-xs">R$ 35,00</span>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-tight">
                          Combo saboroso com salgados artesanais e docinhos finos.
                        </p>
                      </div>

                      {/* Combo Festa Individual */}
                      <div className="p-1.5 rounded-lg bg-pink-50/60 border border-pink-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-nice-wine">
                            Combo Festa Individual
                          </span>
                          <span className="font-black text-nice-pink text-xs">R$ 49,99</span>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-tight">
                          Bolo de 350g + 10 coxinhas crocantes + 10 brigadeiros gourmet.
                        </p>
                      </div>

                      {/* Kit Festa Só 1 Bolinho */}
                      <div className="p-1.5 rounded-lg bg-pink-50/60 border border-pink-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-nice-wine">
                            Kit Festa Só 1 Bolinho
                          </span>
                          <span className="font-black text-nice-pink text-xs">R$ 99,99</span>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-tight">
                          1 Bolo Vulcão delicioso + 20 docinhos gourmet + 30 salgados de festa.
                        </p>
                      </div>

                      {/* Kit Surpresa */}
                      <div className="p-1.5 rounded-lg bg-pink-50/60 border border-pink-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-nice-wine">
                            Kit Surpresa (500g)
                          </span>
                          <span className="font-black text-nice-pink text-xs">R$ 99,99</span>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-tight">
                          1 Bolo Vulcão 500g + 20 doces gourmet + 30 salgados crocantes.
                        </p>
                      </div>

                      {/* Kit Só um Bolinho Grande */}
                      <div className="p-1.5 rounded-lg bg-pink-50/60 border border-pink-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-nice-wine">
                            Kit Só um Bolinho Grande
                          </span>
                          <span className="font-black text-nice-pink text-xs">R$ 249,99</span>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-tight">
                          Bolo decorado de 1kg + 50 doces artesanais + 100 salgados de festa.
                        </p>
                      </div>

                      {/* Kit Festa Completo 25 pessoas */}
                      <div className="p-2 rounded-lg bg-gradient-to-r from-pink-100 via-rose-50 to-amber-100 border border-pink-300">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-nice-wine">
                            Kit Festa Completo (25 pessoas) 🎉
                          </span>
                          <span className="font-black text-nice-pink text-sm">R$ 454,99</span>
                        </div>
                        <p className="text-[9px] text-gray-700 font-medium leading-tight mt-0.5">
                          2kg de bolo decorado + 100 docinhos + 150 salgados fritos + <strong>1 vela vulcão grátis!</strong>
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* BOX INFORMATIVO DE PAGAMENTO & ENCOMENDAS */}
                  <section className="bg-pink-50/70 p-2.5 rounded-xl border border-pink-200 text-[10px] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-nice-wine font-bold">
                      <Clock className="w-3.5 h-3.5 text-nice-pink" />
                      <span>Antecedência para Kits:</span>
                    </div>
                    <p className="text-[9px] text-gray-600 leading-tight pl-5">
                      Combos individuais com 24h e kits grandes com 48h de antecedência.
                    </p>

                    <div className="flex items-center gap-1.5 text-nice-wine font-bold pt-1 border-t border-pink-200">
                      <Sparkles className="w-3.5 h-3.5 text-nice-gold" />
                      <span>Formas de Pagamento:</span>
                    </div>
                    <div className="pl-5 text-[9px] text-gray-700 space-y-0.5">
                      <div>
                        • <strong>PIX Direto sem taxas</strong> (Chave: {store.pix_key})
                      </div>
                      <div>• Dinheiro com troco informado no pedido</div>
                      <div>• Cartões de Débito e Crédito na retirada</div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* RODAPÉ DA PÁGINA 2 */}
            <div className="border-t-2 border-pink-200 pt-2.5 flex items-center justify-between text-[10px] text-nice-wine font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 font-bold text-nice-pink text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  Faça sua Encomenda: (81) 98889-6169
                </span>
                <span>Recife - PE • Retirada no Local</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span>Página 2 de 2 • Salgados & Kits</span>
                <span className="text-[9px] bg-pink-100 text-nice-pink px-2 py-0.5 rounded-full font-bold">
                  Nice Doce Sabor
                </span>
              </div>
            </div>
          </article>
        )}

        {/* ======================================================================= */}
        {/* PÁGINA 3: PLAQUINHAS RECORTÁVEIS DE QR CODE PARA MESAS E BALCÃO (A4)   */}
        {/* ======================================================================= */}
        {(printFilter === "all" || printFilter === "plaquinhas") && (
          <article className="a4-page relative bg-white w-[210mm] min-h-[297mm] h-[297mm] p-[8mm] shadow-2xl rounded-2xl print:rounded-none print:shadow-none border border-pink-200 print:border-none flex flex-col justify-between overflow-hidden page-break">
            <div>
              {/* Título de Instrução da Folha de Plaquinhas */}
              <div className="border-b border-pink-200 pb-2 mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-nice-wine text-sm flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-nice-pink" />
                    <span>Plaquinhas de QR Code para Mesas & Balcão</span>
                  </h2>
                  <p className="text-[10px] text-gray-500">
                    Recorte na linha pontilhada e dobre ou coloque nos displays de acrílico das mesas da loja.
                  </p>
                </div>

                <div className="text-[10px] font-bold text-nice-pink bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200">
                  Folha A4 com 4 Plaquinhas Luxuosas
                </div>
              </div>

              {/* GRID DE 4 PLAQUINHAS RECORTÁVEIS EM FORMATO RETANGULAR */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((num) => (
                  <div
                    key={num}
                    className="relative border-2 border-dashed border-pink-300 rounded-3xl p-4 bg-gradient-to-b from-[#FFFDFE] via-[#FFF8FC] to-[#FFF2F8] flex flex-col items-center text-center justify-between shadow-sm"
                  >
                    {/* Marcador de tesoura no canto para recorte */}
                    <div className="absolute -top-2.5 right-4 bg-white px-1.5 text-[9px] text-gray-400 font-bold flex items-center gap-0.5 border border-pink-200 rounded-full">
                      <Scissors className="w-2.5 h-2.5 text-nice-pink" />
                      <span>recorte</span>
                    </div>

                    {/* Topo da Plaquinha: Logo & Slogan */}
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-nice-pink p-0.5 bg-white shadow-sm flex items-center justify-center overflow-hidden mb-1">
                        <Image
                          src={store.logo_url || "/logo.jpg"}
                          alt={store.name}
                          width={56}
                          height={56}
                          className="rounded-full object-cover w-full h-full"
                        />
                      </div>
                      <h3 className="font-script text-2xl text-nice-pink leading-none">
                        Nice Doce Sabor
                      </h3>
                      <p className="text-[9px] uppercase tracking-wider font-extrabold text-nice-wine mt-0.5">
                        Confeitaria Artesanal
                      </p>
                    </div>

                    {/* QR Code em Destaque */}
                    <div className="my-2 p-2.5 bg-white rounded-2xl shadow-md border-2 border-pink-200 flex flex-col items-center">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code Cardápio"
                          className="w-32 h-32 object-contain"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-pink-100 rounded-xl flex items-center justify-center">
                          <QrIcon className="w-10 h-10 text-nice-pink" />
                        </div>
                      )}
                    </div>

                    {/* Chamada para o cliente */}
                    <div className="space-y-0.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-nice-pink text-white shadow-sm">
                        Peça pelo Celular 📱✨
                      </span>
                      <p className="text-[10px] font-bold text-nice-wine leading-tight max-w-[190px] mx-auto pt-1">
                        Aponte a câmera do seu celular para ver fotos, preços e fazer seu pedido!
                      </p>
                    </div>

                    {/* Rodapé da Plaquinha com Contatos */}
                    <div className="w-full mt-2 pt-2 border-t border-pink-200/80 flex items-center justify-between text-[9px] text-nice-wine font-semibold">
                      <span className="flex items-center gap-1 text-nice-pink font-bold">
                        <Phone className="w-3 h-3" />
                        (81) 98889-6169
                      </span>
                      <span>{store.instagram}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé da Página 3 */}
            <div className="border-t border-pink-200 pt-2 flex items-center justify-between text-[9px] text-gray-500">
              <span>Nice Doce Sabor • Recife-PE • Quarta a Segunda das 12h às 19h</span>
              <span>Página 3 de 3 • Plaquinhas para Display de Mesa & Balcão</span>
            </div>
          </article>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. ESTILOS CSS GLOBAIS DE IMPRESSÃO (A4 FIXO E QUEBRA DE PÁGINA)          */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
