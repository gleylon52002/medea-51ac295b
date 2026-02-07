-- Migration: Product Questions Table
-- Description: Adds product_questions table for customer-seller interaction.

CREATE TABLE IF NOT EXISTS public.product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can see public questions
DROP POLICY IF EXISTS "Public questions are viewable by everyone" ON public.product_questions;
CREATE POLICY "Public questions are viewable by everyone" 
ON public.product_questions FOR SELECT 
USING (is_public = true OR public.is_admin());

-- 2. Authenticated users can ask questions
DROP POLICY IF EXISTS "Users can ask questions" ON public.product_questions;
CREATE POLICY "Users can ask questions" 
ON public.product_questions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 3. Sellers can update (answer) questions for their own products
DROP POLICY IF EXISTS "Sellers can answer questions for their products" ON public.product_questions;
CREATE POLICY "Sellers can answer questions for their products" 
ON public.product_questions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.products
        JOIN public.sellers ON products.seller_id = sellers.id
        WHERE products.id = product_questions.product_id
        AND sellers.user_id = auth.uid()
    )
    OR public.is_admin()
);

-- 4. Admins can manage all questions
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.product_questions;
CREATE POLICY "Admins can manage all questions" 
ON public.product_questions FOR ALL 
USING (public.is_admin());

-- 5. Sellers can see all questions directed to their products
DROP POLICY IF EXISTS "Sellers can view questions for their products" ON public.product_questions;
CREATE POLICY "Sellers can view questions for their products" 
ON public.product_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.products
        JOIN public.sellers ON products.seller_id = sellers.id
        WHERE products.id = product_questions.product_id
        AND sellers.user_id = auth.uid()
    )
    OR public.is_admin()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_questions_updated_at ON public.product_questions;
CREATE TRIGGER update_product_questions_updated_at
    BEFORE UPDATE ON public.product_questions
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
