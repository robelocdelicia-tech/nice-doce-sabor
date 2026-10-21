// =========================================================================
// DEFINIÇÃO DE TIPOS: Nice Doce Sabor
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
};

export type ProductVariation = {
  name: string;
  price: number;
  image?: string;
  description?: string;
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
  sort_order: number;
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
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_value?: number;
  is_active: boolean;
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
  scheduled_for?: string | null;
  neighborhood_name?: string | null;
  delivery_address?: DeliveryAddress | null;
  delivery_fee: number;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: "pix" | "cash" | "card";
  payment_status: "pending" | "paid" | "refunded";
  cash_change_for?: number | null;
  paid_at?: string | null;
  paid_confirmed_by?: string | null;
  order_status: "received" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
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
  subtitle: string;
  tag: string;
  badge?: string;
  image_url: string;
  target_section_id?: string;
  is_active: boolean;
  sort_order: number;
};
