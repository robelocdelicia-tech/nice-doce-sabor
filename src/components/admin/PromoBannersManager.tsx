"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PromoBanner, Category } from "@/types";
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
} from "lucide-react";

interface PromoBannersManagerProps {
  banners: PromoBanner[];
  onSaveBanners: (updated: PromoBanner[]) => void;
  categories: Category[];
}

export function PromoBannersManager({
  banners,
  onSaveBanners,
  categories,
}: PromoBannersManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);

  // Formulário do Banner
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tag, setTag] = useState("🔥 OFERTA DA SEMANA");
  const [badge, setBadge] = useState("");
  const [imageUrl, setImageUrl] = useState("/products/kit_festa_ai.jpg");
  const [targetSection, setTargetSection] = useState("section-kits-festa");

  // Galeria de Fotos disponíveis para Anúncios
  const availablePhotos = [
    { name: "Kits Festa Completo (IA)", url: "/products/kit_festa_ai.jpg" },
    { name: "Bolo Vulcão Brigadeiro (IA)", url: "/products/vulcao_ai.jpg" },
    { name: "Empadão de Frango (IA Luxo)", url: "/products/empadao_frango_ai.jpg" },
    { name: "Empadão de Frango (Foto Real)", url: "/products/real/empadao_frango.jpg" },
    { name: "Empada de Charque (IA Luxo)", url: "/products/empada_charque_ai.jpg" },
    { name: "Empada de Charque (Foto Real)", url: "/products/real/empada_charque.jpg" },
    { name: "Empada de Frango (Foto Real)", url: "/products/real/empada_frango.jpg" },
    { name: "Torta de Abacaxi (Foto Real)", url: "/products/real/torta_abacaxi.jpg" },
    { name: "Bombom de Brownie (Foto Real)", url: "/products/real/bombom_brownie.jpg" },
    { name: "Bombom de Uva (IA Luxo)", url: "/products/bombom_uva_ai.jpg" },
    { name: "Brownies Gourmet (IA Luxo)", url: "/products/brownies_ai.jpg" },
    { name: "Bolo no Pote (IA Luxo)", url: "/products/bolo_pote_ai.jpg" },
    { name: "Fatia de Bolo (IA Luxo)", url: "/products/fatia_bolo_ai.jpg" },
    { name: "Cone Trufado (IA Luxo)", url: "/products/cone_trufado_ai.jpg" },
    { name: "Salgados de Festa (IA Luxo)", url: "/products/salgados_festa_ai.jpg" },
    { name: "Pudim Tradicional (IA Luxo)", url: "/products/pudim_ai.jpg" },
    { name: "Sucos Naturais da Polpa (IA)", url: "/products/sucos_polpa_ai.jpg" },
  ];

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setTag("🔥 PROMOÇÃO DA SEMANA");
    setBadge("Destaque");
    setImageUrl("/products/kit_festa_ai.jpg");
    setTargetSection("section-kits-festa");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: PromoBanner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setTag(b.tag);
    setBadge(b.badge || "");
    setImageUrl(b.image_url);
    setTargetSection(b.target_section_id || "section-doces");
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, is_active: !b.is_active } : b
    );
    onSaveBanners(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este anúncio promocional?")) return;
    const updated = banners.filter((b) => b.id !== id);
    onSaveBanners(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingBanner) {
      const updated = banners.map((b) =>
        b.id === editingBanner.id
          ? {
              ...b,
              title: title.trim(),
              subtitle: subtitle.trim(),
              tag: tag.trim(),
              badge: badge.trim(),
              image_url: imageUrl,
              target_section_id: targetSection,
            }
          : b
      );
      onSaveBanners(updated);
    } else {
      const newBanner: PromoBanner = {
        id: `banner_${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        tag: tag.trim(),
        badge: badge.trim(),
        image_url: imageUrl,
        target_section_id: targetSection,
        is_active: true,
        sort_order: banners.length + 1,
      };
      onSaveBanners([...banners, newBanner]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Gestão de Banners */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-nice-wine shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-nice-wine text-lg">
              Carrossel de Anúncios & Promoções
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Crie anúncios de destaque com fotos profissionais para ofertas, datas comemorativas, combos e novidades. Você escolhe a foto e o texto com facilidade.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md shadow-pink-500/20 flex items-center gap-2 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Anúncio Promocional</span>
        </button>
      </div>

      {/* Lista de Banners Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`bg-white rounded-3xl overflow-hidden border-2 transition-all shadow-sm ${
              banner.is_active ? "border-pink-200" : "border-gray-200 opacity-60"
            }`}
          >
            {/* Visualização do Card como aparece no Cardápio */}
            <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-neutral-900">
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/products/vulcao_ai.jpg";
                }}
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
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-white line-clamp-1">
                    {banner.title}
                  </h4>
                  <p className="text-[11px] text-pink-100 line-clamp-2 mt-0.5">
                    {banner.subtitle}
                  </p>
                </div>
              </div>

              {/* Selo Ativo / Pausado no canto superior direito */}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md ${
                    banner.is_active
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  {banner.is_active ? "Ativo no Cardápio" : "Pausado"}
                </span>
              </div>
            </div>

            {/* Barra de Ações do Banner */}
            <div className="p-4 flex items-center justify-between border-t border-pink-100 bg-pink-50/30">
              <button
                type="button"
                onClick={() => handleToggleActive(banner.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  banner.is_active
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {banner.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{banner.is_active ? "Pausar" : "Ativar"}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(banner)}
                  className="p-2 rounded-full hover:bg-pink-100 text-nice-wine transition"
                  title="Editar Anúncio"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 rounded-full hover:bg-rose-100 text-rose-600 transition"
                  title="Excluir Anúncio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE BANNER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 border-2 border-pink-100">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-400 text-nice-wine">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-nice-wine text-base">
                  {editingBanner ? "Editar Anúncio Promocional" : "Criar Novo Anúncio"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Tag do Anúncio (ex: "🔥 OFERTA DA SEMANA", "🌋 LANÇAMENTO", "🎉 NOVIDADE")
                </label>
                <input
                  type="text"
                  required
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="🔥 OFERTA DA SEMANA"
                  className="w-full p-2.5 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-nice-pink outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Título Principal do Anúncio
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Combo Festa Especial"
                  className="w-full p-2.5 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-nice-pink outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Frase de Destaque / Subtítulo
                </label>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: 1 Bolo Vulcão + 20 doces + 30 salgados crocantes feitos na hora!"
                  className="w-full p-2.5 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-nice-pink outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Selo / Badge (opcional)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Por R$ 99,99"
                    className="w-full p-2.5 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-nice-pink outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Seção Alvo ao Clicar
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full p-2.5 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-nice-pink outline-none"
                  >
                    <option value="section-kits-festa">Kits Festa</option>
                    <option value="section-doces">Doces (Bolo Vulcão / Trufas)</option>
                    <option value="section-bolo-no-pote">Bolo no Pote</option>
                    <option value="section-fatias">Fatias</option>
                    <option value="section-cones-trufados">Cones Trufados</option>
                    <option value="section-salgados">Salgados & Empadas</option>
                    <option value="section-bebidas">Bebidas & Sucos</option>
                  </select>
                </div>
              </div>

              {/* Seletor Visual de Foto */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Escolha a Foto Profissional para o Anúncio:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2 bg-pink-50/50 rounded-2xl border border-pink-200">
                  {availablePhotos.map((photo) => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => setImageUrl(photo.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                        imageUrl === photo.url
                          ? "border-nice-pink ring-2 ring-nice-pink/40 scale-95"
                          : "border-transparent hover:border-pink-300"
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.name}
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                      {imageUrl === photo.url && (
                        <div className="absolute inset-0 bg-nice-pink/40 flex items-center justify-center text-white">
                          <Check className="w-5 h-5 drop-shadow" />
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] p-0.5 truncate text-center">
                        {photo.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md shadow-pink-500/20"
                >
                  {editingBanner ? "Salvar Alterações" : "Publicar Anúncio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
