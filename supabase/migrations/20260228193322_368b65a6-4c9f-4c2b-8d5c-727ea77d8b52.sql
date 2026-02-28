
-- Update create_order_secure to support guest checkout (allow null user_id)
CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_items jsonb, 
  p_shipping_address jsonb, 
  p_payment_method payment_method, 
  p_shipping_cost numeric, 
  p_notes text DEFAULT NULL, 
  p_coupon_code text DEFAULT NULL, 
  p_referral_code text DEFAULT NULL, 
  p_wallet_amount numeric DEFAULT 0,
  p_guest_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_discount_amount numeric := 0;
  v_item jsonb;
  v_product record;
  v_item_price numeric;
  v_item_total numeric;
  v_variant record;
  v_wallet record;
  v_coupon record;
  v_order_item_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Allow guest checkout: if no auth and guest email provided, proceed with null user_id
  IF v_user_id IS NULL AND p_guest_email IS NULL THEN
    RAISE EXCEPTION 'Authentication or guest email required';
  END IF;

  v_order_number := 'MDA-' || upper(to_hex(extract(epoch from now())::bigint)) || '-' || upper(substr(md5(random()::text), 1, 4));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_price := 0;
    
    SELECT * INTO v_product FROM products 
    WHERE id = (v_item->'product'->>'id')::uuid AND is_active = true;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or inactive: %', v_item->'product'->>'id';
    END IF;

    IF v_product.stock < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
    END IF;

    v_item_price := COALESCE(v_product.sale_price, v_product.price);
    
    IF v_item->'variant' IS NOT NULL AND v_item->'variant'->>'id' IS NOT NULL THEN
      SELECT * INTO v_variant FROM product_variants 
      WHERE id = (v_item->'variant'->>'id')::uuid;
      IF FOUND THEN
        v_item_price := v_item_price + COALESCE(v_variant.price_adjustment, 0);
      END IF;
    END IF;

    v_item_total := v_item_price * (v_item->>'quantity')::int;
    v_subtotal := v_subtotal + v_item_total;
  END LOOP;

  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons 
    WHERE code = p_coupon_code AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR used_count < max_uses);
    
    IF FOUND THEN
      IF v_coupon.discount_type = 'percentage' THEN
        v_discount_amount := v_subtotal * v_coupon.discount_value / 100;
      ELSE
        v_discount_amount := v_coupon.discount_value;
      END IF;
    END IF;
  END IF;

  -- Only allow wallet usage for authenticated users
  IF v_user_id IS NOT NULL THEN
    v_discount_amount := v_discount_amount + COALESCE(p_wallet_amount, 0);
  END IF;
  
  v_total := GREATEST(0, v_subtotal - v_discount_amount + p_shipping_cost);

  INSERT INTO orders (
    id, user_id, order_number, status, payment_method, payment_status,
    subtotal, shipping_cost, discount_amount, total, 
    shipping_address, notes, coupon_code
  ) VALUES (
    gen_random_uuid(), v_user_id, v_order_number, 'pending', p_payment_method, 'pending',
    v_subtotal, p_shipping_cost, v_discount_amount, v_total,
    p_shipping_address, p_notes, p_coupon_code
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->'product'->>'id')::uuid;
    
    v_item_price := COALESCE(v_product.sale_price, v_product.price);
    
    IF v_item->'variant' IS NOT NULL AND v_item->'variant'->>'id' IS NOT NULL THEN
      SELECT * INTO v_variant FROM product_variants WHERE id = (v_item->'variant'->>'id')::uuid;
      IF FOUND THEN
        v_item_price := v_item_price + COALESCE(v_variant.price_adjustment, 0);
      END IF;
    END IF;

    v_item_total := v_item_price * (v_item->>'quantity')::int;

    INSERT INTO order_items (
      order_id, product_id, product_name, product_image,
      quantity, unit_price, total_price, variant_id, variant_info
    ) VALUES (
      v_order_id, 
      (v_item->'product'->>'id')::uuid,
      v_item->'product'->>'name',
      v_item->'product'->'images'->>0,
      (v_item->>'quantity')::int,
      v_item_price,
      v_item_total,
      CASE WHEN v_item->'variant'->>'id' IS NOT NULL THEN (v_item->'variant'->>'id')::uuid ELSE NULL END,
      v_item->'variant'
    ) RETURNING id INTO v_order_item_id;

    UPDATE products SET stock = stock - (v_item->>'quantity')::int 
    WHERE id = (v_item->'product'->>'id')::uuid;

    IF v_item->'variant' IS NOT NULL AND v_item->'variant'->>'id' IS NOT NULL THEN
      UPDATE product_variants SET stock = stock - (v_item->>'quantity')::int 
      WHERE id = (v_item->'variant'->>'id')::uuid;
    END IF;

    IF v_product.seller_id IS NOT NULL THEN
      DECLARE
        v_seller record;
      BEGIN
        SELECT * INTO v_seller FROM sellers WHERE id = v_product.seller_id;
        IF FOUND THEN
          INSERT INTO seller_transactions (
            seller_id, order_id, order_item_id, product_id,
            sale_amount, commission_rate, commission_amount, net_amount, status
          ) VALUES (
            v_seller.id, v_order_id, v_order_item_id,
            v_product.id, v_item_total, v_seller.commission_rate,
            v_item_total * v_seller.commission_rate / 100,
            v_item_total - (v_item_total * v_seller.commission_rate / 100),
            'pending'
          );
        END IF;
      END;
    END IF;
  END LOOP;

  -- Wallet operations only for authenticated users
  IF v_user_id IS NOT NULL AND p_wallet_amount > 0 THEN
    UPDATE wallets SET balance = balance - p_wallet_amount, updated_at = now()
    WHERE user_id = v_user_id AND balance >= p_wallet_amount;
    
    IF FOUND THEN
      INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, description, order_id)
      SELECT w.id, p_wallet_amount, 'debit', 'Sipariş ödemesi: ' || v_order_number, v_order_id
      FROM wallets w WHERE w.user_id = v_user_id;
    END IF;
  END IF;

  -- Referral operations only for authenticated users  
  IF v_user_id IS NOT NULL AND p_referral_code IS NOT NULL THEN
    DECLARE
      v_referrer_link record;
    BEGIN
      SELECT al.* INTO v_referrer_link FROM affiliate_links al WHERE al.code = p_referral_code;
      IF FOUND AND v_referrer_link.user_id != v_user_id THEN
        INSERT INTO wallets (user_id, balance) VALUES (v_referrer_link.user_id, v_subtotal * 0.05)
        ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + v_subtotal * 0.05, updated_at = now();
        
        INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, description, order_id)
        SELECT w.id, v_subtotal * 0.05, 'credit', 'Referans komisyonu', v_order_id
        FROM wallets w WHERE w.user_id = v_referrer_link.user_id;
      END IF;
    END;
  END IF;

  -- Clear cart only for authenticated users
  IF v_user_id IS NOT NULL THEN
    DELETE FROM user_carts WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
