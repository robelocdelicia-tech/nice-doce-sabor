"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Product, ProductVariation, Category } from "@/types";
import {
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Package,
} from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  categories: Category[];
  initialProduct?: Product | null;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  categories,
  initialProduct,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("/products/vulcao_ai.jpg");
  const [badge, setBadge] = useState("");
  const [flavors, setFlavors] = useState<ProductVariation[]>([]);

  // Controle de Estoque
  const [stockControlEnabled, setStockControlEnabled] = useState(true);
  const [currentStock, setCurrentStock] = useState("10");
  const [minStockAlert, setMinStockAlert] = useState("3");

  // Sabor novo com foto
  const [newFlavorName, setNewFlavorName] = useState("");
  const [newFlavorPrice, setNewFlavorPrice] = useState("");
  const [newFlavorImage, setNewFlavorImage] = useState("");
  const [flavorPhotoTargetIndex, setFlavorPhotoTargetIndex] = useState<number | null>(null);
  const [showFlavorPresetPicker, setShowFlavorPresetPicker] = useState(false);
  const flavorFileInputRef = useRef<HTMLInputElement | null>(null);

  // Upload de arquivo
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showPresetGallery, setShowPresetGallery] = useState(false);

  // Galeria de Fotos Rápidas da Confeitaria
  const presetPhotos = [
    { name: "Bolo Vulcão (IA)", url: "/products/vulcao_ai.jpg" },
    { name: "Bolo Vulcão (Real)", url: "/products/real/vulcao.jpg" },
    { name: "Brownies Nobres (IA)", url: "/products/brownies_ai.jpg" },
    { name: "Brownies Nobres (Real)", url: "/products/real/brownies.jpg" },
    { name: "Bombom de Uva (IA)", url: "/products/bombom_uva_ai.jpg" },
    { name: "Bombom de Uva (Real)", url: "/products/real/bombom_uva.jpg" },
    { name: "Bolo no Pote (IA)", url: "/products/bolo_pote_ai.jpg" },
    { name: "Bolo no Pote (Real)", url: "/products/real/bolo_pote.jpg" },
    { name: "Cone Trufado (IA)", url: "/products/cone_trufado_ai.jpg" },
    { name: "Cone Trufado (Real)", url: "/products/real/cone_trufado.jpg" },
    { name: "Empadão de Frango (IA)", url: "/products/empadao_frango_ai.jpg" },
    { name: "Empadão de Frango (Real)", url: "/products/real/empadao_frango.jpg" },
    { name: "Empada de Charque (IA)", url: "/products/empada_charque_ai.jpg" },
    { name: "Empada de Charque (Real)", url: "/products/real/empada_charque.jpg" },
    { name: "Empada de Frango (Real)", url: "/products/real/empada_frango.jpg" },
    { name: "Bombom de Brownie (Real)", url: "/products/real/bombom_brownie.jpg" },
    { name: "Torta de Abacaxi (Real)", url: "/products/real/torta_abacaxi.jpg" },
    { name: "Fatia de Bolo (IA)", url: "/products/fatia_bolo_ai.jpg" },
    { name: "Salgados de Festa (IA)", url: "/products/salgados_festa_ai.jpg" },
    { name: "Pudim Artesanal (IA)", url: "/products/pudim_ai.jpg" },
    { name: "Kits Festa (IA)", url: "/products/kit_festa_ai.jpg" },
    { name: "Sucos Naturais (IA)", url: "/products/sucos_polpa_ai.jpg" },
  ];

  // Sincroniza os estados sempre que initialProduct ou isOpen mudar!
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setCategoryId(initialProduct.category_id || categories[0]?.id || "cat-doces");
      setBasePrice(String(initialProduct.base_price).replace(".", ","));
      setDescription(initialProduct.description || "");
      setImageUrl(initialProduct.images[0] || "/products/vulcao_ai.jpg");
      setBadge(initialProduct.badge || "");
      setFlavors(initialProduct.variations ? [...initialProduct.variations] : []);
      setStockControlEnabled(initialProduct.stock_control_enabled ?? true);
      setCurrentStock(String(initialProduct.current_stock ?? 10));
      setMinStockAlert(String(initialProduct.min_stock_alert ?? 3));
    } else {
      setName("");
      setCategoryId(categories[0]?.id || "cat-doces");
      setBasePrice("");
      setDescription("");
      setImageUrl("/products/vulcao_ai.jpg");
      setBadge("");
      setFlavors([]);
      setStockControlEnabled(true);
      setCurrentStock("10");
      setMinStockAlert("3");
    }
    setNewFlavorName("");
    setNewFlavorPrice("");
    setNewFlavorImage("");
    setFlavorPhotoTargetIndex(null);
    setShowFlavorPresetPicker(false);
    setShowPresetGallery(false);
  }, [initialProduct, isOpen, categories]);

  if (!isOpen) return null;

  // Processamento de imagem do Celular ou Computador (câmera, galeria ou arquivo)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        // Redimensiona para resolução ideal (máx 600x600) em JPEG leve otimizado para salvar sem estourar cota
        const canvas = document.createElement("canvas");
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
          setImageUrl(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.onerror = () => setIsCompressing(false);
      img.src = event.target?.result as string;
    };

    reader.onerror = () => setIsCompressing(false);
    reader.readAsDataURL(file);

    // Limpa o input para permitir selecionar a mesma foto se desejar
    e.target.value = "";
  };

  // Processamento de foto de Sabor/Variação
  const handleFlavorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.70);

          if (flavorPhotoTargetIndex === null) {
            setNewFlavorImage(compressed);
          } else {
            handleUpdateFlavorImage(flavorPhotoTargetIndex, compressed);
          }
        }
        setIsCompressing(false);
      };
      img.onerror = () => setIsCompressing(false);
      img.src = event.target?.result as string;
    };

    reader.onerror = () => setIsCompressing(false);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUpdateFlavorImage = (index: number, imgUrl: string) => {
    const copy = [...flavors];
    copy[index] = {
      ...copy[index],
      image: imgUrl.trim() || undefined,
      image_url: imgUrl.trim() || undefined,
    };
    setFlavors(copy);
  };

  const handleAddFlavor = () => {
    if (!newFlavorName.trim()) return;
    const cleanFlavorPrice = newFlavorPrice.replace(/[^\d.,]/g, "").replace(",", ".");
    const cleanBasePrice = basePrice.replace(/[^\d.,]/g, "").replace(",", ".");
    const price = parseFloat(cleanFlavorPrice) || parseFloat(cleanBasePrice) || 0;

    setFlavors([
      ...flavors,
      {
        name: newFlavorName.trim(),
        price,
        image: newFlavorImage.trim() || undefined,
        image_url: newFlavorImage.trim() || undefined,
      },
    ]);
    setNewFlavorName("");
    setNewFlavorPrice("");
    setNewFlavorImage("");
  };

  const handleRemoveFlavor = (index: number) => {
    setFlavors(flavors.filter((_, idx) => idx !== index));
  };

  const handleUpdateFlavorPrice = (index: number, newPriceVal: string) => {
    const clean = newPriceVal.replace(/[^\d.,]/g, "").replace(",", ".");
    const parsed = parseFloat(clean) || 0;
    const copy = [...flavors];
    copy[index] = { ...copy[index], price: parsed };
    setFlavors(copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanBasePrice = basePrice.replace(/[^\d.,]/g, "").replace(",", ".");
    const parsedBasePrice = parseFloat(cleanBasePrice) || 0;
    const parsedStock = Math.max(0, parseInt(currentStock) || 0);
    const parsedMinAlert = Math.max(0, parseInt(minStockAlert) || 3);

    const product: Product = {
      id: initialProduct?.id || `prod_${Date.now()}`,
      category_id: categoryId || categories[0]?.id || "cat-doces",
      name: name.trim(),
      description:
        description.trim() ||
        "Produto artesanal feito com muito amor pela Nice Doce Sabor.",
      base_price: parsedBasePrice,
      images: [imageUrl.trim() || "/logo.jpg"],
      variations: flavors,
      add_ons: initialProduct?.add_ons || [],
      lead_time_hours: initialProduct?.lead_time_hours || 0,
      badge: badge.trim() || undefined,
      is_active: initialProduct ? initialProduct.is_active : true,
      is_featured: initialProduct ? initialProduct.is_featured : false,
      is_sold_out: initialProduct ? initialProduct.is_sold_out : false,
      sort_order: initialProduct?.sort_order || 99,
      stock_control_enabled: stockControlEnabled,
      current_stock: stockControlEnabled ? parsedStock : undefined,
      min_stock_alert: stockControlEnabled ? parsedMinAlert : undefined,
    };

    onSave(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 border-2 border-pink-100">
        
        {/* Input Oculto de Arquivo de Foto (Celular / Computador) */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div>
            <h3 className="font-extrabold text-nice-wine text-lg sm:text-xl flex items-center gap-2">
              <span>{initialProduct ? "Editar Produto & Preço" : "Cadastrar Novo Produto"}</span>
              <Sparkles className="w-4 h-4 text-nice-pink" />
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Altere a foto, valor, sabores e informações do item
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-nice-wine rounded-full hover:bg-pink-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* SEÇÃO 1: FOTO DO PRODUTO (CELULAR / COMPUTADOR OU GALERIA) */}
          <div className="p-3.5 bg-gradient-to-r from-pink-50/80 via-white to-pink-50/60 rounded-2xl border border-pink-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-nice-wine flex items-center gap-1.5 text-xs">
                <Camera className="w-4 h-4 text-nice-pink" />
                <span>Foto do Produto</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPresetGallery(!showPresetGallery)}
                className="text-[11px] font-bold text-nice-pink hover:underline"
              >
                {showPresetGallery ? "Ocultar Galeria" : "Ver Fotos Prontas da Loja"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Pré-visualização da Foto Atual */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-nice-pink shadow-md bg-pink-100 flex-shrink-0 group">
                <Image
                  src={imageUrl || "/logo.jpg"}
                  alt="Foto do produto"
                  fill
                  sizes="120px"
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo.jpg";
                  }}
                />
                {isCompressing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                    Carregando...
                  </div>
                )}
              </div>

              {/* Botões para Trocar a Foto */}
              <div className="flex-1 w-full space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-nice-pink to-pink-600 hover:from-pink-600 hover:to-nice-pink text-white font-bold text-xs shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Escolher Foto do Celular ou Computador</span>
                </button>
                <p className="text-[10px] text-gray-500 text-center sm:text-left leading-tight">
                  Tire foto com a câmera ou escolha da galeria do celular / arquivos do computador. Otimização automática instantânea.
                </p>
              </div>
            </div>

            {/* Galeria de Fotos Prontas da Loja (Expansível) */}
            {showPresetGallery && (
              <div className="pt-2 border-t border-pink-100 space-y-1.5 animate-in fade-in">
                <span className="text-[10px] font-bold text-gray-600 block">
                  Toque em uma foto pronta da confeitaria para aplicar:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1.5 bg-white rounded-xl border border-pink-200">
                  {presetPhotos.map((photo) => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => {
                        setImageUrl(photo.url);
                        setShowPresetGallery(false);
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                        imageUrl === photo.url
                          ? "border-nice-pink ring-2 ring-nice-pink scale-95"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.name}
                        fill
                        sizes="60px"
                        className="object-cover"
                      />
                      {imageUrl === photo.url && (
                        <div className="absolute inset-0 bg-nice-pink/40 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nome do Produto */}
          <div>
            <label className="font-bold text-nice-wine block mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: Bolo Vulcão, Empadão, Trufa..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine font-medium focus:outline-none focus:ring-2 focus:ring-nice-pink"
            />
          </div>

          {/* Categoria e Preço Base */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-nice-wine block mb-1">
                Categoria no Cardápio *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine font-medium focus:outline-none focus:ring-2 focus:ring-nice-pink bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-nice-wine block mb-1 flex items-center justify-between">
                <span>Preço Base (R$) *</span>
                <span className="text-[10px] text-gray-400 font-normal">Ex: 17,00</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">R$</span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pink-200 text-nice-pink font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-nice-pink"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="font-bold text-nice-wine block mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              placeholder="Descreva recheios, massa e diferenciais artesanais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink text-xs leading-relaxed"
            />
          </div>

          {/* Selo de Destaque */}
          <div>
            <label className="font-bold text-nice-wine block mb-1">
              Selo Promocional / Destaque (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex.: Mais Pedido, Novo, Destaque, Artesanal, Super Recheado..."
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-pink-200 text-nice-wine focus:outline-none focus:ring-2 focus:ring-nice-pink"
            />
          </div>

          {/* CONTROLE DE ESTOQUE (ENTRADAS & SAÍDAS) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-nice-wine flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={stockControlEnabled}
                  onChange={(e) => setStockControlEnabled(e.target.checked)}
                  className="rounded text-nice-pink focus:ring-nice-pink w-4 h-4 cursor-pointer"
                />
                <Package className="w-4 h-4 text-amber-700" />
                <span className="font-extrabold text-nice-wine">Ativar Controle de Estoque</span>
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stockControlEnabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
              }`}>
                {stockControlEnabled ? "Ativo" : "Desativado"}
              </span>
            </div>

            <p className="text-[11px] text-gray-600 leading-relaxed">
              Permite controlar quantas unidades você produziu. Vendas no site e no balcão abatem o estoque automaticamente.
            </p>

            {stockControlEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-100 animate-in fade-in">
                <div>
                  <label className="font-bold text-nice-wine block mb-1 text-[11px]">
                    Estoque Atual (Unidades) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required={stockControlEnabled}
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full p-2 rounded-xl border border-amber-300 text-nice-wine font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-nice-pink bg-white"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Ex: 5 bolos de pote</span>
                </div>

                <div>
                  <label className="font-bold text-nice-wine block mb-1 text-[11px]">
                    Avisar se Baixar de:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full p-2 rounded-xl border border-amber-300 text-nice-wine font-medium text-xs focus:outline-none focus:ring-2 focus:ring-nice-pink bg-white"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Alerta de estoque baixo</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Oculto de Foto para Sabores */}
          <input
            type="file"
            ref={flavorFileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFlavorFileChange}
            className="hidden"
          />

          {/* SEÇÃO 2: SABORES E VARIAÇÕES COM FOTOS E PREÇOS */}
          <div className="pt-3 border-t border-pink-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-nice-wine flex items-center gap-1.5 text-xs">
                <Layers className="w-4 h-4 text-nice-pink" />
                <span>Sabores / Variações com Fotos & Preços ({flavors.length})</span>
              </label>
              <button
                type="button"
                onClick={() => setShowFlavorPresetPicker(!showFlavorPresetPicker)}
                className="text-[11px] font-bold text-nice-pink hover:underline"
              >
                {showFlavorPresetPicker ? "Fechar Fotos Prontas" : "Fotos Prontas para Sabores"}
              </button>
            </div>

            {/* Galeria Rápida de Fotos Prontas para Sabores */}
            {showFlavorPresetPicker && (
              <div className="p-2 bg-pink-50/70 rounded-2xl border border-pink-200 space-y-1.5 animate-in fade-in">
                <span className="text-[10px] font-bold text-gray-600 block">
                  Toque em uma foto para aplicar no novo sabor ou sabor selecionado:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-pink-100">
                  {presetPhotos.map((photo) => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => {
                        if (flavorPhotoTargetIndex === null) {
                          setNewFlavorImage(photo.url);
                        } else {
                          handleUpdateFlavorImage(flavorPhotoTargetIndex, photo.url);
                          setFlavorPhotoTargetIndex(null);
                        }
                        setShowFlavorPresetPicker(false);
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-nice-pink transition hover:scale-95"
                      title={photo.name}
                    >
                      <Image src={photo.url} alt={photo.name} fill sizes="50px" className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Adicionar Novo Sabor com Foto Individual */}
            <div className="flex items-center gap-2 bg-pink-50/40 p-2 rounded-2xl border border-pink-200">
              {/* Botão de Foto do Novo Sabor */}
              {newFlavorImage ? (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-nice-pink flex-shrink-0 group shadow-sm bg-white">
                  <Image src={newFlavorImage} alt="Foto sabor" fill sizes="40px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewFlavorImage("")}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    title="Remover foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFlavorPhotoTargetIndex(null);
                    flavorFileInputRef.current?.click();
                  }}
                  className="w-10 h-10 rounded-xl border-2 border-dashed border-pink-300 hover:border-nice-pink bg-white hover:bg-pink-100/60 flex flex-col items-center justify-center text-nice-pink flex-shrink-0 transition active:scale-95"
                  title="Tirar foto ou escolher da galeria para este sabor"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-bold leading-none">+Foto</span>
                </button>
              )}

              <input
                type="text"
                placeholder="Nome do sabor (ex.: Beijinho, Uva, Ninho...)"
                value={newFlavorName}
                onChange={(e) => setNewFlavorName(e.target.value)}
                className="flex-1 p-2 rounded-xl border border-pink-200 text-nice-wine font-medium text-xs focus:outline-none focus:ring-2 focus:ring-nice-pink bg-white"
              />

              <div className="relative w-20 flex-shrink-0">
                <span className="absolute left-2 top-2 text-[10px] text-gray-400 font-bold">R$</span>
                <input
                  type="text"
                  placeholder="Preço"
                  value={newFlavorPrice}
                  onChange={(e) => setNewFlavorPrice(e.target.value)}
                  className="w-full pl-6 pr-2 py-2 rounded-xl border border-pink-200 text-nice-wine font-bold text-xs focus:outline-none focus:ring-2 focus:ring-nice-pink bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddFlavor}
                className="px-3 py-2 rounded-xl bg-nice-pink text-white hover:bg-nice-pink-hover font-bold text-xs transition flex items-center gap-1 active:scale-95 flex-shrink-0 shadow-sm"
                title="Adicionar sabor"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </div>

            {/* Lista dos Sabores Cadastrados com Edição de Foto e Preço */}
            {flavors.length > 0 && (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {flavors.map((fl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-pink-100 shadow-sm gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Miniatura da foto do sabor */}
                      {fl.image || fl.image_url ? (
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-pink-200 flex-shrink-0 group shadow-sm bg-pink-50">
                          <Image
                            src={fl.image || fl.image_url || "/logo.jpg"}
                            alt={fl.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                            <button
                              type="button"
                              onClick={() => {
                                setFlavorPhotoTargetIndex(idx);
                                flavorFileInputRef.current?.click();
                              }}
                              className="text-white hover:text-nice-pink p-0.5"
                              title="Trocar foto"
                            >
                              <Camera className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateFlavorImage(idx, "")}
                              className="text-white hover:text-rose-400 p-0.5"
                              title="Remover foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFlavorPhotoTargetIndex(idx);
                            flavorFileInputRef.current?.click();
                          }}
                          className="w-9 h-9 rounded-xl border border-dashed border-pink-300 hover:border-nice-pink bg-pink-50/50 hover:bg-pink-100/60 flex flex-col items-center justify-center text-nice-pink flex-shrink-0 transition text-[8px] font-bold"
                          title="Adicionar foto para este sabor"
                        >
                          <Camera className="w-3 h-3" />
                          <span>+Foto</span>
                        </button>
                      )}

                      <span className="font-semibold text-nice-wine truncate text-xs">
                        {fl.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="relative w-20">
                        <span className="absolute left-2 top-1 text-[10px] text-gray-400 font-bold">R$</span>
                        <input
                          type="text"
                          value={fl.price.toFixed(2).replace(".", ",")}
                          onChange={(e) => handleUpdateFlavorPrice(idx, e.target.value)}
                          className="w-full pl-6 pr-1 py-1 rounded-lg border border-pink-200 text-nice-pink font-extrabold text-xs text-right bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFlavor(idx)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition"
                        title="Remover este sabor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-pink-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white font-bold shadow-md shadow-pink-500/25 transition active:scale-95"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
