-- =========================================================================
-- MIGRAÇÃO SUPABASE: Nice Doce Sabor 2.0
-- Funções: Mais Vendidos, Pausar/Arquivar Itens e Sabores, Cupons, PDV Balcão
-- =========================================================================

-- 1. EXTENSÕES & AJUSTES NAS TABELAS DE PRODUTOS E CATEGORIAS
ALTER TABLE IF EXISTS products 
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pause_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS categories 
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pause_until TIMESTAMPTZ;

-- 2. AJUSTES NA TABELA DE PEDIDOS (ORIGEM BALCÃO, CUPONS E TROCO)
ALTER TABLE IF EXISTS orders 
  ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'online', -- 'online' ou 'balcao'
  ADD COLUMN IF NOT EXISTS order_subtype TEXT, -- 'balcao_consumo', 'balcao_retirada', 'balcao_encomenda'
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_discount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_tendered NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS change_due NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_fiado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fiado_paid BOOLEAN DEFAULT FALSE;

-- 3. AJUSTES NA TABELA DE CONFIGURAÇÕES DA LOJA
ALTER TABLE IF EXISTS store_settings 
  ADD COLUMN IF NOT EXISTS best_sellers_config JSONB DEFAULT '{"mode": "auto", "limit": 6, "period": "30d", "pinned_product_ids": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS stock_display_mode TEXT DEFAULT 'hide';

-- 4. CRIAÇÃO DA TABELA DE CUPONS DE DESCONTO
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'category', 'products', 'delivery')),
  target_ids TEXT[] DEFAULT '{}',
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount_cap NUMERIC(10,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER DEFAULT 1,
  first_order_only BOOLEAN DEFAULT FALSE,
  order_type_allowed TEXT DEFAULT 'all' CHECK (order_type_allowed IN ('all', 'pickup', 'delivery')),
  is_active BOOLEAN DEFAULT TRUE,
  show_banner BOOLEAN DEFAULT FALSE,
  banner_text TEXT,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  total_discount_given NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRIAÇÃO DA TABELA DE USOS DE CUPOM (CONTROLE POR CLIENTE / WHATSAPP)
CREATE TABLE IF NOT EXISTS coupon_usages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_id TEXT,
  discount_applied NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_products_paused_archived ON products(is_paused, is_archived, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_origin_created ON orders(origin, created_at);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_phone ON coupon_usages(customer_phone, coupon_code);

-- Habilita RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Public can read active coupons" ON coupons;
CREATE POLICY "Public can read active coupons" ON coupons 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can record coupon usage on checkout" ON coupon_usages;
CREATE POLICY "Public can record coupon usage on checkout" ON coupon_usages 
  FOR INSERT WITH CHECK (true);

-- Dados Iniciais de Exemplo (Se a tabela estiver vazia)
INSERT INTO coupons (code, name, discount_type, discount_value, min_order_value, max_discount_cap, is_active, show_banner, banner_text)
VALUES 
  ('NICE10', 'Boas-Vindas 10% OFF', 'percent', 10.00, 30.00, 25.00, TRUE, TRUE, '🎁 Use o cupom NICE10 e ganhe 10% OFF em pedidos acima de R$ 30!'),
  ('DOCE5', 'R$ 5 OFF em Doces e Bolos', 'fixed', 5.00, 25.00, NULL, TRUE, FALSE, 'R$ 5 de desconto nos doces artesanais!'),
  ('FESTAGRATIS', 'Frete Grátis em Kits Festa', 'fixed', 0.00, 99.00, NULL, TRUE, TRUE, '🚚 Frete Grátis em qualquer Kit Festa com o cupom FESTAGRATIS!')
ON CONFLICT (code) DO NOTHING;
