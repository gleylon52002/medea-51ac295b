
-- ==========================================
-- BLOG / CONTENT SYSTEM
-- ==========================================
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  cover_image text,
  product_ids uuid[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING ((is_published = true) OR is_admin());
CREATE POLICY "Admins can manage posts" ON public.blog_posts FOR ALL USING (is_admin());

-- User routines / community feed
CREATE TABLE public.user_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  images text[] DEFAULT '{}',
  product_ids uuid[] DEFAULT '{}',
  likes_count integer NOT NULL DEFAULT 0,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved routines" ON public.user_routines FOR SELECT USING ((is_approved = true) OR (auth.uid() = user_id) OR is_admin());
CREATE POLICY "Users can create routines" ON public.user_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own routines" ON public.user_routines FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage routines" ON public.user_routines FOR ALL USING (is_admin());

-- ==========================================
-- GIFT EXPERIENCE
-- ==========================================
CREATE TABLE public.gift_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid,
  recipient_name text NOT NULL,
  recipient_email text,
  gift_note text,
  box_style text NOT NULL DEFAULT 'classic',
  product_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  gift_link_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  recipient_address jsonb,
  order_id uuid,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gift_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own gifts" ON public.gift_packages FOR ALL USING ((auth.uid() = sender_id) OR is_admin());
CREATE POLICY "Recipients can view by token" ON public.gift_packages FOR SELECT USING (true);
CREATE POLICY "Recipients can update address" ON public.gift_packages FOR UPDATE USING (gift_link_token IS NOT NULL);

-- Birthday reminders
CREATE TABLE public.birthday_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  person_name text NOT NULL,
  birthday date NOT NULL,
  notes text,
  last_notified_at timestamptz,
  last_gift_product_ids uuid[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.birthday_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON public.birthday_reminders FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- GAMIFICATION
-- ==========================================
CREATE TABLE public.badge_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  condition_type text NOT NULL,
  condition_value integer NOT NULL DEFAULT 1,
  points_reward integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badge_definitions FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins can manage badges" ON public.badge_definitions FOR ALL USING (is_admin());

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view badges for leaderboard" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.user_badges FOR ALL USING (is_admin());

-- Daily check-in
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  points_earned integer NOT NULL DEFAULT 5,
  streak_days integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own checkins" ON public.daily_checkins FOR ALL USING (auth.uid() = user_id);

-- Raffles
CREATE TABLE public.raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  prize text NOT NULL,
  min_order_amount numeric NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  winner_user_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active raffles" ON public.raffles FOR SELECT USING ((is_active = true) OR is_admin());
CREATE POLICY "Admins can manage raffles" ON public.raffles FOR ALL USING (is_admin());

CREATE TABLE public.raffle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(raffle_id, user_id)
);
ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON public.raffle_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enter raffles" ON public.raffle_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage entries" ON public.raffle_entries FOR ALL USING (is_admin());

-- ==========================================
-- BULK DISCOUNT RULES
-- ==========================================
CREATE TABLE public.bulk_discount_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'buy_x_pay_y',
  buy_quantity integer NOT NULL DEFAULT 3,
  pay_quantity integer,
  discount_percent numeric,
  product_ids uuid[] DEFAULT '{}',
  category_id uuid REFERENCES public.categories(id),
  applies_to text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_discount_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active rules" ON public.bulk_discount_rules FOR SELECT USING ((is_active = true) OR is_admin());
CREATE POLICY "Admins can manage rules" ON public.bulk_discount_rules FOR ALL USING (is_admin());

-- ==========================================
-- CUSTOM PRODUCT ORDERS (Kişiye Özel Sabun)
-- ==========================================
CREATE TABLE public.custom_product_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seller_id uuid,
  skin_type text NOT NULL,
  scent_preference text,
  ingredient_allergies text,
  additional_notes text,
  status text NOT NULL DEFAULT 'pending',
  price numeric,
  product_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_product_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own orders" ON public.custom_product_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Sellers can view assigned orders" ON public.custom_product_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM sellers WHERE id = custom_product_orders.seller_id AND user_id = auth.uid())
);
CREATE POLICY "Sellers can update assigned orders" ON public.custom_product_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM sellers WHERE id = custom_product_orders.seller_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all" ON public.custom_product_orders FOR ALL USING (is_admin());

-- ==========================================
-- PRODUCT GUIDES (PDF)
-- ==========================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS guide_pdf_url text;

-- Insert default badge definitions
INSERT INTO public.badge_definitions (name, slug, description, icon, condition_type, condition_value, points_reward) VALUES
('İlk Alışveriş', 'ilk-alisveris', 'İlk siparişinizi verdiniz!', 'shopping-bag', 'first_order', 1, 50),
('5 Yorum Yazdı', 'yorum-ustasi', '5 ürün yorumu yazdınız', 'message-square', 'review_count', 5, 100),
('Sadık Müşteri', 'sadik-musteri', '10 veya daha fazla sipariş verdiniz', 'heart', 'order_count', 10, 200),
('Trend Bulucu', 'trend-bulucu', 'Yeni bir ürünü ilk alan siz oldunuz', 'zap', 'early_adopter', 1, 75),
('Topluluk Yıldızı', 'topluluk-yildizi', 'Bakım rutininizi paylaştınız', 'star', 'routine_shared', 1, 50),
('Hediye Sever', 'hediye-sever', 'İlk hediye paketinizi gönderdınız', 'gift', 'gift_sent', 1, 50);
