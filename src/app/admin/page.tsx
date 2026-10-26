"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Order,
  Product,
  ProductVariation,
  Category,
  Store,
  Neighborhood,
  PromoBanner,
  Coupon,
  BestSellersConfig,
} from "@/types";
import {
  DEFAULT_STORE,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_PROMO_BANNERS,
  DEFAULT_COUPONS,
} from "@/lib/constants";
import {
  formatCurrency,
  formatPhone,
  checkStoreStatus,
  generateCustomerStatusWhatsAppUrl,
} from "@/lib/utils";
import { calculateBestSellers, BestSellerItem } from "@/lib/bestSellers";
import { printThermalReceipt } from "@/lib/thermalPrinter";
import {
  Bell,
  Clock,
  Printer,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Package,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Wand2,
  Edit,
  Settings,
  ShoppingBag,
  Tag,
  Flame,
  ChevronDown,
  ChevronUp,
  Archive,
  PauseCircle,
  PlayCircle,
  SlidersHorizontal,
  Boxes,
} from "lucide-react";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { AIImageStudioModal } from "@/components/admin/AIImageStudioModal";
import { ManualOrderModal } from "@/components/admin/ManualOrderModal";
import { EditOrderModal } from "@/components/admin/EditOrderModal";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { PromoBannersManager } from "@/components/admin/PromoBannersManager";
import { DeliveryManagerTab } from "@/components/admin/DeliveryManagerTab";
import { StoreSettingsTab } from "@/components/admin/StoreSettingsTab";
import { POSRegisterTab } from "@/components/admin/POSRegisterTab";
import { CouponsManagerTab } from "@/components/admin/CouponsManagerTab";
import { BestSellersConfigModal } from "@/components/admin/BestSellersConfigModal";
import { StockManagerTab } from "@/components/admin/StockManagerTab";
import { getStoredCoupons, saveStoredCoupons, filterDeletedCoupons } from "@/lib/couponStorage";

