
-- Spin wheel configuration table (admin manages slices)
CREATE TABLE public.spin_wheel_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  cooldown_hours integer NOT NULL DEFAULT 24,
  coupon_prefix text NOT NULL DEFAULT 'CARK',
  coupon_expiry_hours integer NOT NULL DEFAULT 72,
  trigger_type text NOT NULL DEFAULT 'scroll', -- 'scroll', 'exit_intent', 'both'
  trigger_delay_seconds integer NOT NULL DEFAULT 30,
  trigger_scroll_percent integer NOT NULL DEFAULT 50,
  wheel_colors jsonb NOT NULL DEFAULT '["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F"]'::jsonb,
  center_color text NOT NULL DEFAULT '#2d4a3e',
  border_color text NOT NULL DEFAULT '#e0e0e0',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Spin wheel slices (individual prizes)
CREATE TABLE public.spin_wheel_slices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES public.spin_wheel_config(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  prize_type text NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed', 'free_shipping', 'retry'
  discount_value numeric NOT NULL DEFAULT 0,
  min_cart_amount numeric NOT NULL DEFAULT 0,
  probability integer NOT NULL DEFAULT 10, -- weight out of total
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Spin results (tracks user spins, rate limiting, coupon creation)
CREATE TABLE public.spin_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slice_id uuid REFERENCES public.spin_wheel_slices(id) ON DELETE SET NULL,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code text,
  is_winner boolean NOT NULL DEFAULT false,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.spin_wheel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_wheel_slices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_results ENABLE ROW LEVEL SECURITY;

-- Config: admin manages, anyone reads active
CREATE POLICY "Admins manage spin config" ON public.spin_wheel_config FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view active config" ON public.spin_wheel_config FOR SELECT USING (is_active = true OR is_admin());

-- Slices: admin manages, anyone reads
CREATE POLICY "Admins manage spin slices" ON public.spin_wheel_slices FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view active slices" ON public.spin_wheel_slices FOR SELECT USING (is_active = true OR is_admin());

-- Results: admin sees all, users see own
CREATE POLICY "Admins manage spin results" ON public.spin_results FOR ALL USING (is_admin());
CREATE POLICY "Users can view own results" ON public.spin_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert results" ON public.spin_results FOR INSERT WITH CHECK (true);
