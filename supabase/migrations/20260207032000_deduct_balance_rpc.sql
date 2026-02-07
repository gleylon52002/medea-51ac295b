-- Migration: Secure Balance Deduction RPC
-- Function to safely deduct seller balance (typically used for payout processing)

CREATE OR REPLACE FUNCTION public.deduct_seller_balance(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check for sufficient balance
    IF NOT EXISTS (
        SELECT 1 FROM public.seller_escrow_balances
        WHERE seller_id = p_seller_id AND available_balance >= p_amount
    ) THEN
        RAISE EXCEPTION 'Yetersiz bakiye';
    END IF;

    -- Update balance
    UPDATE public.seller_escrow_balances
    SET available_balance = available_balance - p_amount,
        updated_at = now()
    WHERE seller_id = p_seller_id;
END;
$$;
