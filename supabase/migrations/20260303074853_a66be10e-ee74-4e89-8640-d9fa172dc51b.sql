
-- Product sustainability tags (vegan, natural, plastic-free, etc.)
CREATE TABLE public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag text NOT NULL,
  is_auto boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_tags_product ON public.product_tags(product_id);
CREATE INDEX idx_product_tags_tag ON public.product_tags(tag);
CREATE UNIQUE INDEX idx_product_tags_unique ON public.product_tags(product_id, tag);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product tags" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage product tags" ON public.product_tags FOR ALL USING (is_admin());
CREATE POLICY "Sellers can manage their product tags" ON public.product_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM products p JOIN sellers s ON s.id = p.seller_id WHERE p.id = product_tags.product_id AND s.user_id = auth.uid())
);

-- Seller certificates (organic, handmade, etc.)
CREATE TABLE public.seller_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  certificate_type text NOT NULL DEFAULT 'other',
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved certificates" ON public.seller_certificates FOR SELECT USING ((status = 'approved') OR is_admin());
CREATE POLICY "Admins can manage all certificates" ON public.seller_certificates FOR ALL USING (is_admin());
CREATE POLICY "Sellers can manage their own certificates" ON public.seller_certificates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM sellers WHERE id = seller_certificates.seller_id AND user_id = auth.uid())
);
CREATE POLICY "Sellers can view their own certificates" ON public.seller_certificates FOR SELECT USING (
  EXISTS (SELECT 1 FROM sellers WHERE id = seller_certificates.seller_id AND user_id = auth.uid())
);

-- Add sustainability_score to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sustainability_score integer DEFAULT 0;

-- Chat conversations for AI consultant
CREATE TABLE public.ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_type text NOT NULL DEFAULT 'skin_consultant',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions" ON public.ai_chat_sessions FOR ALL USING (
  (user_id = auth.uid()) OR (user_id IS NULL)
);
CREATE POLICY "Anyone can create sessions" ON public.ai_chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all sessions" ON public.ai_chat_sessions FOR SELECT USING (is_admin());