END;
$function$;

-- Allow anonymous users to insert orders (for guest checkout)
CREATE POLICY "Guest users can create orders" ON orders
  FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Allow guest users to view their orders by order number (handled via RPC)
-- No additional SELECT policy needed since guest orders are accessed via order number

-- Create seller_sla table for SLA commitments
CREATE TABLE IF NOT EXISTS public.seller_sla (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  max_shipping_days integer NOT NULL DEFAULT 3,
  max_response_hours integer NOT NULL DEFAULT 24,
  shipping_violations integer NOT NULL DEFAULT 0,
  response_violations integer NOT NULL DEFAULT 0,
  last_violation_at timestamptz,
  penalty_applied numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

ALTER TABLE public.seller_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage SLA" ON seller_sla FOR ALL USING (is_admin());
CREATE POLICY "Sellers can view their SLA" ON seller_sla FOR SELECT USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = seller_sla.seller_id AND sellers.user_id = auth.uid())
);
CREATE POLICY "Anyone can view SLA" ON seller_sla FOR SELECT USING (true);

-- Create checkout_events table for conversion funnel
CREATE TABLE IF NOT EXISTS public.checkout_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text,
  user_id uuid,
  step text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert checkout events" ON checkout_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view checkout events" ON checkout_events FOR SELECT USING (is_admin());
