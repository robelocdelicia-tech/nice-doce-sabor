// =========================================================================
// DEFINIÇÃO DE TIPOS: Nice Doce Sabor 2.0
// =========================================================================

export type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
  label: string;
};

export type ScheduleConfig = {
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  monday: DaySchedule;
  tuesday: DaySchedule;
  [key: string]: DaySchedule;
};

export type BestSellersConfig = {
  mode: "auto" | "manual"; // Automático pelas vendas ou Manual escolhido pela dona
  pinned_product_ids?: string[]; // Produtos fixados no topo
  manual_product_ids?: string[]; // Alias para compatibilidade
  limit?: number; // Quantidade exibida (ex: 4, 6, 8)
  display_limit?: number; // Alias para compatibilidade
  period?: "7d" | "30d" | "month" | "all"; // Período de cálculo
};

export type Store = {
  id: string;
  name: string;
  slug: string;
  owner_name: string;
  phone_whatsapp: string;
  instagram: string;
  city: string;
  pickup_address: string;
  logo_url: string;
  banner_url?: string;
  schedule_config: ScheduleConfig;
  manual_status: "auto" | "open" | "closed";
  closed_custom_message?: string;
  delivery_enabled: boolean;
  min_order_value: number;
  pix_key_type: "phone" | "cpf_cnpj" | "email" | "random";
  pix_key: string;
  pix_beneficiary_name: string;
  pix_city: string;
  whatsapp_status_templates?: Record<string, string>;
  best_sellers_config?: BestSellersConfig;
  stock_display_mode?: "hide" | "show_sold_out" | "sold_out"; // 'hide' (padrão: oculta item) ou 'show_sold_out' (exibe badge Esgotado)
  created_at?: string;
};

export type Category = {
  id: string;
  store_id?: string;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  is_paused?: boolean; // Pausa categoria inteira com 1 clique
  pause_until?: string | null;
};

export type ProductVariation = {
  name: string;
  price: number;
  image?: string;
  description?: string;
  is_paused?: boolean; // Pausa sabor/variação individualmente
  pause_until?: string | null;
  stock_quantity?: number; // Saldo de estoque individual por sabor/variação
};

export type ProductAddOn = {
  name: string;
  price: number;
};

export type Product = {
  id: string;
  store_id?: string;
  category_id?: string;
  name: string;
  description: string;
  base_price: number;
  images: string[];
  variations: ProductVariation[];
  add_ons: ProductAddOn[];
  lead_time_hours: number;
  badge?: "Mais Pedido" | "Novo" | "Destaque" | "Sob Encomenda" | string;
  is_active: boolean;
  is_featured: boolean;
  is_sold_out: boolean;
  is_paused?: boolean; // Chave rápida de estoque: Disponível / Pausado
  pause_until?: string | null; // Data/hora até quando está pausado (ex: "Pausar até amanhã")
  is_archived?: boolean; // Soft delete: arquivado para manter histórico financeiro intacto
  sort_order: number;
  stock_control_enabled?: boolean; // Se true, controla entradas e saídas físicas do item
  current_stock?: number; // Quantidade física atual disponível (ex: 5 bolos de pote)
  min_stock_alert?: number; // Alerta de estoque baixo (ex: avisar quando restar 2 ou menos)
};

export type StockMovementType = "entry" | "sale" | "adjustment" | "loss";

export type StockMovement = {
  id: string;
  product_id: string;
  product_name: string;
  variation_name?: string | null;
  type: StockMovementType; // entry: produção/entrada, sale: saída por pedido, adjustment: ajuste manual, loss: perda/avaria
  quantity: number; // Quantidade movimentada (ex: +5 na produção, -1 na venda)
  previous_stock: number;
  new_stock: number;
  reason?: string; // Motivo descritivo (ex: "Produção da manhã", "Pedido #1024", "Ajuste de inventário")
  order_id?: string;
  order_number?: number;
  created_at: string;
};

export type CartItem = {
  cart_item_id: string; // Identificador único da linha no carrinho
  product: Product;
  quantity: number;
  selected_variation?: ProductVariation | null;
  selected_addons: ProductAddOn[];
  custom_notes: string;
  unit_price: number;
  total_price: number;
};

export type Neighborhood = {
  id: string;
  store_id?: string;
  name: string;
  delivery_fee: number;
  min_order_value?: number;
  free_delivery_above?: number | null;
  is_active: boolean;
};

