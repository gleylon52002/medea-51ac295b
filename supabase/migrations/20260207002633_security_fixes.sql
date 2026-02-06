-- Migration: Secure Orders and Reviews
-- Description: Fixes seller visibility of order addresses and restricts reviews to verified purchases.

-- 1. Orders RLS for sellers
-- Allow sellers to view orders that contain their products (including shipping address)
DROP POLICY IF EXISTS "Sellers can view orders containing their products" ON public.orders;
CREATE POLICY "Sellers can view orders containing their products"
ON public.orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.seller_transactions st
        JOIN public.sellers s ON st.seller_id = s.id
        WHERE st.order_id = public.orders.id
        AND s.user_id = auth.uid()
    ) OR is_admin()
);

-- 2. Reviews Security Enhancement
-- Restrict review creation to users who actually purchased the product and it was delivered
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews for delivered orders"
ON public.reviews FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.user_id = auth.uid()
        AND oi.product_id = reviews.product_id
        AND o.status = 'delivered'
    )
);

-- 3. Seller Settings Security Fix
-- Restrict viewing seller settings to admins and active sellers
DROP POLICY IF EXISTS "Anyone can view seller settings" ON public.seller_settings;
CREATE POLICY "Admins and sellers can view seller settings"
ON public.seller_settings FOR SELECT
USING (is_admin() OR is_seller());

-- 5. Atomic and Secure Order Creation RPC
-- This ensures stock is deducted correctly and price manipulation is prevented
-- 5. Atomic and Secure Order Creation RPC
-- This handles the entire checkout process safely on the server
CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_items JSONB,
    p_shipping_address JSONB,
    p_payment_method public.payment_method,
    p_shipping_cost DECIMAL,
    p_notes TEXT DEFAULT NULL,
    p_coupon_code TEXT DEFAULT NULL
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
    v_seller_map JSONB := '{}'::JSONB; -- To keep track of unique sellers for notifications
