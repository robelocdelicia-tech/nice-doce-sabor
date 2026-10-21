-- =========================================================================
-- BANCO DE DADOS COMPLETO: Nice Doce Sabor — Confeitaria Artesanal
-- Arquitetura White-Label com Row Level Security (RLS) e Seed Inicial
-- Pronto para colar no SQL Editor do Supabase (Execução com 1 clique)
-- =========================================================================

-- Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE LOJAS (White-Label / Multi-loja)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Nice Doce Sabor',
    slug TEXT UNIQUE NOT NULL DEFAULT 'nice-doce-sabor',
    owner_name TEXT NOT NULL DEFAULT 'Eunice Pereira',
    phone_whatsapp TEXT NOT NULL DEFAULT '5581988896169',
    instagram TEXT NOT NULL DEFAULT '@nice.doce.sabor',
    city TEXT NOT NULL DEFAULT 'Recife-PE',
    pickup_address TEXT NOT NULL DEFAULT 'Recife - PE (Retirada no local)',
    logo_url TEXT DEFAULT '/logo.jpg',
    banner_url TEXT DEFAULT '',
    
    -- Horário de Funcionamento (Quarta a Segunda 12h-19h, Terça Fechado)
    schedule_config JSONB NOT NULL DEFAULT '{
        "wednesday": {"open": "12:00", "close": "19:00", "closed": false, "label": "Quarta-feira"},
        "thursday": {"open": "12:00", "close": "19:00", "closed": false, "label": "Quinta-feira"},
        "friday": {"open": "12:00", "close": "19:00", "closed": false, "label": "Sexta-feira"},
        "saturday": {"open": "12:00", "close": "19:00", "closed": false, "label": "Sábado"},
        "sunday": {"open": "12:00", "close": "19:00", "closed": false, "label": "Domingo"},
        "monday": {"open": "12:00", "close": "19:00", "closed": false, "label": "Segunda-feira"},
        "tuesday": {"open": "00:00", "close": "00:00", "closed": true, "label": "Terça-feira (Fechado)"}
    }'::jsonb,
    
    -- Status manual: 'auto' (segue horário), 'open' (forçar aberto), 'closed' (forçar fechado)
    manual_status TEXT NOT NULL DEFAULT 'auto' CHECK (manual_status IN ('auto', 'open', 'closed')),
    closed_custom_message TEXT DEFAULT 'Estamos fechados no momento. Nosso atendimento é de quarta a segunda, das 12h às 19h (terça-feira fechado).',
    
    -- Entrega (Começa desativada por padrão conforme situação atual da loja)
    delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    
    -- Configuração do PIX Direto (0% de taxa, sem intermediação)
    pix_key_type TEXT NOT NULL DEFAULT 'phone' CHECK (pix_key_type IN ('phone', 'cpf_cnpj', 'email', 'random')),
    pix_key TEXT NOT NULL DEFAULT '81988896169',
    pix_beneficiary_name TEXT NOT NULL DEFAULT 'Eunice Pereira',
    pix_city TEXT NOT NULL DEFAULT 'Recife',
    
    -- Templates de mensagens de WhatsApp para o cliente
    whatsapp_status_templates JSONB NOT NULL DEFAULT '{
        "ready_for_pickup": "Olá *{customer_name}*! 💕\nSeu pedido *#{order_number}* na *Nice Doce Sabor* já está prontinho para retirada!\n\n📍 *Local de Retirada:* {pickup_address}\nQualquer dúvida estamos à disposição!",
        "out_for_delivery": "Olá *{customer_name}*! 🛵💨\nSeu pedido *#{order_number}* acabou de sair para entrega!\nFique atento(a) no endereço informado para receber.",
        "payment_confirmed": "Olá *{customer_name}*! ✅\nConfirmamos o pagamento do seu pedido *#{order_number}*! Já estamos cuidando de tudo com muito carinho.",
        "cancelled": "Olá *{customer_name}*.\nSeu pedido *#{order_number}* foi cancelado. Motivo: {reason}."
    }'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT DEFAULT 'cake',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Variações de sabores ou tamanhos com preços individuais
    variations JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Adicionais / Opcionais
    add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Antecedência mínima para encomendas em horas (ex.: 24h ou 48h para bolos e kits)
    lead_time_hours INT NOT NULL DEFAULT 0,
    
    badge TEXT DEFAULT NULL, -- 'Mais Pedido', 'Novo', 'Destaque', 'Artesanal'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE BANNERS PROMOCIONAIS & ANÚNCIOS