export type Coupon = {
  id: string;
  store_id?: string;
  code: string; // Código em maiúsculas (ex: NICE10)
  name: string; // Nome interno descritivo
  discount_type: "percent" | "fixed" | "percentage"; // % ou R$ fixo
  discount_value: number; // Ex: 10 (%) ou 15.00 (R$)
  scope: "all" | "category" | "products" | "delivery" | "product"; // Pedido inteiro, Categoria, Produtos específicos ou Frete grátis
  target_ids?: string[]; // IDs de categorias ou produtos aplicáveis
  scope_category_id?: string;
  scope_product_ids?: string[];
  min_order_value?: number; // Pedido mínimo
  max_discount_cap?: number; // Teto máximo de desconto em R$
  max_discount_value?: number; // Alias para max_discount_cap
  start_date?: string; // Início de vigência
  end_date?: string; // Fim de vigência
  max_uses?: number; // Limite global de usos
  usage_limit_total?: number; // Alias para max_uses
  uses_count?: number; // Total de usos realizados
  max_uses_per_customer?: number; // Limite por cliente (WhatsApp)
  usage_limit_per_customer?: number; // Alias para max_uses_per_customer
  first_order_only?: boolean; // Válido apenas na primeira compra
  first_purchase_only?: boolean; // Alias
  order_type_allowed?: "all" | "pickup" | "delivery"; // Apenas retirada, entrega ou ambos
  order_type_restriction?: "all" | "pickup" | "delivery"; // Alias
  is_active: boolean;
  show_banner?: boolean; // Exibir banner de anúncio no cardápio
  show_on_menu?: boolean; // Alias
  banner_text?: string; // Texto promocional no banner
  revenue_generated?: number; // Faturamento total gerado
  total_discount_given?: number; // Total de descontos concedidos
  created_at?: string;
};

export type CouponUsage = {
  id: string;
  coupon_id: string;
  coupon_code: string;
  customer_phone: string;
  order_id: string;
  discount_applied: number;
  created_at: string;
};

export type DeliveryAddress = {
  street: string;
  number: string;
  complement?: string;
  reference?: string;
  neighborhood: string;
};

export type Order = {
  id: string;
  store_id?: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  order_type: "pickup" | "delivery";
  origin?: "online" | "balcao"; // Cardápio online vs Balcão (PDV)
  order_subtype?:
    | "balcao_consumo"
    | "balcao_retirada"
    | "balcao_encomenda"
    | "consumo_local"
    | "retirada"
    | "encomenda";
  scheduled_for?: string | null;
  neighborhood_name?: string | null;
  delivery_address?: DeliveryAddress | null;
  delivery_fee: number;
  subtotal: number;
  discount: number;
  coupon_code?: string | null;
  coupon_discount?: number;
  applied_coupon?: Coupon | null;
  manual_discount?: number;
  total: number;
  payment_method: "pix" | "cash" | "card" | "fiado";
  payment_status: "pending" | "paid" | "refunded";
  cash_change_for?: number | null; // Troco solicitado no online
  cash_tendered?: number | null; // Valor entregue em dinheiro no balcão
  change_due?: number | null; // Troco devolvido no balcão
  is_fiado?: boolean; // Pagar depois (anotado)
  fiado_paid?: boolean;
  paid_at?: string | null;
  paid_confirmed_by?: string | null;
  order_status:
    | "received"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  status?: string; // Alias para compatibilidade
  cancellation_reason?: string | null;
  notes?: string | null;
  is_printed: boolean;
  printed_at?: string | null;
  created_at: string;
  items?: OrderItem[];
};

export type OrderItem = {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name: string;
  name?: string; // Alias
  unit_price: number;
  quantity: number;
  selected_variation?: ProductVariation | null;
  selected_addons?: ProductAddOn[];
  custom_notes?: string | null;
  total_price: number;
};

export type Testimonial = {
  id: string;
  customer_name: string;
  message: string;
  rating: number;
  tag: string;
  avatar_url?: string;
  is_featured: boolean;
};

export type PromoBanner = {
  id: string;
  title: string;
  subtitle?: string;
  tag: string;
  badge?: string;
  image_url: string;
  images?: string[]; // Múltiplas fotos no mesmo banner (carrossel interno)
  interval_seconds?: number; // Tempo de troca
  banner_type?: "standard" | "photo_only" | "coupon_promo" | "text_and_photo";
  button_text?: string;
  link_url?: string;
  coupon_code?: string;
  target_section_id?: string;
  target_url?: string;
  is_active: boolean;
  sort_order: number;
  start_date?: string;
  end_date?: string;
};

export type MediaAsset = {
  id: string;
  url: string;
  title: string;
  source: "product" | "gallery" | "ai_studio" | "upload" | "ai";
  category?: string;
  product_id?: string;
  product_name?: string;
  created_at?: string;
};
