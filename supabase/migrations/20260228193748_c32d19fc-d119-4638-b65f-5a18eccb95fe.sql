-- Product subscriptions table
CREATE TABLE IF NOT EXISTS product_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  quantity integer NOT NULL DEFAULT 1,
  interval_days integer NOT NULL DEFAULT 30,
  next_delivery_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  total_deliveries integer DEFAULT 0,
  last_order_id uuid REFERENCES orders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their subscriptions" ON product_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON product_subscriptions FOR ALL USING (is_admin());

-- User interaction tracking for AI recommendations
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid NOT NULL REFERENCES products(id),
  interaction_type text NOT NULL DEFAULT 'view',
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert interactions" ON user_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view interactions" ON user_interactions FOR SELECT USING (is_admin());
CREATE POLICY "Users can view own interactions" ON user_interactions FOR SELECT USING (auth.uid() = user_id);