function AdminHeaderLogo() {
  const [error, setError] = useState(false);
  return (
    <div className="w-10 h-10 rounded-full border-2 border-nice-pink overflow-hidden p-0.5 bg-white flex items-center justify-center">
      {error ? (
        <span className="text-xs font-bold text-nice-pink font-script">NDS</span>
      ) : (
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={40}
          height={40}
          className="rounded-full object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

function AdminProductThumb({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  return (
    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100 flex items-center justify-center">
      {error || !src ? (
        <span className="text-[10px] font-bold text-nice-pink font-script">NDS</span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "pedidos" | "pdv" | "produtos" | "estoque" | "cupons" | "banners" | "entregas" | "financeiro" | "config"
  >("pedidos");

  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [banners, setBanners] = useState<PromoBanner[]>(DEFAULT_PROMO_BANNERS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(true);
  const [autoPrintToast, setAutoPrintToast] = useState<string>("");

  // Filtros de pedidos e origem (Online vs Balcão)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderOriginFilter, setOrderOriginFilter] = useState<"all" | "online" | "balcao">("all");
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Estados de Pausa, Acordeão de Sabores e Exclusão / Arquivamento
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);

  // Estados do Módulo Mais Vendidos
  const [isBestSellersModalOpen, setIsBestSellersModalOpen] = useState(false);
  const [bestSellersPeriod, setBestSellersPeriod] = useState<"7d" | "30d" | "month" | "all">("30d");

  // Importador em massa
  const [importText, setImportText] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  // Contador de itens com estoque baixo ou esgotado
  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) => !p.is_archived && p.stock_control_enabled && ((p.current_stock ?? 0) <= (p.min_stock_alert ?? 3))
    ).length;
  }, [products]);

  // Modais de Criação e IA
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isAIStudioOpen, setIsAIStudioOpen] = useState(false);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);

  // Modal de exclusão financeira (dupla confirmação)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmWord, setResetConfirmWord] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  // Sino de Novo Pedido (Web Audio API nativa sem depender de arquivos externos)
  const playNewOrderChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 1º Tom (523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // 2º Tom alegre (659.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

      // 3º Tom de confirmação (783.99 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(783.99, now + 0.25);
      gain3.gain.setValueAtTime(0.35, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 0.8);
    } catch (e) {
      console.warn("Autoplay de som aguardando interação:", e);
    }
  };

  const loadOrders = (triggerAutoPrint: boolean = false) => {
    try {
      const savedOrders = localStorage.getItem("nice_orders");
      if (savedOrders) {
        const parsedOrders: Order[] = JSON.parse(savedOrders);
        setOrders(parsedOrders);

        // IMPRESSÃO AUTOMÁTICA ASSIM QUE O PEDIDO SAI:
        if (triggerAutoPrint) {
          const unprintedOrder = parsedOrders.find(
            (o) => !o.is_printed && o.order_status !== "cancelled"
          );

          if (unprintedOrder) {
            if (soundEnabled) {
              playNewOrderChime();
            }

            const isAutoActive = localStorage.getItem("nice_auto_print") !== "false";
            if (isAutoActive) {
              setAutoPrintToast(
                `🖨️ Pedido #${unprintedOrder.order_number} (${unprintedOrder.customer_name}) enviado para impressão automática!`
              );
              setTimeout(() => setAutoPrintToast(""), 6000);

              // Marca como impresso imediatamente para não duplicar impressão
              const marked = parsedOrders.map((o) =>
                o.id === unprintedOrder.id
                  ? { ...o, is_printed: true, printed_at: new Date().toISOString() }
                  : o
              );
              setOrders(marked);
              localStorage.setItem("nice_orders", JSON.stringify(marked));

              // Dispara a impressão na impressora térmica
              setPrintingOrder(unprintedOrder);
              setTimeout(() => {
                window.print();
              }, 300);
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    }
  };

  // Carrega preferências e inicializa polling com detecção em tempo real
  useEffect(() => {
    const savedAuto = localStorage.getItem("nice_auto_print");
    if (savedAuto !== null) {
      setAutoPrintEnabled(savedAuto === "true");
    }

    const savedStore = localStorage.getItem("nice_store_settings");
    if (savedStore) {
      try {
        setStore(JSON.parse(savedStore));
      } catch (e) {
        console.error("Erro ao carregar store:", e);
      }
    }

    const savedNh = localStorage.getItem("nice_neighborhoods");
    if (savedNh) {
      try {
        setNeighborhoods(JSON.parse(savedNh));
      } catch (e) {
        console.error("Erro ao carregar bairros:", e);
      }
    }

    // Carrega cupons respeitando exclusões permanentes
    const initialCoupons = getStoredCoupons();
    setCoupons(initialCoupons);

    // Sincroniza com servidor sem permitir ressuscitar cupons excluídos
    fetch("/api/coupons")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.coupons)) {
          const safeCoupons = filterDeletedCoupons(data.coupons);
          setCoupons(safeCoupons);
          localStorage.setItem("nice_custom_coupons", JSON.stringify(safeCoupons));
        }
      })
      .catch(() => {});

    loadOrders(false); // Carga inicial sem imprimir anteriores

    const interval = setInterval(() => {
      loadOrders(true); // Checa a cada 3 segundos com disparo automático de impressão
    }, 3000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nice_orders") {
        loadOrders(true);
      }
      if (e.key === "nice_store_settings" && e.newValue) {
        try {
          setStore(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === "nice_neighborhoods" && e.newValue) {
        try {
          setNeighborhoods(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === "nice_custom_coupons" && e.newValue) {
        try {
          setCoupons(filterDeletedCoupons(JSON.parse(e.newValue)));
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [soundEnabled]);

  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    localStorage.setItem("nice_orders", JSON.stringify(updated));
  };

  const handleSaveStore = (updatedStore: Store) => {
    setStore(updatedStore);
    localStorage.setItem("nice_store_settings", JSON.stringify(updatedStore));
    window.dispatchEvent(new Event("storage"));
  };

  const handleUpdateDeliveryEnabled = (enabled: boolean) => {
    const updated = { ...store, delivery_enabled: enabled };
    setStore(updated);
    localStorage.setItem("nice_store_settings", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  const handleSaveNeighborhoods = (items: Neighborhood[]) => {
    setNeighborhoods(items);
    localStorage.setItem("nice_neighborhoods", JSON.stringify(items));
    window.dispatchEvent(new Event("storage"));
  };

  const handleToggleAutoPrint = () => {
    const nextVal = !autoPrintEnabled;
    setAutoPrintEnabled(nextVal);
    localStorage.setItem("nice_auto_print", String(nextVal));
  };

  const handleTestPrint = () => {
    const testOrder: Order = {
      id: `test_${Date.now()}`,
      order_number: 9999,
      customer_name: "Teste de Impressão Térmica",
      customer_phone: "81988896169",
      order_type: "pickup",
      delivery_fee: 0,
      subtotal: 35.0,
      discount: 0,
      total: 35.0,
      payment_method: "pix",
      payment_status: "paid",
      order_status: "received",
      notes: "Teste de alinhamento e corte 58mm / 80mm",
      is_printed: true,
      created_at: new Date().toISOString(),
      items: [
        {
          product_name: "Bolo Vulcão de Brigadeiro",
          unit_price: 17.0,
          quantity: 1,
          total_price: 17.0,
        },
        {
          product_name: "Trufas Artesanais",
          unit_price: 4.0,
          quantity: 2,
          selected_variation: { name: "Ninho com Nutella", price: 4.0 },
          total_price: 8.0,
        },
        {
          product_name: "Empadão de Frango",
          unit_price: 10.0,
          quantity: 1,
          total_price: 10.0,
        },
      ],
    };
    setPrintingOrder(testOrder);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Carrega banners personalizados
  useEffect(() => {
    try {
      const savedBanners = localStorage.getItem("nice_promo_banners");
      if (savedBanners) {
        setBanners(JSON.parse(savedBanners));
      }
    } catch (e) {
      console.error("Erro ao carregar banners:", e);
    }
  }, []);

  const handleSaveBanners = (updated: PromoBanner[]) => {
    setBanners(updated);
    localStorage.setItem("nice_promo_banners", JSON.stringify(updated));
  };

  // Carrega produtos personalizados com migração de cache
  useEffect(() => {
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
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    }
  }, []);

  // Sincronização em tempo real de produtos e estoque entre abas e vendas
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const savedProds = localStorage.getItem("nice_custom_products");
        if (savedProds) {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed)) {
            setProducts(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("stock_update", handleStorageUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("stock_update", handleStorageUpdate);
    };
  }, []);

  // Atualização de status com 1 toque
  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: Order["order_status"],
    autoWhatsApp: boolean = false
  ) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          order_status: newStatus,
          payment_status: newStatus === "confirmed" ? ("paid" as const) : o.payment_status,
        };
      }
      return o;
    });
    saveOrders(updated);

    const targetOrder = orders.find((o) => o.id === orderId);
    if (autoWhatsApp && targetOrder) {
      let type: "ready" | "out" | "paid" = "ready";
      if (newStatus === "ready") type = "ready";
      if (newStatus === "out_for_delivery") type = "out";
      if (newStatus === "confirmed") type = "paid";

      const url = generateCustomerStatusWhatsAppUrl(targetOrder, type, store);
      window.open(url, "_blank");
    }
  };

  // Marcar como pago manualmente ao conferir comprovante
  const handleMarkAsPaid = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          payment_status: "paid" as const,
          paid_at: new Date().toISOString(),
          paid_confirmed_by: "Eunice Pereira (Admin)",
        };
      }
      return o;
    });
    saveOrders(updated);
  };

  // Disparo manual para o WhatsApp do cliente
  const handleSendCustomWhatsApp = (
    order: Order,
    type: "ready" | "out" | "paid"
  ) => {
    const url = generateCustomerStatusWhatsAppUrl(order, type, store);
    window.open(url, "_blank");
  };

  // Impressão da comanda térmica (58mm/80mm) padrão iFood (Em pé + Corte no final do conteúdo)
  const handlePrintReceipt = (order: Order) => {
    setPrintingOrder(order);
    printThermalReceipt(order, store);
    // Marca como impresso
    const updated = orders.map((o) =>
      o.id === order.id ? { ...o, is_printed: true, printed_at: new Date().toISOString() } : o
    );
    saveOrders(updated);
  };

  // Salvar ou atualizar produto com persistência
  const handleSaveProduct = (newProd: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === newProd.id);
      let updated: Product[];
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = newProd;
      } else {
        updated = [newProd, ...prev];
      }
      try {
        localStorage.setItem("nice_custom_products", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error("Erro ao salvar produto:", e);
      }
      return updated;
    });
  };

  // Pausar / Liberar Produto
  const handleTogglePauseProduct = (productId: string, pauseUntilTomorrow: boolean = false) => {
    setProducts((prev) => {
      const now = new Date();
      let pauseUntil: string | undefined = undefined;
      if (pauseUntilTomorrow) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        pauseUntil = tomorrow.toISOString();
      }

      const updated = prev.map((p) => {
        if (p.id === productId) {
          const nextPaused = !p.is_paused;
          return {
            ...p,
            is_paused: nextPaused,
            pause_until: nextPaused ? pauseUntil : undefined,
          };
        }
        return p;
      });

      try {
        localStorage.setItem("nice_custom_products", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
      return updated;
    });
  };

  // Pausar / Liberar Sabor Específico
  const handleTogglePauseVariation = (
    productId: string,
    variationName: string,
    pauseUntilTomorrow: boolean = false
  ) => {
    setProducts((prev) => {
      const now = new Date();
      let pauseUntil: string | undefined = undefined;
      if (pauseUntilTomorrow) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        pauseUntil = tomorrow.toISOString();
      }

      const updated = prev.map((p) => {
        if (p.id === productId && p.variations) {
          const updatedVars = p.variations.map((v) => {
            if (v.name === variationName) {
              const nextPaused = !v.is_paused;
              return {
                ...v,
                is_paused: nextPaused,
                pause_until: nextPaused ? pauseUntil : undefined,
              };
            }
            return v;
          });
          return { ...p, variations: updatedVars };
        }
        return p;
      });

      try {
        localStorage.setItem("nice_custom_products", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
      return updated;
    });
  };

  // Pausar / Liberar Categoria Inteira com 1 toque
  const handleTogglePauseCategory = (categoryId: string) => {
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === categoryId ? { ...c, is_paused: !c.is_paused } : c));
      try {
        localStorage.setItem("nice_custom_categories", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
      return updated;
    });
  };

  // Alternar expansão do acordeão de sabores
  const toggleExpandProduct = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Arquivar Produto (Recomendado - não quebra o histórico de pedidos)
  const handleArchiveProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, is_archived: true } : p));
      try {
        localStorage.setItem("nice_custom_products", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
      return updated;
    });
    setDeleteModalProduct(null);
  };

  // Excluir Produto Definitivamente
  const handleDeleteProductPermanently = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem("nice_custom_products", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error("Erro ao excluir produto:", e);
      }
      return updated;
    });
    setDeleteModalProduct(null);
  };

  // Salvar cupons atualizados com persistência à prova de ressuscitação
  const handleSaveCoupons = (updated: Coupon[]) => {
    const saved = saveStoredCoupons(updated);
    setCoupons(saved);
  };

  // Salvar pedido balcão gerado no PDV
  const handleSavePOSOrder = (newOrder: Order) => {
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      localStorage.setItem("nice_orders", JSON.stringify(updated));
      return updated;
    });
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder),
    }).catch((e) => console.warn("Erro ao sincronizar pedido balcão com servidor:", e));
  };

  // Salvar configuração de Mais Vendidos
  const handleSaveBestSellersConfig = (config: BestSellersConfig) => {
    const updatedStore = { ...store, best_sellers_config: config };
    handleSaveStore(updatedStore);
  };

  // Aplicar imagem gerada por IA a um produto
  const handleApplyAIImage = (productId: string, imageUrl: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId
          ? { ...p, images: [imageUrl, ...p.images.filter((img) => img !== imageUrl)] }
          : p
      );
      try {
        localStorage.setItem("nice_custom_products", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error("Erro ao salvar produto:", e);
      }
      return updated;
    });
  };

  // Salvar pedido editado
  const handleSaveEditedOrder = (updatedOrder: Order) => {
    const updated = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    saveOrders(updated);
  };

  // Salvar pedido manual e imprimir se solicitado
  const handleSaveManualOrder = (order: Order, printImmediately: boolean) => {
    const updated = [order, ...orders];
    saveOrders(updated);
    if (printImmediately) {
      handlePrintReceipt(order);
    }
  };

  // Controle de Horário e Botão Aberto/Fechado
  const handleToggleManualStatus = (status: "auto" | "open" | "closed") => {
    setStore((prev) => ({ ...prev, manual_status: status }));
  };

  // Importador em massa (Instagram text parser)
  const handleImportText = () => {
    if (!importText.trim()) return;

    // Suporte a CSV completo e texto de lista do WhatsApp/Instagram
    const lines = importText.split("\n").filter((l) => l.trim().length > 0);
    const newItems: Product[] = [];

    // Se a primeira linha contiver cabeçalho CSV:
    const isCsv = lines[0].toLowerCase().includes("categoria") || lines[0].toLowerCase().includes("nome") || lines[0].includes(";");

    if (isCsv) {
      const dataLines = lines.slice(1);
      dataLines.forEach((line, idx) => {
        // formato: categoria,nome,preco_base,descricao,variacoes,imagem,destaque
        const cols = line.split(",");
        if (cols.length >= 2) {
          const catName = cols[0]?.trim();
          const name = cols[1]?.trim();
          const basePrice = parseFloat(cols[2]?.replace(",", ".") || "0") || 0;
          const desc = cols[3]?.trim() || "Produto artesanal feito sob encomenda.";
          const variacoesStr = cols[4]?.trim() || "";
          const badge = cols[6]?.trim() || undefined;

          // Encontra categoria correspondente
          const targetCat = categories.find((c) => c.name.toLowerCase() === catName?.toLowerCase()) || categories[0];

          // Parse de variações formato Sabor:PreçoFinal;...
          const variations: ProductVariation[] = [];
          if (variacoesStr) {
            const flavorPairs = variacoesStr.split(";");
            flavorPairs.forEach((pair) => {
              const [sabor, preco] = pair.split(":");
              if (sabor && preco) {
                variations.push({
                  name: sabor.trim(),
                  price: parseFloat(preco.replace(",", ".")),
                });
              }
            });
          }

          newItems.push({
            id: `import_csv_${Date.now()}_${idx}`,
            category_id: targetCat?.id || "cat-doces",
            name,
            description: desc,
            base_price: basePrice,
            images: ["/logo.jpg"],
            variations,
            add_ons: [],
            lead_time_hours: 0,
            badge,
            is_active: true,
            is_featured: false,
            is_sold_out: false,
            sort_order: products.length + idx + 1,
          });
        }
      });
    } else {
      // Parser de linhas de texto simples
      lines.forEach((line, idx) => {
        const parts = line.split(/[=–—:]/);
        const name = parts[0]?.trim() || `Produto ${idx + 1}`;
        const priceMatch = line.match(/(?:R\$\s*|=|\s)(\d+[.,]?\d*)/i);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : 10.0;

        newItems.push({
          id: `import_txt_${Date.now()}_${idx}`,
          category_id: categories[0]?.id || "cat-doces",
          name: name,
          description: "Produto artesanal feito com carinho pela Nice Doce Sabor.",
          base_price: price,
          images: ["/logo.jpg"],
          variations: [],
          add_ons: [],
          lead_time_hours: 0,
          is_active: true,
          is_featured: false,
          is_sold_out: false,
          sort_order: products.length + idx + 1,
        });
      });
    }

    setProducts((prev) => [...prev, ...newItems]);
    setImportSuccess(`${newItems.length} produtos importados com sucesso!`);
    setImportText("");
    setTimeout(() => setImportSuccess(""), 4000);
  };

  // Exportar Backup Financeiro em CSV
  const handleExportCSV = () => {
    const headers = "Numero,Data,Cliente,Telefone,Tipo,Total,Status,Pagamento\n";
    const rows = orders
      .map(
        (o) =>
          `#${o.order_number},"${new Date(o.created_at).toLocaleString("pt-BR")}","${o.customer_name}","${o.customer_phone}","${o.order_type}","${o.total.toFixed(2)}","${o.order_status}","${o.payment_status}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `backup_financeiro_nice_doce_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exclusão / Zerar Financeiro com Dupla Confirmação
  const handleResetFinancials = () => {
    if (resetConfirmWord !== "ZERAR") {
      alert("Digite exatamente a palavra ZERAR para confirmar.");
      return;
    }
    // Baixa backup antes
    handleExportCSV();

    // Zera os pedidos
    saveOrders([]);
    setIsResetModalOpen(false);
    setResetConfirmWord("");
    setResetPassword("");
    alert("Financeiro zerado com sucesso! O backup em CSV foi baixado no seu computador.");
  };

  // Métricas financeiras com filtro de origem (Online vs Balcão)
  const financeOrders = orders.filter((o) => {
    if (orderOriginFilter !== "all") {
      const orig = o.origin || "online";
      if (orig !== orderOriginFilter) return false;
    }
    return true;
  });

  const validFinanceOrders = financeOrders.filter(
    (o) => o.status !== "cancelado" && o.order_status !== "cancelled"
  );

  const totalFaturamentoBruto = validFinanceOrders.reduce(
    (sum, o) => sum + (o.subtotal || o.total),
    0
  );

  const totalDescontosConcedidos = validFinanceOrders.reduce(
    (sum, o) => sum + (o.coupon_discount || o.manual_discount || o.discount || 0),
    0
  );

  const totalFaturamento = validFinanceOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPedidos = validFinanceOrders.length;
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;
  const pedidosCancelados = financeOrders.filter(
    (o) => o.status === "cancelado" || o.order_status === "cancelled"
  ).length;

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== "all" && o.order_status !== orderStatusFilter) return false;
    if (orderOriginFilter !== "all") {
      const orig = o.origin || "online";
      if (orig !== orderOriginFilter) return false;
    }
    return true;
  });

  // Ranking dos Mais Vendidos para a tela do financeiro
  const rankingBestSellers = useMemo(() => {
    return calculateBestSellers(orders, products, bestSellersPeriod, store.best_sellers_config);
  }, [orders, products, bestSellersPeriod, store.best_sellers_config]);

  const storeStatus = checkStoreStatus(store);

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#FFF5FA] flex flex-col pb-16">
      
      {/* 1. TOPO ADMIN: STATUS EM TEMPO REAL & CONTROLE ABERTO/FECHADO */}
      <header className="bg-white border-b border-pink-100 shadow-sm sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AdminHeaderLogo />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-nice-wine text-base sm:text-lg">
                  Painel da Dona • Nice Doce Sabor
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-100 text-nice-pink rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Olá, {store.owner_name} • Recife-PE
              </p>
            </div>
          </div>

          {/* CHAVE GRANDE DE STATUS: ABERTO / FECHADO / AUTOMÁTICO */}
          <div className="flex items-center gap-1 bg-pink-50 p-1 rounded-2xl border border-pink-200">
            <button
              onClick={() => handleToggleManualStatus("open")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                store.manual_status === "open"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-emerald-700"
              }`}
            >
              Forçar Aberto
            </button>
            <button
              onClick={() => handleToggleManualStatus("auto")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                store.manual_status === "auto"
                  ? "bg-nice-pink text-white shadow-sm"
                  : "text-gray-600 hover:text-nice-pink"
              }`}
            >
              Automático (12h-19h)
            </button>
            <button
              onClick={() => handleToggleManualStatus("closed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                store.manual_status === "closed"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-rose-700"
              }`}
            >
              Forçar Fechado
            </button>
          </div>

          {/* CONTROLE DE IMPRESSÃO AUTOMÁTICA E TESTE */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleAutoPrint}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                autoPrintEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
              title={autoPrintEnabled ? "Impressão automática ativada" : "Impressão automática desligada"}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Impressão Auto: {autoPrintEnabled ? "LIGADA ✅" : "DESLIGADA ⏸️"}</span>
            </button>

            <button
              type="button"
              onClick={handleTestPrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-pink-50 hover:bg-pink-100 text-nice-wine border border-pink-200 transition"
              title="Testar impressão de comanda 58mm/80mm"
            >
              <span>Testar Cupom</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/cardapio-fag-impressao"
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-nice-pink via-rose-500 to-amber-500 hover:opacity-95 px-3.5 py-1.5 rounded-full shadow-sm hover:shadow transition transform active:scale-95"
              title="Gerar e Descarregar Cardápio Físico em PDF (A4) e Plaquinhas de Mesa"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cardápio em PDF & Plaquinhas</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-xs font-bold text-nice-pink hover:text-nice-pink-hover bg-nice-pink-light px-3 py-1.5 rounded-full transition"
            >
              <span>Ver Cardápio Público</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. ABAS DE NAVEGAÇÃO DO ADMIN */}
      <div className="bg-white border-b border-pink-100 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto py-2 scrollbar-none no-scrollbar">
          <button
            onClick={() => setActiveTab("pedidos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "pedidos"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Central de Pedidos</span>
            {orders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-nice-pink font-extrabold">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("pdv")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "pdv"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Balcão (PDV)</span>
          </button>

          <button
            onClick={() => setActiveTab("produtos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "produtos"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos & Importador</span>
          </button>

          <button
            onClick={() => setActiveTab("estoque")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "estoque"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Estoque (Entradas & Saídas)</span>
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("cupons")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "cupons"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Cupons</span>
            {coupons.filter((c) => c.is_active).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-pink-100 text-nice-pink font-extrabold">
                {coupons.filter((c) => c.is_active).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "banners"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Banners & Promoções</span>
          </button>

          <button
            onClick={() => setActiveTab("entregas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "entregas"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Bairros & Fretes</span>
          </button>

          <button
            onClick={() => setActiveTab("financeiro")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "financeiro"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financeiro & Relatórios</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "config"
                ? "bg-nice-pink text-white shadow-sm"
                : "text-nice-wine/80 hover:bg-pink-50"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações da Loja</span>
          </button>
        </div>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL DAS ABAS */}
      <main className="max-w-6xl mx-auto w-full px-4 pt-6 flex-1">
        
        {/* ======================================================== */}
        {/* ABA 1: CENTRAL DE PEDIDOS EM TEMPO REAL & DISPARO WHATSAPP */}
        {/* ======================================================== */}
        {activeTab === "pedidos" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-nice-wine">
                  Central de Pedidos ao Vivo
                </h2>
                <p className="text-xs text-gray-500">
                  Novos pedidos aparecem aqui automaticamente com alertas e disparos de WhatsApp.
                </p>
              </div>

              {/* Ações e Filtro por status e origem */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsManualOrderOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Pedido Manual</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white border border-pink-200 px-2.5 py-1.5 rounded-xl shadow-sm">
                  <span className="text-[11px] font-bold text-gray-500">Origem:</span>
                  <select
                    value={orderOriginFilter}
                    onChange={(e) => setOrderOriginFilter(e.target.value as any)}
                    className="text-xs font-bold text-nice-wine bg-transparent focus:outline-none"
                  >
                    <option value="all">Todas ({orders.length})</option>
                    <option value="online">Online ({orders.filter((o) => (o.origin || "online") !== "balcao").length})</option>
                    <option value="balcao">Balcão ({orders.filter((o) => o.origin === "balcao").length})</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-pink-200 px-2.5 py-1.5 rounded-xl shadow-sm">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="text-xs font-medium text-nice-wine bg-transparent focus:outline-none"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="received">Recebidos</option>
                    <option value="preparing">Em Preparo</option>
                    <option value="ready">Prontos p/ Retirada</option>
                    <option value="out_for_delivery">Saiu p/ Entrega</option>
                    <option value="delivered">Finalizados</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 shadow-sm">
                <Bell className="w-12 h-12 text-pink-200 mx-auto mb-3" />
                <h3 className="font-bold text-nice-wine text-base">
                  Nenhum pedido nesta categoria
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Assim que um cliente montar e enviar um pedido pelo cardápio, ele surgirá aqui instantaneamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 border border-pink-100 shadow-card-3d flex flex-col justify-between space-y-4 hover:border-pink-300 transition"
                  >
                    {/* Topo do Card: Número, Data e Status */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-base font-extrabold text-nice-pink">
                              #{order.order_number}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {order.origin === "balcao" ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                              Balcão
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-pink-100 text-nice-pink border border-pink-200">
                              Online
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              order.order_status === "received"
                                ? "bg-amber-100 text-amber-800"
                                : order.order_status === "ready"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-nice-pink-light text-nice-pink"
                            }`}
                          >
                            {order.order_status === "received"
                              ? "Recebido"
                              : order.order_status === "ready"
                              ? "Pronto"
                              : order.order_status === "out_for_delivery"
                              ? "Saiu Entrega"
                              : order.order_status}
                          </span>

                          <span
                            className={`text-[10px] font-bold ${
                              order.payment_status === "paid"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {order.payment_status === "paid" ? "✅ PAGO" : "⚠️ A COBRAR / CONFERIR"}
                          </span>
                        </div>
                      </div>

                      {/* Dados do Cliente */}
                      <div className="py-2.5 space-y-1 text-xs">
                        <div className="font-bold text-nice-wine">{order.customer_name}</div>
                        <div className="text-gray-500 font-mono text-[11px]">
                          {formatPhone(order.customer_phone)}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {order.order_type === "delivery" ? "🛵 Entrega" : "🛍️ Retirada"} •{" "}
                          <strong className="text-nice-wine uppercase">{order.payment_method}</strong>
                        </div>
                      </div>

                      {/* Itens do Pedido */}
                      <div className="bg-pink-50/50 p-2.5 rounded-2xl space-y-1.5 text-xs text-gray-700">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="leading-tight">
                            <span className="font-bold text-nice-wine">
                              {it.quantity}x {it.product_name}
                            </span>
                            {it.selected_variation && (
                              <span className="text-[10px] text-nice-pink block">
                                ({it.selected_variation.name})
                              </span>
                            )}
                            {it.custom_notes && (
                              <span className="text-[10px] text-gray-500 italic block">
                                "{it.custom_notes}"
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-gray-500">Valor Total:</span>
                        <span className="text-base font-extrabold text-nice-pink">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* BOTÕES DE AÇÃO: DISPARO WHATSAPP DO CLIENTE & IMPRESSÃO */}
                    <div className="pt-3 border-t border-pink-100 space-y-2">
                      {/* Botão de Dar Baixa / Marcar como Pago */}
                      {order.payment_status !== "paid" && (
                        <button
                          onClick={() => handleMarkAsPaid(order.id)}
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
                        >
                          Conferir Comprovante e Marcar como Pago ✅
                        </button>
                      )}

                      {/* DISPARO 1-CLIQUE: PEDIDO PRONTO / SAIU P/ ENTREGA */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "ready", true)}
                          className="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-sm flex items-center justify-center gap-1 transition active:scale-95"
                          title="Avisa o cliente no WhatsApp que está pronto"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>Pronto (Avisar)</span>
                        </button>

                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery", true)}
                          className="py-2 px-2.5 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white text-[11px] font-bold shadow-sm flex items-center justify-center gap-1 transition active:scale-95"
                          title="Avisa o cliente no WhatsApp que saiu para entrega"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Saiu Entrega</span>
                        </button>
                      </div>

                      {/* Botões Editar Pedido e Imprimir Comanda Térmica */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="py-2 px-3 rounded-xl border border-pink-200 hover:bg-pink-50 text-nice-wine text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                          title="Ajustar valor, dados ou observações"
                        >
                          <Edit className="w-3.5 h-3.5 text-nice-pink" />
                          <span>Editar Pedido</span>
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="py-2 px-3 rounded-xl border border-pink-200 hover:bg-pink-50 text-nice-wine text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-nice-pink" />
                          <span>{order.is_printed ? "Reimprimir" : "Imprimir"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA NOVO PEDIDO NO BALCÃO (PDV) */}
        {/* ======================================================== */}
        {activeTab === "pdv" && (
          <POSRegisterTab
            products={products}
            categories={categories}
            orders={orders}
            onSaveOrder={handleSavePOSOrder}
            store={store}
            coupons={coupons}
          />
        )}

        {/* ======================================================== */}
        {/* ABA 2: PRODUTOS & IMPORTADOR EM MASSA DO INSTAGRAM */}
        {/* ======================================================== */}
        {activeTab === "produtos" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-nice-gold" />
                <h3 className="font-bold text-nice-wine text-base">
                  Importador Rápido de Itens do Instagram
                </h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cole aqui os textos e preços das postagens do Instagram da Nice Doce Sabor (um item por linha). O sistema criará os produtos no cardápio na hora!
              </p>

              <textarea
                rows={4}
                placeholder="Exemplo:&#10;Bolo Vulcão de Ninho com Nutella - R$ 65,00&#10;Caixa de Brigadeiros Gourmet 12 un - R$ 36,00&#10;Empada Doce de Leite Condensado - R$ 8,00"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm border border-pink-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-nice-pink/40"
              />

              {importSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                  {importSuccess}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleImportText}
                  className="px-5 py-2.5 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-md transition"
                >
                  Importar Linhas para o Cardápio
                </button>
              </div>
            </div>

            {/* Listagem de Produtos Cadastrados com Ações de Criação e IA */}
            <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-nice-wine text-base sm:text-lg">
                    Produtos no Cardápio ({products.length} itens)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Gerencie disponibilidade, pause sabores e ajuste fotos e preços
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/cardapio-fag-impressao"
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-pink-50 hover:bg-amber-100 text-nice-wine border border-pink-200 text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    title="Imprimir Cardápio de Balcão e Plaquinhas A4"
                  >
                    <Printer className="w-4 h-4 text-nice-pink" />
                    <span>Cardápio Físico em PDF (A4)</span>
                  </Link>

                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductFormOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Produto</span>
                  </button>

                  <button
                    onClick={() => setIsAIStudioOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-nice-pink to-amber-500 hover:opacity-90 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>✨ Estúdio de Imagens IA</span>
                  </button>
                </div>
              </div>

              {/* Pausa Rápida de Categorias Inteiras */}
              <div className="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-nice-wine text-xs block">
                    Pausar / Liberar Categorias Inteiras:
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Pausar uma categoria esgota e oculta todos os produtos dela com 1 toque.
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleTogglePauseCategory(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        c.is_paused
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-white text-nice-wine border border-pink-200 hover:border-pink-300"
                      }`}
                    >
                      {c.is_paused ? (
                        <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>
                        {c.name} {c.is_paused ? "(Pausada)" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista dos Produtos com Chaves Rápidas de Pausa e Acordeão de Sabores */}
              <div className="space-y-3">
                {products.map((p) => {
                  const hasFlavors = p.variations && p.variations.length > 0;
                  const allFlavorsPaused =
                    hasFlavors && p.variations.every((v) => v.is_paused);
                  const isEffectivePaused = p.is_paused || allFlavorsPaused;
                  const isExpanded = expandedProductIds.has(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border transition-all text-xs overflow-hidden ${
                        p.is_archived
                          ? "bg-gray-100/70 border-gray-300 opacity-60"
                          : isEffectivePaused
                          ? "bg-amber-50/40 border-amber-200"
                          : "bg-[#FFFDFE] border-pink-100 hover:border-pink-200"
                      }`}
                    >
                      {/* Linha Principal do Produto */}
                      <div className="flex flex-wrap items-center justify-between p-3 gap-2">
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <AdminProductThumb
                            src={p.images[0] || "/logo.jpg"}
                            alt={p.name}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-nice-wine text-sm truncate">
                                {p.name}
                              </span>
                              {p.is_archived && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gray-300 text-gray-700">
                                  Arquivado
                                </span>
                              )}
                              {allFlavorsPaused && !p.is_paused && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900">
                                  Todos Sabores Esgotados
                                </span>
                              )}
                              {p.badge && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-pink-100 text-nice-pink">
                                  {p.badge}
                                </span>
                              )}
                              {p.stock_control_enabled && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${
                                    (p.current_stock ?? 0) <= 0
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : (p.current_stock ?? 0) <= (p.min_stock_alert ?? 3)
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  }`}
                                  title={`Estoque atual: ${p.current_stock ?? 0} unidades`}
                                >
                                  <Boxes className="w-2.5 h-2.5" />
                                  <span>{p.current_stock ?? 0} un.</span>
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500 text-[11px] block truncate">
                              {p.description}
                            </span>
                            {hasFlavors && (
                              <button
                                type="button"
                                onClick={() => toggleExpandProduct(p.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-nice-pink hover:text-nice-pink-hover mt-0.5"
                              >
                                <span>
                                  {p.variations.filter((v) => !v.is_paused).length}/
                                  {p.variations.length} sabores ativos
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Controles de Pausa, Preço e Ações */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-extrabold text-nice-pink text-sm sm:text-base mr-1">
                            {formatCurrency(p.base_price)}
                          </span>

                          {/* Chave Rápida de Pausa */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleTogglePauseProduct(p.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                                isEffectivePaused
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                              title={
                                isEffectivePaused
                                  ? "Clique para liberar item no cardápio"
                                  : "Clique para pausar item"
                              }
                            >
                              {isEffectivePaused ? (
                                <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 text-emerald-700" />
                              )}
                              <span>{isEffectivePaused ? "Pausado" : "Disponível"}</span>
                            </button>

                            {!p.is_paused && (
                              <button
                                type="button"
                                onClick={() => handleTogglePauseProduct(p.id, true)}
                                className="px-2 py-1 text-[10px] text-gray-500 hover:text-nice-wine hover:bg-pink-50 rounded-lg transition"
                                title="Pausar apenas até amanhã às 12h (retorna sozinho)"
                              >
                                Até amanhã
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab("estoque")}
                            className="px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-nice-wine text-[11px] font-bold flex items-center gap-1 transition"
                            title="Ver entradas e saídas deste produto no Estoque"
                          >
                            <Boxes className="w-3.5 h-3.5 text-nice-pink" />
                            <span className="hidden sm:inline">Estoque</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductFormOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-nice-wine hover:bg-pink-50 rounded-lg transition"
                            title="Editar produto completo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModalProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Opções de exclusão / arquivamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Acordeão de Sabores / Variações */}
                      {hasFlavors && isExpanded && (
                        <div className="border-t border-pink-100 bg-pink-50/30 p-3 space-y-1.5 pl-6 sm:pl-16">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                            Gerenciar Disponibilidade por Sabor:
                          </span>
                          {p.variations.map((v) => {
                            const isFlavorPaused = Boolean(v.is_paused);
                            return (
                              <div
                                key={v.name}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                                  isFlavorPaused
                                    ? "bg-gray-100 border-gray-200 text-gray-500"
                                    : "bg-white border-pink-100 text-nice-wine"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {(v.image || v.image_url) && (
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-pink-200 flex-shrink-0 bg-pink-50 shadow-sm">
                                      <Image
                                        src={v.image || v.image_url || "/logo.jpg"}
                                        alt={v.name}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                  <span className="font-semibold truncate">{v.name}</span>
                                  <span className="text-[11px] font-bold text-nice-pink flex-shrink-0">
                                    {formatCurrency(v.price)}
                                  </span>
                                  {isFlavorPaused && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-200 text-amber-900 flex-shrink-0">
                                      Esgotado
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePauseVariation(p.id, v.name)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                                      isFlavorPaused
                                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    }`}
                                  >
                                    {isFlavorPaused ? "Pausado" : "Disponível"}
                                  </button>

                                  {!isFlavorPaused && (
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePauseVariation(p.id, v.name, true)}
                                      className="px-2 py-0.5 text-[10px] text-gray-500 hover:text-nice-wine hover:bg-pink-50 rounded"
                                      title="Pausar sabor até amanhã"
                                    >
                                      Até amanhã
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA GESTÃO DE ESTOQUE (ENTRADAS & SAÍDAS PROFISSIONAIS)  */}
        {/* ======================================================== */}
        {activeTab === "estoque" && (
          <StockManagerTab
            products={products}
            categories={categories}
            onSaveProduct={handleSaveProduct}
          />
        )}

        {/* ======================================================== */}
        {/* ABA GESTÃO DE CUPONS DE DESCONTO */}
        {/* ======================================================== */}
        {activeTab === "cupons" && (
          <CouponsManagerTab
            coupons={coupons}
            onSaveCoupons={handleSaveCoupons}
            orders={orders}
            categories={categories}
            products={products}
          />
        )}

        {/* ======================================================== */}
        {/* ABA BANNERS: CARROSSEL DE ANÚNCIOS E PROMOÇÕES DA LOJA */}
        {/* ======================================================== */}
        {activeTab === "banners" && (
          <PromoBannersManager
            banners={banners}
            onSaveBanners={handleSaveBanners}
            categories={categories}
            products={products}
          />
        )}

        {/* ======================================================== */}
        {/* ABA 3: ENTREGAS, BAIRROS E FRETES */}
        {/* ======================================================== */}
        {activeTab === "entregas" && (
          <DeliveryManagerTab
            store={store}
            onUpdateDeliveryEnabled={handleUpdateDeliveryEnabled}
            neighborhoods={neighborhoods}
            onSaveNeighborhoods={handleSaveNeighborhoods}
          />
        )}

        {/* ======================================================== */}
        {/* ABA 4: FINANCEIRO COMPLETO, DASHBOARD E DUPLA CONFIRMAÇÃO */}
        {/* ======================================================== */}
        {activeTab === "financeiro" && (
          <div className="space-y-6">
            {/* Barra de Filtro por Origem (Online vs Balcão) */}
            <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-nice-wine text-base">Painel Financeiro & Vendas</h3>
                <span className="text-xs text-gray-500">
                  Acompanhe faturamento bruto, descontos concedidos, líquido e ranking dos mais vendidos
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-pink-50/60 border border-pink-200 p-1 rounded-2xl">
                {[
                  { id: "all", label: "Todas as Origens" },
                  { id: "online", label: "Cardápio Online" },
                  { id: "balcao", label: "Balcão (PDV)" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderOriginFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      orderOriginFilter === f.id
                        ? "bg-nice-pink text-white shadow-sm"
                        : "text-nice-wine hover:bg-pink-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards de Métricas Financeiras */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                  Faturamento Bruto
                </span>
                <span className="text-base sm:text-xl font-extrabold text-gray-700 mt-1 block">
                  {formatCurrency(totalFaturamentoBruto)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide block">
                  Descontos (Cupons)
                </span>
                <span className="text-base sm:text-xl font-extrabold text-emerald-600 mt-1 block">
                  - {formatCurrency(totalDescontosConcedidos)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-pink-200 shadow-sm bg-gradient-to-tr from-pink-50/50 to-white">
                <span className="text-[10px] font-bold text-nice-pink uppercase tracking-wide block">
                  Faturamento Líquido
                </span>
                <span className="text-base sm:text-xl font-extrabold text-nice-pink mt-1 block">
                  {formatCurrency(totalFaturamento)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                  Total de Pedidos
                </span>
                <span className="text-base sm:text-xl font-extrabold text-nice-wine mt-1 block">
                  {totalPedidos}
                </span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                  Ticket Médio
                </span>
                <span className="text-base sm:text-xl font-extrabold text-nice-wine mt-1 block">
                  {formatCurrency(ticketMedio)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide block">
                  Cancelados
                </span>
                <span className="text-base sm:text-xl font-extrabold text-rose-600 mt-1 block">
                  {pedidosCancelados}
                </span>
              </div>
            </div>

            {/* RANKING DOS PRODUTOS MAIS VENDIDOS NO FINANCEIRO */}
            <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-nice-wine text-base sm:text-lg">
                      Ranking dos Produtos Mais Vendidos
                    </h3>
                    <p className="text-xs text-gray-500">
                      Calculado automaticamente a partir dos pedidos reais (ignorando cancelados)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-pink-50 border border-pink-200 rounded-xl p-0.5 text-xs font-semibold">
                    {[
                      { id: "7d", label: "7 dias" },
                      { id: "30d", label: "30 dias" },
                      { id: "month", label: "Mês atual" },
                      { id: "all", label: "Histórico" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setBestSellersPeriod(p.id as any)}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          bestSellersPeriod === p.id
                            ? "bg-nice-wine text-white shadow-sm"
                            : "text-gray-600 hover:text-nice-wine"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBestSellersModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Configurar Exibição</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Mais Vendidos */}
              {rankingBestSellers.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-xs">
                  Nenhum pedido registrado no período selecionado para compor o ranking.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-pink-50/50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-pink-100">
                      <tr>
                        <th className="py-2.5 px-3">Posição</th>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3 text-center">Qtd. Vendida</th>
                        <th className="py-2.5 px-3 text-right">Faturamento</th>
                        <th className="py-2.5 px-3 text-right">Preço Médio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-50">
                      {rankingBestSellers.map((item: BestSellerItem, idx: number) => {
                        const prod = item.product;
                        const avgPrice =
                          item.total_quantity > 0 ? item.total_revenue / item.total_quantity : 0;

                        return (
                          <tr key={item.product_id} className="hover:bg-pink-50/20 transition">
                            <td className="py-3 px-3 font-extrabold text-nice-pink">
                              <span
                                className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                                  idx === 0
                                    ? "bg-amber-400 text-nice-wine shadow-sm"
                                    : idx === 1
                                    ? "bg-gray-200 text-gray-700"
                                    : idx === 2
                                    ? "bg-amber-700/20 text-amber-800"
                                    : "text-gray-400"
                                }`}
                              >
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100">
                                  <Image
                                    src={prod?.images?.[0] || "/logo.jpg"}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="font-bold text-nice-wine block">{item.name}</span>
                                  {prod?.category_id && (
                                    <span className="text-[10px] text-gray-400">
                                      {categories.find((c) => c.id === prod.category_id)?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold text-nice-wine text-sm">
                              {item.total_quantity} un
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-nice-pink text-sm">
                              {formatCurrency(item.total_revenue)}
                            </td>
                            <td className="py-3 px-3 text-right text-gray-500 font-semibold">
                              {formatCurrency(avgPrice)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ações de Relatório e Backup */}
            <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-nice-wine text-base">
                  Exportação de Dados Financeiros
                </h3>
                <p className="text-xs text-gray-500">
                  Baixe a planilha completa de pedidos em formato CSV para conferência.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-5 py-2.5 rounded-full bg-nice-wine hover:bg-nice-wine-dark text-white text-xs font-bold shadow-sm flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Relatório em Planilha (CSV)</span>
              </button>
            </div>

            {/* ZONA DE PERIGO: ZERAR FINANCEIRO COM DUPLA CONFIRMAÇÃO */}
            <div className="bg-rose-50/60 rounded-3xl p-6 border-2 border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h4 className="font-bold text-sm">Controle Total: Limpar ou Zerar Financeiro</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                A dona tem total liberdade para reiniciar os dados caso deseje. Ao zerar, um arquivo de backup em CSV é baixado automaticamente no seu computador antes de apagar.
              </p>

              <button
                onClick={() => setIsResetModalOpen(true)}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
              >
                Zerar Dados Financeiros
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 5: CONFIGURAÇÕES GERAIS DA LOJA (WHITE-LABEL / PIX) */}
        {/* ======================================================== */}
        {activeTab === "config" && (
          <StoreSettingsTab
            store={store}
            onSaveStore={handleSaveStore}
          />
        )}
      </main>

      {/* MODAL DE DUPLA CONFIRMAÇÃO PARA ZERAR */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-rose-200">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-base text-nice-wine">Confirmação de Segurança</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Esta ação apagará os pedidos salvos no sistema. Um backup em CSV será baixado no seu dispositivo antes de apagar.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Digite a palavra <span className="text-rose-600 font-extrabold">ZERAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={resetConfirmWord}
                onChange={(e) => setResetConfirmWord(e.target.value)}
                placeholder="ZERAR"
                className="w-full p-2.5 border border-rose-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-full border border-gray-300 text-xs font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetFinancials}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Confirmar e Zerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEPTÁCULO PARA IMPRESSÃO TÉRMICA (58mm / 80mm) — PADRÃO IFOOD VERTICAL COM CORTE EXATO */}
      {printingOrder && (
        <div id="thermal-receipt" className="hidden print:block font-mono text-[11px] leading-tight text-black bg-white">
          {/* Cabeçalho da Loja */}
          <div className="text-center font-black text-sm uppercase tracking-wide">
            {store.name || "NICE DOCE SABOR"}
          </div>
          <div className="text-center text-[10px]">Confeitaria Artesanal de Luxo</div>
          <div className="text-center text-[9.5px]">
            {store.city || "Recife/PE"} • {store.phone_whatsapp ? formatPhone(store.phone_whatsapp) : "(81) 98522-8328"}
          </div>

          <div className="border-b-2 border-black my-1" />

          {/* Destaque do Pedido */}
          <div className="flex justify-between items-baseline font-black text-base">
            <span>PEDIDO:</span>
            <span>#{printingOrder.order_number}</span>
          </div>
          <div className="flex justify-between text-[10.5px]">
            <span>DATA/HORA:</span>
            <span className="font-bold">
              {new Date(printingOrder.created_at).toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="flex justify-between text-[10.5px]">
            <span>ORIGEM:</span>
            <span className="font-bold uppercase">
              {printingOrder.origin === "balcao" || printingOrder.order_subtype?.includes("balcao")
                ? "BALCÃO (PDV)"
                : "CARDÁPIO ONLINE"}
            </span>
          </div>

          <div className="border-b-2 border-black my-1" />

          {/* Tipo de Pedido (Destaque Principal) */}
          <div className="border-2 border-black p-1 text-center font-black text-xs uppercase tracking-wider my-1">
            {printingOrder.order_subtype === "balcao_consumo" || printingOrder.order_subtype === "consumo_local"
              ? ">>> CONSUMO NO BALCÃO <<<"
              : printingOrder.order_subtype === "balcao_retirada" ||
                (printingOrder.order_type !== "delivery" && printingOrder.origin === "balcao")
              ? ">>> RETIRADA NO BALCÃO <<<"
              : printingOrder.order_type === "delivery"
              ? ">>> ENTREGA (DELIVERY) <<<"
              : printingOrder.order_subtype === "encomenda" || printingOrder.order_subtype === "balcao_encomenda"
              ? ">>> ENCOMENDA AGENDADA <<<"
              : ">>> RETIRADA NO LOCAL <<<"}
          </div>

          {printingOrder.scheduled_for && (
            <div className="border border-black p-1 text-center font-bold text-[10px] bg-gray-50 my-1">
              🗓️ AGENDADO PARA ENTREGA/RETIRADA:<br />
              <span className="font-black text-xs">{printingOrder.scheduled_for}</span>
            </div>
          )}

          <div className="border-b border-dashed border-black my-1" />

          {/* Dados do Cliente */}
          <div className="font-bold uppercase text-[10px]">DADOS DO CLIENTE:</div>
          <div className="font-black text-xs">{printingOrder.customer_name || "Cliente Balcão"}</div>
          <div className="text-[10px]">Fone: {formatPhone(printingOrder.customer_phone) || "Não informado"}</div>

          {/* Endereço Completo se Entrega */}
          {printingOrder.order_type === "delivery" && (
            <>
              <div className="border-b border-dashed border-black my-1" />
              <div className="font-bold uppercase text-[10px]">ENDEREÇO DE ENTREGA:</div>
              <div className="font-black text-[11px]">
                {printingOrder.delivery_address?.street || "Endereço"}, Nº{" "}
                {printingOrder.delivery_address?.number || "S/N"}
              </div>
              {printingOrder.delivery_address?.complement && (
                <div className="text-[10px]">
                  <b>Compl:</b> {printingOrder.delivery_address.complement}
                </div>
              )}
              <div className="text-[10px]">
                <b>Bairro:</b>{" "}
                {printingOrder.delivery_address?.neighborhood ||
                  printingOrder.neighborhood_name ||
                  "Geral"}
              </div>
              {printingOrder.delivery_address?.reference && (
                <div className="text-[9.5px]">
                  <b>Ponto de Ref:</b> {printingOrder.delivery_address.reference}
                </div>
              )}
            </>
          )}

          <div className="border-b-2 border-black my-1.5" />

          {/* Itens Detalhados do Pedido */}
          <div className="text-center font-black uppercase text-xs tracking-wider">
            ITENS DO PEDIDO
          </div>
          <div className="border-b border-dashed border-black my-1" />

          {printingOrder.items?.map((it, idx) => (
            <div key={idx} className="my-1.5">
              <div className="flex justify-between font-black text-xs">
                <span>
                  [{idx + 1}] {it.quantity}x {it.product_name}
                </span>
                <span>{formatCurrency(it.total_price)}</span>
              </div>
              <div className="pl-2 text-[10px]">
                <div>Unitário: {formatCurrency(it.unit_price)}</div>
                {it.selected_variation && (
                  <div className="font-bold">• Sabor/Tam: {it.selected_variation.name}</div>
                )}
                {it.selected_addons && it.selected_addons.length > 0 && (
                  <div>
                    • Adicionais:{" "}
                    {it.selected_addons.map((a) => `${a.name} (+${formatCurrency(a.price)})`).join(", ")}
                  </div>
                )}
                {it.custom_notes && (
                  <div className="border border-black p-0.5 bg-gray-100 font-bold text-[9.5px] my-0.5">
                    &gt;&gt;&gt; OBS: {it.custom_notes.toUpperCase()} &lt;&lt;&lt;
                  </div>
                )}
              </div>
              <div className="border-b border-dotted border-gray-400 my-1" />
            </div>
          ))}

          {/* Resumo Financeiro */}
          <div className="border-b border-dashed border-black my-1" />
          <div className="flex justify-between text-[10px]">
            <span>Subtotal dos itens:</span>
            <span>{formatCurrency(printingOrder.subtotal || 0)}</span>
          </div>
          {printingOrder.order_type === "delivery" && (
            <div className="flex justify-between text-[10px]">
              <span>Taxa de Entrega:</span>
              <span>
                {printingOrder.delivery_fee && printingOrder.delivery_fee > 0
                  ? formatCurrency(printingOrder.delivery_fee)
                  : "GRÁTIS"}
              </span>
            </div>
          )}
          {((printingOrder.coupon_discount || 0) > 0 || (printingOrder.discount || 0) > 0) && (
            <div className="flex justify-between font-bold text-[10px]">
              <span>Desconto Cupom ({printingOrder.coupon_code || "CUPOM"}):</span>
              <span>- {formatCurrency(printingOrder.coupon_discount || printingOrder.discount || 0)}</span>
            </div>
          )}
          {(printingOrder.manual_discount || 0) > 0 && (
            <div className="flex justify-between font-bold text-[10px]">
              <span>Desconto Especial (Balcão):</span>
              <span>- {formatCurrency(printingOrder.manual_discount || 0)}</span>
            </div>
          )}

          <div className="border-b-2 border-black my-1" />
          <div className="flex justify-between font-black text-sm">
            <span>TOTAL A PAGAR:</span>
            <span>{formatCurrency(printingOrder.total)}</span>
          </div>
          <div className="border-b-2 border-black my-1" />

          {/* Informações de Pagamento e Troco */}
          <div className="font-bold uppercase text-[10px]">PAGAMENTO:</div>
          <div className="flex justify-between font-black text-[11px]">
            <span>FORMA:</span>
            <span>{printingOrder.payment_method.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-[10.5px]">
            <span>STATUS:</span>
            <span className="font-black">
              {printingOrder.payment_status === "paid"
                ? ">>> PAGO [OK] <<<"
                : ">>> A COBRAR NA ENTREGA <<<"}
            </span>
          </div>

          {printingOrder.payment_method === "cash" &&
            printingOrder.cash_change_for &&
            printingOrder.cash_change_for > printingOrder.total && (
              <div className="border border-black p-1 text-center font-bold text-[10px] bg-gray-50 my-1">
                💵 CLIENTE PAGA COM: {formatCurrency(printingOrder.cash_change_for)}
                <br />
                <span className="font-black text-[11px]">
                  LEVAR TROCO DE: {formatCurrency(printingOrder.cash_change_for - printingOrder.total)}
                </span>
              </div>
            )}

          {printingOrder.cash_tendered && (
            <div className="flex justify-between text-[10px]">
              <span>Dinheiro Recebido:</span>
              <span>{formatCurrency(printingOrder.cash_tendered)}</span>
            </div>
          )}

          {printingOrder.change_due && printingOrder.change_due > 0 && (
            <div className="flex justify-between font-bold text-[10.5px]">
              <span>Troco Devolvido:</span>
              <span>{formatCurrency(printingOrder.change_due)}</span>
            </div>
          )}

          {printingOrder.is_fiado && (
            <div className="border border-black p-1 text-center font-bold text-[10px] bg-gray-50 my-1">
              ⚠️ ANOTADO NO CADERNO (FIADO)
            </div>
          )}

          {/* Observações Gerais */}
          {printingOrder.notes && (
            <>
              <div className="border-b border-dashed border-black my-1" />
              <div className="font-bold uppercase text-[10px]">OBSERVAÇÕES DO PEDIDO:</div>
              <div className="border border-black p-1 font-bold text-[10px] bg-gray-50 my-0.5">
                "{printingOrder.notes}"
              </div>
            </>
          )}

          {/* Rodapé e Linha de Corte da Guilhotina */}
          <div className="border-b-2 border-black my-1.5" />
          <div className="text-center font-black text-[10.5px]">
            *** FIM DO PEDIDO #{printingOrder.order_number} ***
          </div>
          <div className="text-center text-[9.5px] mt-0.5">
            Confeitaria Artesanal Nice Doce Sabor ❤️<br />
            Agradecemos a sua preferência!
          </div>
          <div className="border-b border-dashed border-black mt-1.5" />
          <div className="text-center font-bold text-[8.5px] tracking-widest mt-1">
            ---------- CORTE AQUI ----------
          </div>
        </div>
      )}
      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        categories={categories}
        initialProduct={editingProduct}
      />

      {/* MODAL DO ESTÚDIO DE IMAGENS IA */}
      <AIImageStudioModal
        isOpen={isAIStudioOpen}
        onClose={() => setIsAIStudioOpen(false)}
        products={products}
        onApplyImageToProduct={handleApplyAIImage}
      />

      {/* MODAL DE PEDIDO MANUAL */}
      <ManualOrderModal
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        products={products}
        onSaveOrder={handleSaveManualOrder}
      />

      {/* MODAL DE EDIÇÃO DE PEDIDO EXISTENTE */}
      <EditOrderModal
        isOpen={Boolean(editingOrder)}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        onSaveOrder={handleSaveEditedOrder}
      />

      {/* MODAL DE CONFIGURAÇÃO DE MAIS VENDIDOS */}
      <BestSellersConfigModal
        isOpen={isBestSellersModalOpen}
        onClose={() => setIsBestSellersModalOpen(false)}
        products={products}
        currentConfig={store.best_sellers_config}
        onSaveConfig={handleSaveBestSellersConfig}
      />

      {/* MODAL DE ARQUIVAMENTO / EXCLUSÃO DE PRODUTO */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-pink-100 text-xs">
            <div className="flex items-center gap-2.5 text-nice-wine">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Gerenciar Produto: {deleteModalProduct.name}</h3>
                <p className="text-gray-500 text-[11px]">Escolha como deseja remover este item</p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed">
              Você pode <strong className="text-nice-wine">Arquivar</strong> o produto (ocultando do cardápio sem quebrar relatórios e comandas antigas) ou <strong className="text-rose-600">Excluir Definitivamente</strong>.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleArchiveProduct(deleteModalProduct.id)}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Archive className="w-4 h-4" />
                <span>Arquivar Produto (Recomendado)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Tem certeza absoluta? Esta exclusão é definitiva e não pode ser desfeita.")) {
                    handleDeleteProductPermanently(deleteModalProduct.id);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition"
              >
                Excluir Definitivamente do Sistema
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalProduct(null)}
                className="w-full py-2 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICAÇÃO FLUTUANTE DE IMPRESSÃO AUTOMÁTICA */}
      {autoPrintToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <Printer className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <span className="font-bold text-sm">{autoPrintToast}</span>
        </div>
      )}
      </div>
    </AdminAuthGuard>
  );
}
