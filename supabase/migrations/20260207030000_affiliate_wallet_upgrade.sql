-- Migration: Affiliate and Wallet Integration for Orders
-- Update orders table to support referral tracking and wallet discounts
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS wallet_discount DECIMAL(12, 2) DEFAULT 0.00;

-- Update create_order_secure to handle referral and wallet usage
CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_items JSONB,
    p_shipping_address JSONB,
    p_payment_method public.payment_method,
    p_shipping_cost DECIMAL,
    p_notes TEXT DEFAULT NULL,
    p_coupon_code TEXT DEFAULT NULL,
    p_referral_code TEXT DEFAULT NULL,
    p_wallet_amount DECIMAL DEFAULT 0 -- Amount to use from wallet
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_calculated_subtotal DECIMAL := 0;
    v_discount_amount DECIMAL := 0;
    v_item JSONB;
    v_product_row RECORD;
    v_variant_row RECORD;
    v_quantity INTEGER;
    v_price DECIMAL;
    v_seller_id UUID;
    v_commission_rate DECIMAL;
    v_coupon_row RECORD;
    v_seller_map JSONB := '{}'::JSONB;
    v_wallet_balance DECIMAL := 0;
    v_wallet_id UUID;
    v_affiliate_id UUID;
    v_affiliate_commission DECIMAL := 0;
    v_total_amount DECIMAL;
    v_result JSONB;
