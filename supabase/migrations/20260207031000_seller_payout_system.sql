-- Migration: Seller Payout Requests System
-- Create table for tracking balance withdrawal requests from sellers

CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

CREATE TABLE public.seller_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    status public.payout_status DEFAULT 'pending',
    bank_info JSONB NOT NULL, -- Snapshot of bank name, IBAN, account holder
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_payout_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Sellers can view their own payout requests"
ON public.seller_payout_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.sellers s
        WHERE s.id = seller_payout_requests.seller_id
        AND s.user_id = auth.uid()
    ) OR is_admin()
);

CREATE POLICY "Sellers can create payout requests"
ON public.seller_payout_requests FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sellers s
        WHERE s.id = seller_payout_requests.seller_id
        AND s.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can update payout requests"
ON public.seller_payout_requests FOR UPDATE
USING (is_admin());

-- Trigger for update_at
CREATE TRIGGER update_seller_payout_requests_updated_at 
BEFORE UPDATE ON public.seller_payout_requests 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
