
-- User carts table for admin/seller to view what users have in their carts
CREATE TABLE public.user_carts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.sellers(id),
  quantity integer NOT NULL DEFAULT 1,
  variant_id uuid REFERENCES public.product_variants(id),
  variant_info jsonb,
  price_adjustment numeric DEFAULT 0,
  personal_discount numeric DEFAULT 0,
  discount_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cart
CREATE POLICY "Users can manage their own cart" ON public.user_carts FOR ALL USING (auth.uid() = user_id);

-- Admins can view and manage all carts
CREATE POLICY "Admins can manage all carts" ON public.user_carts FOR ALL USING (is_admin());

-- Sellers can view carts containing their products
CREATE POLICY "Sellers can view carts with their products" ON public.user_carts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = user_carts.product_id 
    AND p.seller_id = get_seller_id()
  )
);

-- Sellers can update discount on their products in carts
CREATE POLICY "Sellers can update discounts on their products" ON public.user_carts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = user_carts.product_id 
    AND p.seller_id = get_seller_id()
  )
);

-- Seller point packages table
CREATE TABLE public.seller_point_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  points integer NOT NULL,
  price numeric NOT NULL,
  bonus_points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_point_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active point packages" ON public.seller_point_packages FOR SELECT USING (is_active = true OR is_admin());

-- Admins can manage packages
CREATE POLICY "Admins can manage point packages" ON public.seller_point_packages FOR ALL USING (is_admin());

-- Insert default point packages
INSERT INTO public.seller_point_packages (name, points, price, bonus_points, sort_order) VALUES
  ('Başlangıç', 100, 49.90, 0, 1),
  ('Standart', 250, 99.90, 25, 2),
  ('Premium', 500, 179.90, 75, 3),
  ('Profesyonel', 1000, 299.90, 200, 4);
