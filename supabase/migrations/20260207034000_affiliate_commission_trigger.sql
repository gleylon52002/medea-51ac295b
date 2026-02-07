-- Migration: Affiliate Commission Auto-Payment
-- This fixes Issue #3: Affiliate commissions never paid

-- Function to process affiliate commission when order is completed
CREATE OR REPLACE FUNCTION public.pay_affiliate_commission_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral RECORD;
    v_wallet_id UUID;
BEGIN
    -- Only process when order status changes TO 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        
        -- Find pending affiliate referral for this order
        SELECT * INTO v_referral 
        FROM public.affiliate_referrals 
        WHERE order_id = NEW.id 
          AND status = 'pending'
        LIMIT 1;

        IF FOUND THEN
            -- Get or create affiliate's wallet
            SELECT id INTO v_wallet_id 
            FROM public.wallets 
            WHERE user_id = v_referral.affiliate_id;

            IF NOT FOUND THEN
                INSERT INTO public.wallets (user_id, balance)
                VALUES (v_referral.affiliate_id, 0)
                RETURNING id INTO v_wallet_id;
            END IF;

            -- Add commission to wallet
            UPDATE public.wallets
            SET balance = balance + v_referral.commission_amount,
                updated_at = now()
            WHERE id = v_wallet_id;

            -- Record transaction
            INSERT INTO public.wallet_transactions (
                wallet_id, 
                amount, 
                transaction_type, 
                description
            ) VALUES (
                v_wallet_id,
                v_referral.commission_amount,
                'credit',
                'Satış ortaklığı komisyonu - Sipariş: ' || NEW.order_number
            );

            -- Update referral status
            UPDATE public.affiliate_referrals
            SET status = 'completed',
                updated_at = now()
            WHERE id = v_referral.id;

            -- Send notification to affiliate
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type
            ) VALUES (
                v_referral.affiliate_id,
                '💰 Komisyon Kazandınız!',
                v_referral.commission_amount::TEXT || ' TL komisyon cüzdanınıza eklendi. Referans sipariş: ' || NEW.order_number,
                'success'
            );

            RAISE NOTICE 'Affiliate commission paid: % TL to user %', v_referral.commission_amount, v_referral.affiliate_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_pay_affiliate_on_complete ON public.orders;
CREATE TRIGGER trigger_pay_affiliate_on_complete
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.pay_affiliate_commission_on_order_complete();

-- Also handle commission cancellation if order is cancelled/refunded
CREATE OR REPLACE FUNCTION public.cancel_affiliate_commission_on_order_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral RECORD;
    v_wallet_id UUID;
BEGIN
    -- If order was completed but now cancelled/refunded, reverse commission
    IF OLD.status = 'completed' AND NEW.status IN ('cancelled', 'refunded') THEN
        
        -- Find completed referral for this order
        SELECT * INTO v_referral 
        FROM public.affiliate_referrals 
        WHERE order_id = NEW.id 
          AND status = 'completed'
        LIMIT 1;

        IF FOUND THEN
            -- Get affiliate's wallet
            SELECT id INTO v_wallet_id 
            FROM public.wallets 
            WHERE user_id = v_referral.affiliate_id;

            IF FOUND THEN
                -- Deduct commission from wallet
                UPDATE public.wallets
                SET balance = balance - v_referral.commission_amount,
                    updated_at = now()
                WHERE id = v_wallet_id
                  AND balance >= v_referral.commission_amount; -- Safety check

                -- Record reversal transaction
                INSERT INTO public.wallet_transactions (
                    wallet_id, 
                    amount, 
                    transaction_type, 
                    description
                ) VALUES (
                    v_wallet_id,
                    v_referral.commission_amount,
                    'debit',
                    'Komisyon iptali - İptal edilen sipariş: ' || NEW.order_number
                );

                -- Update referral status
                UPDATE public.affiliate_referrals
                SET status = 'cancelled',
                    updated_at = now()
                WHERE id = v_referral.id;

                -- Notify affiliate
                INSERT INTO public.notifications (
                    user_id,
                    title,
                    message,
                    type
                ) VALUES (
                    v_referral.affiliate_id,
                    '⚠️ Komisyon İptal Edildi',
                    'Sipariş iptali nedeniyle ' || v_referral.commission_amount::TEXT || ' TL komisyon cüzdanınızdan düşüldü. Referans sipariş: ' || NEW.order_number,
                    'warning'
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for cancellation
DROP TRIGGER IF EXISTS trigger_cancel_affiliate_on_order_cancel ON public.orders;
CREATE TRIGGER trigger_cancel_affiliate_on_order_cancel
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.cancel_affiliate_commission_on_order_cancel();
