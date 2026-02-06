-- Migration: Professional Features Pack
-- Modules: Messaging, Affiliate, Escrow, Audit Logging, Fraud Detection

-- 1. MESSAGING SYSTEM
CREATE TYPE public.conversation_context AS ENUM ('direct', 'order', 'product_qa', 'complaint');
CREATE TYPE public.attachment_type AS ENUM ('image', 'document', 'other');

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participants UUID[] NOT NULL, -- Array of user IDs
    context_type public.conversation_context DEFAULT 'direct',
    context_id UUID, -- Reference to order_id or product_id
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type public.attachment_type NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. AFFILIATE & WALLET SYSTEM
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'TL',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    code TEXT NOT NULL UNIQUE,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES auth.users(id),
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    order_id UUID REFERENCES public.orders(id),
    commission_amount DECIMAL(10, 2),
    status TEXT DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type TEXT NOT NULL, -- 'credit', 'debit'
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. ESCROW & SELLER FINANCE
CREATE TYPE public.payout_frequency AS ENUM ('weekly', 'monthly');

CREATE TABLE public.seller_escrow_balances (
    seller_id UUID PRIMARY KEY REFERENCES public.sellers(id),
    pending_balance DECIMAL(12, 2) DEFAULT 0.00,
    available_balance DECIMAL(12, 2) DEFAULT 0.00,
    payout_frequency public.payout_frequency DEFAULT 'weekly',
    next_payout_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. AUDIT LOGGING & FRAUD DETECTION
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    target_table TEXT,
    target_id UUID,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES public.orders(id),
    alert_type TEXT NOT NULL, -- 'multi_return', 'fake_order', 'ip_mismatch'
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    details JSONB,
    status TEXT DEFAULT 'open', -- open, investigating, resolved, false_positive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS POLICIES (Simplified for now, will refine during implementation)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = ANY(participants) OR is_admin());

CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (auth.uid() = ANY(participants) OR is_admin())
));

CREATE POLICY "Users can manage their own wallets" 
ON public.wallets FOR SELECT 
USING (auth.uid() = user_id OR is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
