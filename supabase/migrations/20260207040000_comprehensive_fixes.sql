-- Migration: Comprehensive System Fixes
-- Includes: Review validation, Admin notifications, RLS fixes

-- ============================================
-- 1. REVIEW PURCHASE VALIDATION
-- ============================================

CREATE OR REPLACE FUNCTION public.has_purchased_product(
    p_user_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        WHERE o.user_id = p_user_id
          AND oi.product_id = p_product_id
          AND o.status NOT IN ('cancelled', 'refunded')
          AND o.payment_status = 'paid'
    );
END;
$$;

COMMENT ON FUNCTION public.has_purchased_product IS 
'Checks if a user has successfully purchased a specific product';

-- ============================================
-- 2. ADMIN SELLER NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_seller_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT DEFAULT 'announcement' CHECK (notification_type IN ('announcement', 'meeting', 'commission_update', 'system', 'warning')),
    target_sellers UUID[], -- If NULL, send to all sellers
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMPTZ, -- If NULL, send immediately
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_notifications_sent ON public.admin_seller_notifications(sent_at);
CREATE INDEX idx_admin_notifications_scheduled ON public.admin_seller_notifications(scheduled_for);

ALTER TABLE public.admin_seller_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notifications
CREATE POLICY "Admins can manage seller notifications"
ON public.admin_seller_notifications
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Function to broadcast notification to sellers
CREATE OR REPLACE FUNCTION public.broadcast_to_sellers(
    p_notification_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification RECORD;
    v_seller RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Get notification details
    SELECT * INTO v_notification
    FROM public.admin_seller_notifications
    WHERE id = p_notification_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Notification not found';
    END IF;

    -- Loop through sellers and create individual notifications
    FOR v_seller IN 
        SELECT s.user_id
        FROM public.sellers s
        WHERE s.is_active = true
          AND (v_notification.target_sellers IS NULL OR s.user_id = ANY(v_notification.target_sellers))
    LOOP
        INSERT INTO public.seller_notifications (
            seller_id,
            title,
            message,
            notification_type
        ) VALUES (
            v_seller.user_id,
            v_notification.title,
            v_notification.message,
            v_notification.notification_type
        );
        v_count := v_count + 1;
    END LOOP;

    -- Mark as sent
    UPDATE public.admin_seller_notifications
    SET sent_at = now()
    WHERE id = p_notification_id;

    RETURN v_count;
END;
$$;

-- ============================================
-- 3. FIX CONVERSATIONS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Recreate with proper logic
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = ANY(participants));

-- ============================================
-- 4. OPTIMIZE PRODUCTS TABLE QUERIES
-- ============================================

-- Add index for featured products
CREATE INDEX IF NOT EXISTS idx_products_featured 
ON public.products(is_featured, is_active) 
WHERE is_featured = true AND is_active = true;

-- Add index for seller products
CREATE INDEX IF NOT EXISTS idx_products_seller_active
ON public.products(seller_id, is_active);

-- ============================================
-- 5. SELLER POINTS MANAGEMENT
-- ============================================

-- Ensure seller_points_history table exists with proper structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'seller_points_history') THEN
        CREATE TABLE public.seller_points_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            points INTEGER NOT NULL,
            point_type TEXT NOT NULL CHECK (point_type IN ('earned', 'purchased', 'spent', 'expired')),
            reason TEXT,
            reference_id UUID, -- Can link to order_id, product_id, etc.
            created_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE INDEX idx_points_history_seller ON public.seller_points_history(seller_id, created_at DESC);
        
        ALTER TABLE public.seller_points_history ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Sellers can view their own point history"
        ON public.seller_points_history
        FOR SELECT
        TO authenticated
        USING (seller_id = auth.uid());
    END IF;
END $$;

-- ============================================
-- 6. ADD MISSING COLUMNS TO SELLERS TABLE
-- ============================================

-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'auto_reply_message') THEN
        ALTER TABLE public.sellers ADD COLUMN auto_reply_message TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'business_hours') THEN
        ALTER TABLE public.sellers ADD COLUMN business_hours JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'notification_preferences') THEN
        ALTER TABLE public.sellers ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'return_policy') THEN
        ALTER TABLE public.sellers ADD COLUMN return_policy TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'tax_office') THEN
        ALTER TABLE public.sellers ADD COLUMN tax_office TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'tax_number') THEN
        ALTER TABLE public.sellers ADD COLUMN tax_number TEXT;
    END IF;
END $$;

-- ============================================
-- 7. CARGO COMPANIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cargo_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    tracking_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert common cargo companies
INSERT INTO public.cargo_companies (name, code, tracking_url, is_active)
VALUES 
    ('MNG Kargo', 'MNG', 'https://www.mngkargo.com.tr/tracking?code={TRACKING_CODE}', true),
    ('Yurtiçi Kargo', 'YURTICI', 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={TRACKING_CODE}', true),
    ('Aras Kargo', 'ARAS', 'https://www.araskargo.com.tr/sorgulama?code={TRACKING_CODE}', true),
    ('PTT Kargo', 'PTT', 'https://gonderitakip.ptt.gov.tr/Track/Verify?code={TRACKING_CODE}', true),
    ('Sürat Kargo', 'SURAT', 'https://www.suratkargo.com.tr/takip?code={TRACKING_CODE}', true),
    ('UPS Kargo', 'UPS', 'https://www.ups.com/track?code={TRACKING_CODE}', true)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.cargo_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cargo companies"
ON public.cargo_companies
FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================
-- 8. UPDATE FUNCTIONS
-- ============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_purchased_product TO authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_to_sellers TO authenticated;
