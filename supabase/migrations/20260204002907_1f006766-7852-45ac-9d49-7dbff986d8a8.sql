-- Create variant types enum
CREATE TYPE public.variant_type AS ENUM ('color', 'weight', 'scent');

-- Create product_variants table for variant definitions
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type variant_type NOT NULL,
  name TEXT NOT NULL, -- e.g., "Kırmızı", "100g", "Lavanta"
  value TEXT NOT NULL, -- actual value for filtering/grouping
  color_code TEXT, -- hex color for color variants
  price_adjustment NUMERIC DEFAULT 0, -- price difference (+/- from base price)
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  sku TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_type ON public.product_variants(variant_type);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active variants" ON public.product_variants
  FOR SELECT USING ((is_active = true) OR is_admin());

CREATE POLICY "Admins can manage variants" ON public.product_variants
  FOR ALL USING (is_admin());

-- Create related_products table
CREATE TABLE public.related_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'related', -- 'related', 'complementary', 'upsell'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

CREATE INDEX idx_related_products_product_id ON public.related_products(product_id);

ALTER TABLE public.related_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view related products" ON public.related_products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage related products" ON public.related_products
  FOR ALL USING (is_admin());

-- Create product_comparisons table for user comparison lists
CREATE TABLE public.product_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- for non-logged in users
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_product_comparisons_user ON public.product_comparisons(user_id);
CREATE INDEX idx_product_comparisons_session ON public.product_comparisons(session_id);

ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their comparisons" ON public.product_comparisons
  FOR ALL USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  billing_info JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = invoices.order_id AND orders.user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (is_admin());

-- Create email_logs table for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL, -- 'order_confirmation', 'status_update', 'shipping', etc.
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  order_id UUID REFERENCES public.orders(id),
  metadata JSONB,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_email_logs_order_id ON public.email_logs(order_id);
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email logs" ON public.email_logs
  FOR ALL USING (is_admin());

CREATE POLICY "Users can view their email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Add variant support to order_items
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id),
  ADD COLUMN IF NOT EXISTS variant_info JSONB;

-- Trigger for updated_at on product_variants
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();