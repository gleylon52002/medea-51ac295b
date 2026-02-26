-- Loyalty points table for customers
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_spent integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'bronze',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_points_user_id_unique UNIQUE (user_id)
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loyalty points" ON public.loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty points" ON public.loyalty_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty points" ON public.loyalty_points
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all loyalty points" ON public.loyalty_points
  FOR ALL USING (is_admin());

-- Loyalty transactions log
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL, -- 'earn', 'spend', 'bonus', 'expire'
  description text NOT NULL,
  order_id uuid REFERENCES orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loyalty transactions" ON public.loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all loyalty transactions" ON public.loyalty_transactions
  FOR ALL USING (is_admin());

-- Add slug to sellers for store pages
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS banner_url text;

-- Create unique index on seller slug
CREATE UNIQUE INDEX IF NOT EXISTS sellers_slug_unique ON public.sellers(slug) WHERE slug IS NOT NULL;