-- Migration: Atomic Balance Locking for Payout Requests
-- This fixes Issue #1: Double Deduction Risk

-- Function to atomically lock balance when payout request is created
CREATE OR REPLACE FUNCTION public.lock_seller_balance_for_payout(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_available DECIMAL;
BEGIN
    -- Atomically check and update balance
    UPDATE public.seller_escrow_balances
    SET 
        available_balance = available_balance - p_amount,
        pending_balance = pending_balance + p_amount,
        updated_at = now()
    WHERE seller_id = p_seller_id
      AND available_balance >= p_amount  -- Atomic constraint
    RETURNING available_balance INTO v_current_available;

    -- If no row was updated, balance was insufficient
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Yetersiz kullanılabilir bakiye. Lütfen mevcut ödeme taleplerini kontrol edin.';
    END IF;

    RETURN TRUE;
END;
$$;

-- Function to unlock balance if payout request creation fails
CREATE OR REPLACE FUNCTION public.unlock_seller_balance(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.seller_escrow_balances
    SET 
        available_balance = available_balance + p_amount,
        pending_balance = pending_balance - p_amount,
        updated_at = now()
    WHERE seller_id = p_seller_id;

    RETURN TRUE;
END;
$$;

-- Update deduct_seller_balance to handle payout completion
-- This is called when admin marks payout as 'paid'
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
    -- Deduct from pending (not available, since it's already locked)
    UPDATE public.seller_escrow_balances
    SET 
        pending_balance = pending_balance - p_amount,
        updated_at = now()
    WHERE seller_id = p_seller_id
      AND pending_balance >= p_amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Yetersiz kilitli bakiye. Payout request durumunu kontrol edin.';
    END IF;
END;
$$;

-- Function to reject payout and unlock balance
CREATE OR REPLACE FUNCTION public.reject_payout_and_unlock(
    p_seller_id UUID,
    p_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return pending balance to available
    UPDATE public.seller_escrow_balances
    SET 
        available_balance = available_balance + p_amount,
        pending_balance = pending_balance - p_amount,
        updated_at = now()
    WHERE seller_id = p_seller_id;
END;
$$;
