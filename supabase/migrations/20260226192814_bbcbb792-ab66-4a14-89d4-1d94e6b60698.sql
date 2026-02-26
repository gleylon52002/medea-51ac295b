
-- =====================================================
-- 1. CONVERSATIONS & MESSAGES (for messaging system)
-- =====================================================
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participants UUID[] NOT NULL,
    context_type TEXT NOT NULL DEFAULT 'direct',
    context_id TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
    ON public.conversations FOR SELECT TO authenticated
    USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update their conversations"
    ON public.conversations FOR UPDATE TO authenticated
    USING (auth.uid() = ANY(participants));

CREATE POLICY "Admins can manage all conversations"
    ON public.conversations FOR ALL TO authenticated
    USING (public.is_admin());

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
    ON public.messages FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.conversations
        WHERE conversations.id = messages.conversation_id
        AND auth.uid() = ANY(conversations.participants)
    ));

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND auth.uid() = ANY(conversations.participants)
        )
    );

CREATE POLICY "Admins can manage all messages"
    ON public.messages FOR ALL TO authenticated
    USING (public.is_admin());

CREATE TABLE public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'other',
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view attachments"
    ON public.message_attachments FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON c.id = m.conversation_id
        WHERE m.id = message_attachments.message_id
        AND auth.uid() = ANY(c.participants)
    ));

CREATE POLICY "Users can insert attachments"
    ON public.message_attachments FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_attachments.message_id
        AND m.sender_id = auth.uid()
    ));

-- =====================================================
-- 2. PRODUCT QUESTIONS (for seller Q&A)
-- =====================================================
CREATE TABLE public.product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    question TEXT NOT NULL,
    answer TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public questions"
    ON public.product_questions FOR SELECT
    USING (is_public = true OR auth.uid() = user_id OR public.is_admin() OR public.is_seller());

CREATE POLICY "Authenticated users can ask questions"
    ON public.product_questions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can answer questions on their products"
    ON public.product_questions FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.sellers s ON s.id = p.seller_id
            WHERE p.id = product_questions.product_id
            AND s.user_id = auth.uid()
        )
        OR public.is_admin()
    );

CREATE POLICY "Admins can manage all questions"
    ON public.product_questions FOR ALL TO authenticated
    USING (public.is_admin());

-- =====================================================
-- 3. WALLETS & AFFILIATE LINKS (for referral system)
-- =====================================================
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    balance NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'TRY',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
    ON public.wallets FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet"
    ON public.wallets FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
    ON public.wallets FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all wallets"
    ON public.wallets FOR ALL TO authenticated
    USING (public.is_admin());

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    description TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON public.wallet_transactions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.wallets w
        WHERE w.id = wallet_transactions.wallet_id
        AND w.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all wallet transactions"
    ON public.wallet_transactions FOR ALL TO authenticated
    USING (public.is_admin());

CREATE TABLE public.affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    code TEXT NOT NULL UNIQUE,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate link"
    ON public.affiliate_links FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate link"
    ON public.affiliate_links FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliate links"
    ON public.affiliate_links FOR ALL TO authenticated
    USING (public.is_admin());

-- =====================================================
-- 4. PURCHASE CHECK FUNCTION (for review validation)
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE o.user_id = p_user_id
        AND oi.product_id = p_product_id
        AND o.status IN ('confirmed', 'preparing', 'shipped', 'delivered')
    )
$$;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
