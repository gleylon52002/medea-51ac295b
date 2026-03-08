
-- Shared wishlists table for wishlist sharing feature
CREATE TABLE public.shared_wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    share_token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
    title text NOT NULL DEFAULT 'Favori Listem',
    product_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
    is_active boolean NOT NULL DEFAULT true,
    view_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_wishlists ENABLE ROW LEVEL SECURITY;

-- Users can manage their own shared wishlists
CREATE POLICY "Users can manage own shared wishlists" ON public.shared_wishlists
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Anyone can view active shared wishlists by token (for public sharing)
CREATE POLICY "Anyone can view shared wishlists by token" ON public.shared_wishlists
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- Add video_url column to products for video support
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;