BEGIN
    -- 1. Wallet Validation
    IF p_wallet_amount > 0 THEN
        SELECT id, balance INTO v_wallet_id, v_wallet_balance FROM public.wallets WHERE user_id = auth.uid();
        IF NOT FOUND OR v_wallet_balance < p_wallet_amount THEN
            RAISE EXCEPTION 'Yetersiz cüzdan bakiyesi';
        END IF;
    END IF;

    -- 2. Coupon Validation
    IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
        SELECT * INTO v_coupon_row FROM public.coupons 
        WHERE code = p_coupon_code AND is_active = true 
        AND (expires_at IS NULL OR expires_at > now())
        AND (starts_at IS NULL OR starts_at <= now());

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Geçersiz veya süresi dolmuş kupon';
        END IF;
    END IF;

    -- 3. Generate Order Number
    v_order_number := 'MDA-' || upper(substring(replace(extract(epoch from now())::text, '.', ''), 1, 8)) || '-' || upper(substring(md5(random()::text), 1, 4));

    -- 4. Calculate Subtotal and Update Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        IF (v_item->'variant'->>'id') IS NOT NULL THEN
            SELECT pv.*, p.price as base_price, p.seller_id, s.commission_rate, p.name as product_name
            INTO v_variant_row
            FROM public.product_variants pv
            JOIN public.products p ON pv.product_id = p.id
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE pv.id = (v_item->'variant'->>'id')::UUID;

            IF v_variant_row.stock < v_quantity THEN 
                RAISE EXCEPTION 'Yetersiz stok: %', v_variant_row.product_name; 
            END IF;
            
            v_price := v_variant_row.base_price + COALESCE(v_variant_row.price_adjustment, 0);
            UPDATE public.product_variants SET stock = stock - v_quantity WHERE id = v_variant_row.id;
        ELSE
            SELECT p.*, s.commission_rate
            INTO v_product_row
            FROM public.products p
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE p.id = (v_item->'product'->>'id')::UUID;

            IF v_product_row.stock < v_quantity THEN 
                RAISE EXCEPTION 'Yetersiz stok: %', v_product_row.name; 
            END IF;

            v_price := COALESCE(v_product_row.sale_price, v_product_row.price);
            UPDATE public.products SET stock = stock - v_quantity WHERE id = v_product_row.id;
        END IF;

        v_calculated_subtotal := v_calculated_subtotal + (v_price * v_quantity);
    END LOOP;

    -- 5. Calculate Discount (Coupon + Wallet)
    IF v_coupon_row.id IS NOT NULL THEN
        IF v_coupon_row.discount_type = 'percentage' THEN
            v_discount_amount := (v_calculated_subtotal * v_coupon_row.discount_value) / 100;
        ELSE
            v_discount_amount := v_coupon_row.discount_value;
        END IF;
        UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon_row.id;
    END IF;

    v_total_amount := v_calculated_subtotal + p_shipping_cost - v_discount_amount - p_wallet_amount;
    IF v_total_amount < 0 THEN v_total_amount := 0; END IF;

    -- 6. Deduct from wallet if used (ATOMIC UPDATE)
    IF p_wallet_amount > 0 THEN
        -- Atomic update with constraint check
        UPDATE public.wallets 
        SET balance = balance - p_wallet_amount,
            updated_at = now()
        WHERE id = v_wallet_id 
          AND balance >= p_wallet_amount  -- Race condition protection
        RETURNING balance INTO v_wallet_balance;

        -- If no row was updated, balance was insufficient (race condition caught)
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Yetersiz cüzdan bakiyesi (bakiye başka bir işlemde kullanıldı)';
        END IF;

        INSERT INTO public.wallet_transactions (wallet_id, amount, transaction_type, description)
        VALUES (v_wallet_id, p_wallet_amount, 'debit', v_order_number || ' nolu sipariş için kullanıldı');
    END IF;

    -- 7. Insert Order
    INSERT INTO public.orders (
        order_number, user_id, status, payment_method, payment_status, 
        subtotal, shipping_cost, total, shipping_address, notes, coupon_code, 
        discount_amount, referral_code, wallet_discount
    ) VALUES (
        v_order_number, auth.uid(), 'pending', p_payment_method, 'pending',
        v_calculated_subtotal, p_shipping_cost, v_total_amount,
        p_shipping_address, p_notes, p_coupon_code, v_discount_amount, 
        p_referral_code, p_wallet_amount
    ) RETURNING id INTO v_order_id;

    -- 8. Affiliate Processing
    IF p_referral_code IS NOT NULL AND p_referral_code <> '' THEN
        SELECT user_id INTO v_affiliate_id FROM public.affiliate_links WHERE code = p_referral_code;
        -- Can't refer 
        IF v_affiliate_id IS NOT NULL AND v_affiliate_id <> auth.uid() THEN
            v_affiliate_commission := (v_calculated_subtotal * 5) / 100; -- 5% Commission
            INSERT INTO public.affiliate_referrals (affiliate_id, referred_user_id, order_id, commission_amount, status)
            VALUES (v_affiliate_id, auth.uid(), v_order_id, v_affiliate_commission, 'pending');
        END IF;
    END IF;

    -- 9. Insert Order Items and Seller Transactions (Same as before)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- ... (Logic for inserting items and transactions remains same, just adjusted for v_order_id)
        -- Redoing the loop for safety in this update
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        IF (v_item->'variant'->>'id') IS NOT NULL THEN
            SELECT p.id as product_id, p.name as product_name, pv.name as variant_name, p.price as base_price, p.seller_id, s.commission_rate, pv.variant_type
            INTO v_variant_row
            FROM public.product_variants pv
            JOIN public.products p ON pv.product_id = p.id
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE pv.id = (v_item->'variant'->>'id')::UUID;
            
            v_price := v_variant_row.base_price + COALESCE(v_variant_row.price_adjustment, 0);
            v_seller_id := v_variant_row.seller_id;
            v_commission_rate := COALESCE(v_variant_row.commission_rate, 0);

            INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price, variant_info)
            VALUES (v_order_id, v_variant_row.product_id, v_variant_row.product_name || ' - ' || v_variant_row.variant_name, 
                    v_quantity, v_price, (v_price * v_quantity), 
                    jsonb_build_object('id', (v_item->'variant'->>'id')::UUID, 'name', v_variant_row.variant_name, 'variant_type', v_variant_row.variant_type));
        ELSE
            SELECT p.id, p.name, p.price, p.sale_price, p.seller_id, s.commission_rate
            INTO v_product_row
            FROM public.products p
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE p.id = (v_item->'product'->>'id')::UUID;

            v_price := COALESCE(v_product_row.sale_price, v_product_row.price);
            v_seller_id := v_product_row.seller_id;
            v_commission_rate := COALESCE(v_product_row.commission_rate, 0);

            INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
            VALUES (v_order_id, v_product_row.id, v_product_row.name, v_quantity, v_price, (v_price * v_quantity));
        END IF;

        IF v_seller_id IS NOT NULL THEN
            INSERT INTO public.seller_transactions (seller_id, order_id, product_id, sale_amount, commission_rate, commission_amount, net_amount, status)
            VALUES (v_seller_id, v_order_id, (v_item->'product'->>'id')::UUID, (v_price * v_quantity), v_commission_rate, 
                    ((v_price * v_quantity) * v_commission_rate / 100),
                    ((v_price * v_quantity) - ((v_price * v_quantity) * v_commission_rate / 100)),
                    'pending');
            v_seller_map := v_seller_map || jsonb_build_object(v_seller_id::text, true);
        END IF;
    END LOOP;

    -- 10. Notifications
    INSERT INTO public.seller_notifications (seller_id, title, message, notification_type, metadata)
    SELECT key::UUID, 'Yeni Sipariş Alındı! 📦', v_order_number || ' numaralı yeni bir siparişiniz var.', 'order', jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number)
    FROM jsonb_each(v_seller_map);
    
    RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total_amount);
END;
$$;