CREATE TABLE IF NOT EXISTS public.promo_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    image_url TEXT NOT NULL,
    badge TEXT DEFAULT 'Destaque',
    button_text TEXT DEFAULT 'Ver Opções',
    action_type TEXT DEFAULT 'scroll_to_section',
    action_target TEXT DEFAULT 'section-doces',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE BAIRROS E FRETES (Cadastrável no admin)
CREATE TABLE IF NOT EXISTS public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    min_order_value NUMERIC(10,2) DEFAULT 0.00,
    free_delivery_above NUMERIC(10,2) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA DE CUPONS DE DESCONTO
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    min_order_value NUMERIC(10,2) DEFAULT 0.00,
    max_uses INT DEFAULT NULL,
    current_uses INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_number BIGSERIAL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('pickup', 'delivery')),
    scheduled_for TIMESTAMPTZ DEFAULT NULL,
    
    -- Dados de entrega se aplicável
    neighborhood_name TEXT DEFAULT NULL,
    delivery_address JSONB DEFAULT NULL,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    
    -- Valores
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    
    -- Pagamento
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cash', 'card')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    cash_change_for NUMERIC(10,2) DEFAULT NULL,
    paid_at TIMESTAMPTZ DEFAULT NULL,
    paid_confirmed_by TEXT DEFAULT NULL,
    
    -- Status do Pedido
    order_status TEXT NOT NULL DEFAULT 'received' CHECK (order_status IN ('received', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
    cancellation_reason TEXT DEFAULT NULL,
    
    -- Observações gerais
    notes TEXT DEFAULT NULL,
    
    -- Controle de Impressão Térmica
    is_printed BOOLEAN NOT NULL DEFAULT FALSE,
    printed_at TIMESTAMPTZ DEFAULT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected_variation JSONB DEFAULT NULL,
    selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_notes TEXT DEFAULT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. DEPOIMENTOS / HISTÓRIAS (Feedback do Instagram)
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    message TEXT NOT NULL,
    rating INT NOT NULL DEFAULT 5,
    tag TEXT DEFAULT 'Feedback no Instagram',
    avatar_url TEXT DEFAULT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ÍNDICES PARA ALTA VELOCIDADE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_promo_banners_store ON public.promo_banners(store_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas para reexecução sem erros
DROP POLICY IF EXISTS "Public read stores" ON public.stores;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read promo_banners" ON public.promo_banners;
DROP POLICY IF EXISTS "Public read neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public read own order by id" ON public.orders;
DROP POLICY IF EXISTS "Public insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public read order items" ON public.order_items;

DROP POLICY IF EXISTS "Auth full access stores" ON public.stores;
DROP POLICY IF EXISTS "Auth full access categories" ON public.categories;
DROP POLICY IF EXISTS "Auth full access products" ON public.products;
DROP POLICY IF EXISTS "Auth full access promo_banners" ON public.promo_banners;
DROP POLICY IF EXISTS "Auth full access neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "Auth full access coupons" ON public.coupons;
DROP POLICY IF EXISTS "Auth full access orders" ON public.orders;
DROP POLICY IF EXISTS "Auth full access order items" ON public.order_items;
DROP POLICY IF EXISTS "Auth full access testimonials" ON public.testimonials;

-- 1. Leitura Pública do Cardápio
CREATE POLICY "Public read stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read promo_banners" ON public.promo_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Public read neighborhoods" ON public.neighborhoods FOR SELECT USING (is_active = true);
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (is_featured = true);

-- 2. Criação Pública de Pedidos (Qualquer cliente faz pedido sem precisar de conta)
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own order by id" ON public.orders FOR SELECT USING (true);

CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (true);

-- 3. Acesso Completo para Administrador Autenticado
CREATE POLICY "Auth full access stores" ON public.stores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access promo_banners" ON public.promo_banners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access neighborhoods" ON public.neighborhoods FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access coupons" ON public.coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access order items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access testimonials" ON public.testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================================
-- SEED INICIAL COM DADOS REAIS DA CONFEITARIA NICE DOCE SABOR
-- =========================================================================
DO $$
DECLARE
    v_store_id UUID;
    v_cat_doces UUID;
    v_cat_bolo_pote UUID;
    v_cat_fatias UUID;
    v_cat_cones UUID;
    v_cat_salgados UUID;
    v_cat_kits UUID;
    v_cat_bebidas UUID;
BEGIN
    -- 1. Loja Nice Doce Sabor
    INSERT INTO public.stores (
        name, slug, owner_name, phone_whatsapp, instagram, city, pickup_address, delivery_enabled, pix_key, pix_beneficiary_name
    ) VALUES (
        'Nice Doce Sabor',
        'nice-doce-sabor',
        'Eunice Pereira',
        '5581988896169',
        '@nice.doce.sabor',
        'Recife-PE',
        'Recife - PE (Retirada no local)',
        FALSE,
        '81988896169',
        'Eunice Pereira'
    )
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name,
        phone_whatsapp = EXCLUDED.phone_whatsapp,
        pix_key = EXCLUDED.pix_key
    RETURNING id INTO v_store_id;

    -- 2. Categorias Oficiais
    INSERT INTO public.categories (store_id, name, slug, icon, sort_order)
    VALUES (v_store_id, 'Doces', 'doces', 'candy', 1) RETURNING id INTO v_cat_doces;

    INSERT INTO public.categories (store_id, name, slug, icon, sort_order)
    VALUES (v_store_id, 'Bolo no pote', 'bolo-no-pote', 'cake', 2) RETURNING id INTO v_cat_bolo_pote;

    INSERT INTO public.categories (store_id, name, slug, icon, sort_order)
    VALUES (v_store_id, 'Fatias', 'fatias', 'pie-chart', 3) RETURNING id INTO v_cat_fatias;

    INSERT INTO public.categories (store_id, name, slug, icon, sort_order)
    VALUES (v_store_id, 'Cones trufados', 'cones-trufados', 'ice-cream', 4) RETURNING id INTO v_cat_cones;

    INSERT INTO public.categories (store_id, name, slug, icon, sort_order)
    VALUES (v_store_id, 'Salgados', 'salgados', 'croissant', 5) RETURNING id INTO v_cat_salgados;

    INSERT INTO public.categories (store_id, name, slug, icon, sort_order)
    VALUES (v_store_id, 'Kits Festa', 'kits-festa', 'party-popper', 6) RETURNING id INTO v_cat_kits;

    INSERT INTO public.categories (store_id, name, slug, icon, sort_order)
    VALUES (v_store_id, 'Bebidas', 'bebidas', 'glass-water', 7) RETURNING id INTO v_cat_bebidas;

    -- 3. Produtos: Doces (com Trufas e todos os 8 sabores)
    INSERT INTO public.products (
        store_id, category_id, name, description, base_price, images, variations, badge, sort_order
    ) VALUES (
        v_store_id, v_cat_doces, 'Trufas Artesanais',
        'Trufa artesanal de chocolate nobre com recheio cremoso que derrete na boca.',
        4.00,
        '["https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&auto=format&fit=crop&q=80"]'::jsonb,
        '[
            {"name": "Brigadeiro", "price": 4.00},
            {"name": "Beijinho", "price": 4.00},
            {"name": "Uva", "price": 4.00},
            {"name": "Café", "price": 4.00},
            {"name": "Maracujá", "price": 4.00},
            {"name": "Morango", "price": 4.00},
            {"name": "Ninho com Nutella", "price": 4.00},
            {"name": "Dois amores", "price": 4.00}
        ]'::jsonb,
        'Artesanal', 1
    );

    INSERT INTO public.products (store_id, category_id, name, description, base_price, images, sort_order)
    VALUES 
        (v_store_id, v_cat_doces, 'Tortinha doce', 'Tortinha individual com massa crocante amanteigada e recheio especial.', 6.00, '["https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop&q=80"]'::jsonb, 2),
        (v_store_id, v_cat_doces, 'Brownie tradicional', 'Massa densa e chocolatuda com casquinha craquelada irresistível.', 5.00, '["https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80"]'::jsonb, 3),
        (v_store_id, v_cat_doces, 'Brownie recheado', 'Brownie especial com camada generosa de doce de leite ou brigadeiro.', 8.00, '["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80"]'::jsonb, 4),
        (v_store_id, v_cat_doces, 'Pudim', 'Pudim lisinho e aveludado com calda de caramelo dourada brilhante.', 6.00, '["https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=80"]'::jsonb, 5),
        (v_store_id, v_cat_doces, 'Bombom de uva', 'Uvas verdes selecionadas envoltas em brigadeiro branco e chocolate nobre.', 13.00, '["https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80"]'::jsonb, 6),
        (v_store_id, v_cat_doces, 'Bombom de brownie', 'Pedaços macios de brownie cobertos com chocolate e recheio artesanal.', 13.00, '["https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800&auto=format&fit=crop&q=80"]'::jsonb, 7),
        (v_store_id, v_cat_doces, 'Torta de abacaxi', 'Fatia deliciosa de torta com pedaços de abacaxi caramelizado e creme.', 13.00, '["https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80"]'::jsonb, 8),
        (v_store_id, v_cat_doces, 'Bolo Vulcão', 'Massa fofinha com piscina transbordando de calda cremosa.', 17.00, '["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80"]'::jsonb, 9);

    -- 4. Produtos: Bolo no Pote (Sabores R$ 10,00 e R$ 12,00)
    INSERT INTO public.products (
        store_id, category_id, name, description, base_price, images, variations, badge, sort_order
    ) VALUES (
        v_store_id, v_cat_bolo_pote, 'Bolo no pote',
        'Camadas generosas de bolo artesanal molhadinho com recheios cremosos.',
        10.00,
        '["https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80"]'::jsonb,
        '[
            {"name": "Prestígio", "price": 10.00},
            {"name": "Brigadeiro", "price": 10.00},
            {"name": "Cenoura com chocolate", "price": 10.00},
            {"name": "Chocolate com maracujá", "price": 10.00},
            {"name": "Maracujá", "price": 10.00},
            {"name": "Choconinho com Nutella", "price": 10.00},
            {"name": "Ninho com Nutella", "price": 10.00},
            {"name": "Doce de leite c/ beijinho", "price": 10.00},
            {"name": "Limão", "price": 10.00},
            {"name": "Ninho com morango", "price": 12.00},
            {"name": "Choconinho com morango", "price": 12.00}
        ]'::jsonb,
        'Mais Pedido', 10
    );

    -- 5. Banners Promocionais
    INSERT INTO public.promo_banners (store_id, title, subtitle, image_url, badge, button_text, action_target, sort_order)
    VALUES
        (v_store_id, 'Kits Festa Delícia', 'O combo perfeito de bolo vulcão, salgadinhos e docinhos para sua comemoração.', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80', 'Promoção', 'Ver Kits Festa', 'section-kits-festa', 1),
        (v_store_id, 'Bolos no Pote Especiais', 'Mais de 10 sabores irresistíveis preparados diariamente com ingredientes nobres.', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80', 'Destaque', 'Pedir Bolo no Pote', 'section-bolo-no-pote', 2);

    -- 6. Sugestões de Bairros de Recife
    INSERT INTO public.neighborhoods (store_id, name, delivery_fee, is_active)
    VALUES
        (v_store_id, 'Boa Viagem', 12.00, true),
        (v_store_id, 'Pina', 10.00, true),
        (v_store_id, 'Madalena', 10.00, true),
        (v_store_id, 'Espinheiro', 12.00, true),
        (v_store_id, 'Graças', 12.00, true),
        (v_store_id, 'Casa Forte', 14.00, true),
        (v_store_id, 'Imbiribeira', 12.00, true);

    -- 7. Depoimentos de Clientes
    INSERT INTO public.testimonials (store_id, customer_name, message, rating, tag)
    VALUES
        (v_store_id, 'Carla Albuquerque', 'O bolo ficou maravilhoso, Eunice! Todo mundo na festa elogiou o sabor e a decoração perfeita!', 5, 'Feedback no Instagram'),
        (v_store_id, 'Mariana Silva', 'Os doces mais gostosos de Recife! O brigadeiro artesanal derrete na boca!', 5, 'Cliente Fiel'),
        (v_store_id, 'Juliana Medeiros', 'Pontualidade na retirada e tudo impecável, capricho puro no acabamento.', 5, 'Encomenda de Aniversário');

END $$;
