-- Notification logs table for WhatsApp and other channels
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'email',
  recipient TEXT NOT NULL,
  message_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cargo shipments table
CREATE TABLE IF NOT EXISTS public.cargo_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  label_url TEXT,
  shipment_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Warehouses table for multi-warehouse support
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  district TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product warehouse stock table
CREATE TABLE IF NOT EXISTS public.product_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

-- Pricing rules table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'margin',
  applies_to TEXT NOT NULL DEFAULT 'all',
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  product_ids UUID[] DEFAULT '{}',
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  condition_type TEXT,
  condition_value NUMERIC,
  adjustment_type TEXT NOT NULL DEFAULT 'percentage',
  adjustment_value NUMERIC NOT NULL DEFAULT 0,
  min_price NUMERIC,
  max_price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- e-Invoice logs
CREATE TABLE IF NOT EXISTS public.einvoice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einvoice_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins manage notification logs" ON public.notification_logs FOR ALL USING (is_admin());
CREATE POLICY "Admins manage cargo shipments" ON public.cargo_shipments FOR ALL USING (is_admin());
CREATE POLICY "Sellers view own shipments" ON public.cargo_shipments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o JOIN products p ON p.id = ANY(
    SELECT oi.product_id FROM order_items oi WHERE oi.order_id = o.id
  ) WHERE o.id = cargo_shipments.order_id AND p.seller_id = get_seller_id())
);

CREATE POLICY "Admins manage warehouses" ON public.warehouses FOR ALL USING (is_admin());
CREATE POLICY "Sellers manage own warehouses" ON public.warehouses FOR ALL USING (seller_id = get_seller_id());

CREATE POLICY "Admins manage warehouse stock" ON public.product_warehouse_stock FOR ALL USING (is_admin());
CREATE POLICY "Sellers manage own product stock" ON public.product_warehouse_stock FOR ALL USING (
  EXISTS (SELECT 1 FROM products p WHERE p.id = product_warehouse_stock.product_id AND p.seller_id = get_seller_id())
);

CREATE POLICY "Admins manage pricing rules" ON public.pricing_rules FOR ALL USING (is_admin());
CREATE POLICY "Sellers manage own pricing rules" ON public.pricing_rules FOR ALL USING (seller_id = get_seller_id());

CREATE POLICY "Admins manage einvoice logs" ON public.einvoice_logs FOR ALL USING (is_admin());