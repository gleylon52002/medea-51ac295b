-- 1. Create seller_applications table for vendor applications
CREATE TABLE public.seller_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    tax_number TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    description TEXT,
    category_focus TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Create sellers table for approved vendors
CREATE TABLE public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    application_id UUID,
    company_name TEXT NOT NULL,
    tax_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    commission_rate NUMERIC NOT NULL DEFAULT 15.00,
    reputation_points INTEGER NOT NULL DEFAULT 100,
    penalty_points INTEGER NOT NULL DEFAULT 0,
    total_sales NUMERIC NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    suspended_reason TEXT,
    suspended_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key after both tables exist
ALTER TABLE public.sellers 
ADD CONSTRAINT sellers_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.seller_applications(id);

-- 3. Create seller_points_history for tracking point changes
CREATE TABLE public.seller_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    point_type TEXT NOT NULL CHECK (point_type IN ('reputation', 'penalty', 'purchased', 'refund')),
    reason TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    review_id UUID REFERENCES public.reviews(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create seller_notifications table
CREATE TABLE public.seller_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('points', 'order', 'review', 'system', 'warning', 'suspension')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create seller_settings for global configuration
CREATE TABLE public.seller_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create seller_transactions for sales and commission tracking
CREATE TABLE public.seller_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id),
    order_item_id UUID REFERENCES public.order_items(id),
    product_id UUID REFERENCES public.products(id),
    sale_amount NUMERIC NOT NULL,
    commission_rate NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    net_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Add seller_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id);

-- 8. Create is_seller function
CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.sellers 
        WHERE user_id = auth.uid() AND status = 'active'
    )
$$;

-- 9. Create function to get current user's seller_id
CREATE OR REPLACE FUNCTION public.get_seller_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.sellers WHERE user_id = auth.uid() AND status = 'active' LIMIT 1
$$;

-- 10. Enable RLS on all new tables
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_transactions ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for seller_applications
CREATE POLICY "Users can view their own applications"
ON public.seller_applications FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own application"
ON public.seller_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending application"
ON public.seller_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all applications"
ON public.seller_applications FOR ALL
USING (is_admin());

-- 12. RLS Policies for sellers
CREATE POLICY "Sellers can view their own seller profile"
ON public.sellers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active sellers"
ON public.sellers FOR SELECT
USING (status = 'active');

CREATE POLICY "Sellers can update their own profile"
ON public.sellers FOR UPDATE
USING (auth.uid() = user_id AND status = 'active');

CREATE POLICY "Admins can manage all sellers"
ON public.sellers FOR ALL
USING (is_admin());

-- 13. RLS Policies for seller_points_history
CREATE POLICY "Sellers can view their own points history"
ON public.seller_points_history FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
) OR is_admin());

CREATE POLICY "Admins can manage points history"
ON public.seller_points_history FOR ALL
USING (is_admin());

-- 14. RLS Policies for seller_notifications
CREATE POLICY "Sellers can view their own notifications"
ON public.seller_notifications FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
));

CREATE POLICY "Sellers can update their own notifications"
ON public.seller_notifications FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage all notifications"
ON public.seller_notifications FOR ALL
USING (is_admin());

-- 15. RLS Policies for seller_settings
CREATE POLICY "Anyone can view seller settings"
ON public.seller_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage seller settings"
ON public.seller_settings FOR ALL
USING (is_admin());

-- 16. RLS Policies for seller_transactions
CREATE POLICY "Sellers can view their own transactions"
ON public.seller_transactions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
) OR is_admin());

CREATE POLICY "Admins can manage all transactions"
ON public.seller_transactions FOR ALL
USING (is_admin());

-- 17. Update products RLS for sellers
CREATE POLICY "Sellers can manage their own products"
ON public.products FOR ALL
USING (
    seller_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid() AND status = 'active')
);

-- 18. Add updated_at triggers
CREATE TRIGGER update_seller_applications_updated_at
BEFORE UPDATE ON public.seller_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_settings_updated_at
BEFORE UPDATE ON public.seller_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 19. Insert default seller settings
INSERT INTO public.seller_settings (key, value, description) VALUES
('default_commission_rate', '15', 'Default commission rate for new sellers (%)'),
('min_reputation_for_feature', '200', 'Minimum reputation points to feature products'),
('reputation_per_sale', '5', 'Reputation points earned per successful sale'),
('reputation_per_5star', '10', 'Reputation points earned per 5-star review'),
('reputation_per_4star', '5', 'Reputation points earned per 4-star review'),
('penalty_per_cancel', '15', 'Penalty points for order cancellation'),
('penalty_per_complaint', '25', 'Penalty points for verified complaint'),
('penalty_per_1star', '10', 'Penalty points for 1-star review'),
('penalty_per_2star', '5', 'Penalty points for 2-star review'),
('suspension_threshold', '50', 'Penalty points threshold for automatic suspension'),
('ban_threshold', '100', 'Penalty points threshold for permanent ban'),
('reputation_point_price', '5', 'Price in TL for purchasing 1 reputation point'),
('feature_cost_per_day', '10', 'Reputation points cost to feature product for 1 day');