BEGIN
    -- 1. Coupon Validation (If provided)
    IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
        SELECT * INTO v_coupon_row FROM public.coupons 
        WHERE code = p_coupon_code AND is_active = true 
        AND (expires_at IS NULL OR expires_at > now())
        AND (starts_at IS NULL OR starts_at <= now());

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Geçersiz veya süresi dolmuş kupon';
        END IF;

        IF v_coupon_row.max_uses IS NOT NULL AND v_coupon_row.used_count >= v_coupon_row.max_uses THEN
            RAISE EXCEPTION 'Kupon kullanım limiti dolmuş';
        END IF;
    END IF;

    -- 2. Generate Order Number
    v_order_number := 'MDA-' || upper(substring(replace(extract(epoch from now())::text, '.', ''), 1, 8)) || '-' || upper(substring(md5(random()::text), 1, 4));

    -- 3. Calculate Subtotal and Update Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        IF (v_item->'variant'->>'id') IS NOT NULL THEN
            -- Handle Variant
            SELECT pv.*, p.price as base_price, p.seller_id, s.commission_rate, p.name as product_name
            INTO v_variant_row
            FROM public.product_variants pv
            JOIN public.products p ON pv.product_id = p.id
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE pv.id = (v_item->'variant'->>'id')::UUID;

            IF NOT FOUND THEN RAISE EXCEPTION 'Variant not found'; END IF;
            IF v_variant_row.stock < v_quantity THEN 
                RAISE EXCEPTION 'Yetersiz stok: % için sadece % adet mevcut', v_variant_row.product_name || ' - ' || v_variant_row.name, v_variant_row.stock; 
            END IF;
            
            v_price := v_variant_row.base_price + COALESCE(v_variant_row.price_adjustment, 0);
            
            -- Deduct Stock
            UPDATE public.product_variants SET stock = stock - v_quantity WHERE id = v_variant_row.id;
        ELSE
            -- Handle Product
            SELECT p.*, s.commission_rate
            INTO v_product_row
            FROM public.products p
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE p.id = (v_item->'product'->>'id')::UUID;

            IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
            IF v_product_row.stock < v_quantity THEN 
                RAISE EXCEPTION 'Yetersiz stok: % için sadece % adet mevcut', v_product_row.name, v_product_row.stock; 
            END IF;

            v_price := COALESCE(v_product_row.sale_price, v_product_row.price);

            -- Deduct Stock
            UPDATE public.products SET stock = stock - v_quantity WHERE id = v_product_row.id;
        END IF;

        v_calculated_subtotal := v_calculated_subtotal + (v_price * v_quantity);
    END LOOP;

    -- 4. Re-validate Coupon against Subtotal and Calculate Discount
    IF v_coupon_row.id IS NOT NULL THEN
        IF v_calculated_subtotal < v_coupon_row.minimum_order_amount THEN
            RAISE EXCEPTION 'Minimum sepet tutarı (%) karşılanmıyor', v_coupon_row.minimum_order_amount;
        END IF;

        IF v_coupon_row.discount_type = 'percentage' THEN
            v_discount_amount := (v_calculated_subtotal * v_coupon_row.discount_value) / 100;
        ELSE
            v_discount_amount := v_coupon_row.discount_value;
        END IF;

        -- Update Coupon Used Count
        UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon_row.id;
    END IF;

    -- 5. Insert Order
    INSERT INTO public.orders (
        order_number, user_id, status, payment_method, payment_status, 
        subtotal, shipping_cost, total, shipping_address, notes, coupon_code, discount_amount
    ) VALUES (
        v_order_number, auth.uid(), 'pending', p_payment_method, 'pending',
        v_calculated_subtotal, p_shipping_cost, (v_calculated_subtotal + p_shipping_cost - v_discount_amount),
        p_shipping_address, p_notes, p_coupon_code, v_discount_amount
    ) RETURNING id INTO v_order_id;

    -- 6. Insert Order Items and Seller Transactions
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        IF (v_item->'variant'->>'id') IS NOT NULL THEN
            SELECT pv.*, p.price as base_price, p.seller_id, s.commission_rate, p.name as product_name, pv.variant_type
            INTO v_variant_row
            FROM public.product_variants pv
            JOIN public.products p ON pv.product_id = p.id
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE pv.id = (v_item->'variant'->>'id')::UUID;
            
            v_price := v_variant_row.base_price + COALESCE(v_variant_row.price_adjustment, 0);
            v_seller_id := v_variant_row.seller_id;
            v_commission_rate := COALESCE(v_variant_row.commission_rate, 0);

            INSERT INTO public.order_items (
                order_id, product_id, product_name, quantity, unit_price, total_price, variant_info
            ) VALUES (
                v_order_id, v_variant_row.product_id, v_variant_row.product_name || ' - ' || v_variant_row.name, 
                v_quantity, v_price, (v_price * v_quantity), 
                jsonb_build_object('id', v_variant_row.id, 'name', v_variant_row.name, 'variant_type', v_variant_row.variant_type)
            ) RETURNING id INTO v_result; -- using v_result temporary to get order_item_id
        ELSE
            SELECT p.*, s.commission_rate
            INTO v_product_row
            FROM public.products p
            LEFT JOIN public.sellers s ON p.seller_id = s.id
            WHERE p.id = (v_item->'product'->>'id')::UUID;

            v_price := COALESCE(v_product_row.sale_price, v_product_row.price);
            v_seller_id := v_product_row.seller_id;
            v_commission_rate := COALESCE(v_product_row.commission_rate, 0);

            INSERT INTO public.order_items (
                order_id, product_id, product_name, quantity, unit_price, total_price
            ) VALUES (
                v_order_id, v_product_row.id, v_product_row.name, v_quantity, v_price, (v_price * v_quantity)
            ) RETURNING id INTO v_result;
        END IF;

        -- Create Transaction if seller exists
        IF v_seller_id IS NOT NULL THEN
            INSERT INTO public.seller_transactions (
                seller_id, order_id, order_item_id, product_id, 
                sale_amount, commission_rate, commission_amount, net_amount, status
            ) VALUES (
                v_seller_id, v_order_id, (v_result->>'id')::UUID, (v_item->'product'->>'id')::UUID,
                (v_price * v_quantity), v_commission_rate, 
                ((v_price * v_quantity) * v_commission_rate / 100),
                ((v_price * v_quantity) - ((v_price * v_quantity) * v_commission_rate / 100)),
                'pending'
            );

            -- Collect unique seller IDs for notifications
            v_seller_map := v_seller_map || jsonb_build_object(v_seller_id::text, true);
        END IF;
    END LOOP;

    -- 7. Create Seller Notifications
    INSERT INTO public.seller_notifications (seller_id, title, message, notification_type, metadata)
    SELECT 
        key::UUID, 
        'Yeni Sipariş Alındı! 📦', 
        v_order_number || ' numaralı yeni bir siparişiniz var.', 
        'order', 
        jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number)
    FROM jsonb_each(v_seller_map);
    
    RETURN jsonb_build_object(
        'id', v_order_id, 
        'order_number', v_order_number, 
        'total', (v_calculated_subtotal + p_shipping_cost - v_discount_amount)
    );
END;
$$;

-- 6. Low Stock Notification Trigger
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= 5 AND OLD.stock > 5 THEN
        -- Notify seller (for products) or product's seller (for variants)
        IF TG_TABLE_NAME = 'products' AND NEW.seller_id IS NOT NULL THEN
            INSERT INTO public.seller_notifications (seller_id, title, message, notification_type)
            VALUES (NEW.seller_id, '⚠️ Düşük Stok Uyarısı', NEW.name || ' ürününüzün stoğu kritik seviyeye (5) düştü.', 'warning');
        ELSIF TG_TABLE_NAME = 'product_variants' THEN
            -- Find seller for variant
            DECLARE
                v_seller_id UUID;
                v_product_name TEXT;
            BEGIN
                SELECT seller_id, name INTO v_seller_id, v_product_name FROM public.products WHERE id = NEW.product_id;
                IF v_seller_id IS NOT NULL THEN
                    INSERT INTO public.seller_notifications (seller_id, title, message, notification_type)
                    VALUES (v_seller_id, '⚠️ Düşük Stok Uyarısı (Varyant)', v_product_name || ' - ' || NEW.name || ' varyantının stoğu kritik seviyeye (5) düştü.', 'warning');
                END IF;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_low_stock_product
AFTER UPDATE OF stock ON public.products
FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

CREATE TRIGGER trigger_check_low_stock_variant
AFTER UPDATE OF stock ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();
