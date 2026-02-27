
-- Site activity logs table for admin analytics
CREATE TABLE public.site_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    ip_address text,
    user_agent text,
    page_path text NOT NULL,
    page_title text,
    action_type text NOT NULL DEFAULT 'page_view',
    action_detail jsonb DEFAULT '{}',
    referrer text,
    device_type text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can manage activity logs" ON public.site_activity_logs
    FOR ALL TO authenticated USING (is_admin());

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert activity logs" ON public.site_activity_logs
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_activity_logs_created_at ON public.site_activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.site_activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON public.site_activity_logs(action_type);

-- Add identity_number to profiles for COD verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_number text;

-- Add review images support
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
