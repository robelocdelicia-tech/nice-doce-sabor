"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { PromoBanner, Category, Product, MediaAsset } from "@/types";
import { DEFAULT_MEDIA_ASSETS } from "@/lib/constants";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Flame,
  ArrowRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  Search,
  Smartphone,
  Monitor,
  Tag,
  Clock,
  ExternalLink,
} from "lucide-react";

interface PromoBannersManagerProps {
  banners: PromoBanner[];
  onSaveBanners: (updated: PromoBanner[]) => void;
  categories: Category[];
  products?: Product[];
}

export function PromoBannersManager({
  banners,
  onSaveBanners,
  categories,
  products = [],
}: PromoBannersManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);

  // Formulário do Banner
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tag, setTag] = useState("🔥 PROMOÇÃO DA SEMANA");
  const [badge, setBadge] = useState("");
  const [bannerType, setBannerType] = useState<"text_and_photo" | "photo_only" | "coupon_promo">("text_and_photo");
  const [selectedImages, setSelectedImages] = useState<string[]>(["/products/kit_festa_ai.jpg"]);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const [targetSection, setTargetSection] = useState("section-kits-festa");
  const [buttonText, setButtonText] = useState("Ver Oferta");
  const [linkUrl, setLinkUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Visualização e Biblioteca de Mídia
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [mediaFilter, setMediaFilter] = useState<"all" | "product" | "ai" | "upload">("all");
  const [mediaSearch, setMediaSearch] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<MediaAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega fotos enviadas salvas localmente
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("nice_custom_media_uploads");
      if (saved) {
        setUploadedPhotos(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Reúne TODAS as fotos da confeitaria em uma Biblioteca Unificada
  const unifiedMediaLibrary = useMemo(() => {
    const list: MediaAsset[] = [...DEFAULT_MEDIA_ASSETS];
    const seenUrls = new Set<string>(list.map((m) => m.url));

    // Adiciona fotos de todos os produtos do cardápio
    products.forEach((p) => {
      (p.images || []).forEach((img, idx) => {
        if (!seenUrls.has(img)) {
          seenUrls.add(img);
          list.push({
            id: `prod_${p.id}_${idx}`,
            url: img,
            title: `${p.name} ${idx > 0 ? `(${idx + 1})` : ""}`,
            source: "product",
            category: p.category_id,
            product_name: p.name,
          });
        }
      });
    });

    // Adiciona fotos geradas pela IA se houver
    try {
      const aiImgs = localStorage.getItem("nice_ai_generated_images");
      if (aiImgs) {
        const parsed = JSON.parse(aiImgs);
        parsed.forEach((img: any, idx: number) => {
          if (!seenUrls.has(img.url)) {
            seenUrls.add(img.url);
            list.push({
              id: `ai_${idx}`,
              url: img.url,
              title: img.title || "Foto Estúdio IA",
              source: "ai",
            });
          }
        });
      }
    } catch (e) {}

    // Adiciona uploads locais do usuário
    uploadedPhotos.forEach((u) => {
      if (!seenUrls.has(u.url)) {
        seenUrls.add(u.url);
        list.push(u);
      }
    });

    return list;
  }, [products, uploadedPhotos]);

  // Filtra fotos na biblioteca
  const filteredMedia = useMemo(() => {
    return unifiedMediaLibrary.filter((item) => {
      if (mediaFilter !== "all" && item.source !== mediaFilter) return false;
      if (!mediaSearch.trim()) return true;
      const q = mediaSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.product_name && item.product_name.toLowerCase().includes(q))
      );
    });
  }, [unifiedMediaLibrary, mediaFilter, mediaSearch]);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setTag("🔥 PROMOÇÃO DA SEMANA");
    setBadge("Destaque");
    setBannerType("text_and_photo");
    setSelectedImages(["/products/kit_festa_ai.jpg"]);
    setIntervalSeconds(5);
    setTargetSection("section-kits-festa");
    setButtonText("Ver Oferta");
    setLinkUrl("");
    setStartDate("");
    setEndDate("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: PromoBanner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || "");
    setTag(b.tag || "");
    setBadge(b.badge || "");
    setBannerType((b.banner_type as any) || "text_and_photo");
    setSelectedImages(b.images && b.images.length > 0 ? b.images : [b.image_url]);
    setIntervalSeconds(b.interval_seconds || 5);
    setTargetSection(b.target_section_id || "section-kits-festa");
    setButtonText(b.button_text || "Ver Oferta");
    setLinkUrl(b.link_url || "");
    setStartDate(b.start_date ? b.start_date.split("T")[0] : "");
    setEndDate(b.end_date ? b.end_date.split("T")[0] : "");
    setIsModalOpen(true);
  };

  const handleToggleImageSelection = (url: string) => {
    setSelectedImages((prev) => {
      if (prev.includes(url)) {
        if (prev.length === 1) return prev; // Mantém pelo menos 1 foto
        return prev.filter((u) => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  // Upload local de imagem via input file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const newAsset: MediaAsset = {
          id: `upload_${Date.now()}`,
          url: reader.result,
          title: file.name.replace(/\.[^/.]+$/, ""),
          source: "upload",
        };
        const updated = [newAsset, ...uploadedPhotos];
        setUploadedPhotos(updated);
        localStorage.setItem("nice_custom_media_uploads", JSON.stringify(updated));
        setSelectedImages((prev) => [newAsset.url, ...prev]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleActive = (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, is_active: !b.is_active } : b
    );
    onSaveBanners(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este banner promocional?")) return;
    const updated = banners.filter((b) => b.id !== id);
    onSaveBanners(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImages.length === 0) {
      alert("Selecione pelo menos uma foto para o banner.");
      return;
    }

    if (bannerType !== "photo_only" && !title.trim()) {
      alert("Por favor, informe o título do banner.");
      return;
    }

    const bannerObj: PromoBanner = {
      id: editingBanner ? editingBanner.id : `banner_${Date.now()}`,
      title: title.trim() || "Destaque Nice Doce Sabor",
      subtitle: subtitle.trim(),
      tag: tag.trim() || "OFERTA",
      badge: badge.trim(),
      image_url: selectedImages[0],
      images: selectedImages,
      interval_seconds: intervalSeconds,
      banner_type: bannerType,
      target_section_id: targetSection,
      button_text: buttonText.trim(),
      link_url: linkUrl.trim(),
      start_date: startDate ? `${startDate}T00:00:00` : undefined,
      end_date: endDate ? `${endDate}T23:59:59` : undefined,
      is_active: editingBanner ? editingBanner.is_active : true,
      sort_order: editingBanner ? editingBanner.sort_order : banners.length + 1,
    };

    let updated: PromoBanner[];
    if (editingBanner) {
      updated = banners.map((b) => (b.id === editingBanner.id ? bannerObj : b));
    } else {
      updated = [...banners, bannerObj];
    }

    onSaveBanners(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Topo do Módulo de Banners */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-nice-wine shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-nice-wine text-base sm:text-lg">
              Carrossel de Banners & Biblioteca de Mídia
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Crie banners dinâmicos escolhendo fotos do catálogo, da IA ou enviando fotos do seu celular. Suporta carrossel com múltiplas fotos e pré-visualização em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md flex items-center gap-2 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Banner</span>
        </button>
      </div>

      {/* Lista de Banners Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => {
          const imgs = banner.images && banner.images.length > 0 ? banner.images : [banner.image_url];
          return (
            <div
              key={banner.id}
              className={`bg-white rounded-3xl overflow-hidden border-2 transition-all shadow-sm ${
                banner.is_active ? "border-pink-200" : "border-gray-200 opacity-60"
              }`}
            >
              {/* Visualização do Banner */}
              <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-neutral-900">
                <Image
                  src={imgs[0] || "/products/vulcao_ai.jpg"}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-nice-wine">
                      <Flame className="w-3 h-3 fill-current" />
                      {banner.tag}
                    </span>
                    {banner.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                        {banner.badge}
                      </span>
                    )}
                    {imgs.length > 1 && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60">
                        Carrossel ({imgs.length} fotos)
                      </span>
                    )}
                  </div>

                  {banner.banner_type !== "photo_only" && (
                    <div>
                      <h4 className="font-extrabold text-base sm:text-lg leading-tight line-clamp-1 drop-shadow-sm">
                        {banner.title}
                      </h4>
                      <p className="text-xs text-white/90 line-clamp-2 mt-0.5">
                        {banner.subtitle}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Controles do Banner */}
              <div className="p-3 bg-[#FFFDFE] flex items-center justify-between text-xs border-t border-pink-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                      banner.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {banner.is_active ? "Ativo" : "Pausado"}
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Destino: {banner.target_section_id?.replace("section-", "") || "Início"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="p-1.5 text-gray-500 hover:text-nice-wine hover:bg-pink-50 rounded-lg transition"
                    title="Editar anúncio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Excluir anúncio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CRIAR / EDITAR BANNER COM BIBLIOTECA & DUAL PREVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-pink-100 max-h-[92vh] flex flex-col text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div>
                <h3 className="font-bold text-nice-wine text-base">
                  {editingBanner ? "Editar Banner Promocional" : "Criar Banner Promocional"}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Configure fotos, textos e veja a pré-visualização em tempo real
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-nice-wine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL COM ALTERNÂNCIA CELULAR / COMPUTADOR */}
              <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-nice-wine text-xs flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-nice-pink" />
                    <span>Pré-Visualização em Tempo Real</span>
                  </span>

                  <div className="flex items-center bg-white border border-pink-200 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                        previewDevice === "mobile"
                          ? "bg-nice-pink text-white shadow-sm"
                          : "text-gray-500 hover:text-nice-wine"
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Celular</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                        previewDevice === "desktop"
                          ? "bg-nice-pink text-white shadow-sm"
                          : "text-gray-500 hover:text-nice-wine"
                      }`}
                    >
                      <Monitor className="w-3 h-3" />
                      <span>Computador</span>
                    </button>
                  </div>
                </div>

                {/* Banner Renderizado na Pré-Visualização */}
                <div
                  className={`mx-auto overflow-hidden rounded-2xl shadow-md relative transition-all duration-300 ${
                    previewDevice === "mobile"
                      ? "max-w-xs h-40"
                      : "max-w-xl h-48"
                  }`}
                >
                  <Image
                    src={selectedImages[0] || "/products/vulcao_ai.jpg"}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between text-white">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-nice-wine flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" />
                        {tag || "PROMOÇÃO"}
                      </span>
                      {badge && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                          {badge}
                        </span>
                      )}
                    </div>

                    {bannerType !== "photo_only" && (
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-1">
                          {title || "Título do Seu Anúncio"}
                        </h4>
                        <p className="text-[11px] text-white/90 line-clamp-2 mt-0.5">
                          {subtitle || "Texto promocional e detalhes da oferta imperdível."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tipo de Banner e Informações */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Tipo do Banner
                  </label>
                  <select
                    value={bannerType}
                    onChange={(e) => setBannerType(e.target.value as any)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  >
                    <option value="text_and_photo">Foto com Texto & Botão</option>
                    <option value="photo_only">Foto Pura (Banner Visual)</option>
                    <option value="coupon_promo">Anúncio de Cupom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Selo de Destaque
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Ex: 🔥 OFERTA DA SEMANA"
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Badge de Preço / Tag
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Por apenas R$ 45,00"
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  />
                </div>
              </div>

              {bannerType !== "photo_only" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-nice-wine">
                      Título Principal *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Combo Festa Especial da Nice"
                      className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-bold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-nice-wine">
                      Subtítulo / Descrição da Oferta
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ex: 1 Bolo Vulcão + 20 brigadeiros artesanais!"
                      className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                    />
                  </div>
                </div>
              )}

              {/* Seção Alvo e Carrossel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Ao tocar no banner, rolar para:
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  >
                    <option value="section-kits-festa">Kits Festa</option>
                    <option value="section-doces">Bolos Vulcão / Trufas</option>
                    <option value="section-bolo-no-pote">Bolo no Pote</option>
                    <option value="section-fatias">Fatias</option>
                    <option value="section-cones-trufados">Cones Trufados</option>
                    <option value="section-salgados">Salgados & Empadas</option>
                    <option value="section-bebidas">Bebidas & Sucos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-nice-wine">
                    Tempo de Troca no Carrossel (segundos)
                  </label>
                  <select
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-2xl border border-pink-200 text-nice-wine font-semibold focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
                  >
                    <option value={3}>3 segundos (Rápido)</option>
                    <option value={5}>5 segundos (Padrão Recomendado)</option>
                    <option value={8}>8 segundos (Suave)</option>
                  </select>
                </div>
              </div>

              {/* BIBLIOTECA UNIFICADA DE MÍDIA COM UPLOAD */}
              <div className="space-y-3 pt-2 border-t border-pink-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-nice-wine block">
                      Biblioteca Unificada de Fotos ({selectedImages.length} selecionada(s))
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Você pode selecionar várias fotos para montar um carrossel que troca sozinho!
                    </span>
                  </div>

                  {/* Botão de Enviar Foto */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-full bg-nice-wine text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-nice-wine-dark transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Enviar Foto do Celular / PC</span>
                    </button>
                  </div>
                </div>

                {/* Filtro e Busca de Fotos */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[
                      { id: "all", label: "Todas" },
                      { id: "product", label: "Do Cardápio" },
                      { id: "ai", label: "Estúdio IA" },
                      { id: "upload", label: "Enviadas" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMediaFilter(f.id as any)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                          mediaFilter === f.id
                            ? "bg-nice-pink text-white border-nice-pink"
                            : "bg-white text-gray-600 border-pink-100 hover:bg-pink-50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 min-w-[160px] relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar foto por nome..."
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 rounded-xl border border-pink-200 text-xs focus:outline-none focus:ring-1 focus:ring-nice-pink"
                    />
                  </div>
                </div>

                {/* Grade de Fotos */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-2 bg-pink-50/40 rounded-2xl border border-pink-100">
                  {filteredMedia.map((photo) => {
                    const isSelected = selectedImages.includes(photo.url);
                    const orderIndex = selectedImages.indexOf(photo.url);

                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => handleToggleImageSelection(photo.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                          isSelected
                            ? "border-nice-pink ring-2 ring-nice-pink/40 scale-95"
                            : "border-transparent hover:border-pink-300"
                        }`}
                      >
                        <Image
                          src={photo.url}
                          alt={photo.title}
                          fill
                          className="object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-nice-pink/40 flex items-center justify-center text-white font-extrabold text-sm">
                            <span className="w-6 h-6 rounded-full bg-nice-pink text-white flex items-center justify-center shadow-md">
                              {orderIndex + 1}
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] p-0.5 truncate text-center font-medium">
                          {photo.title}
                        </span>
                        <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-black/60 text-white">
                          {photo.source === "ai"
                            ? "IA"
                            : photo.source === "upload"
                            ? "Enviada"
                            : "Cardápio"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-pink-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-pink-200 text-nice-wine font-semibold hover:bg-pink-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white font-bold shadow-md"
                >
                  {editingBanner ? "Salvar Alterações" : "Publicar Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
