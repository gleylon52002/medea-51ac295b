-- Drop the existing public SELECT policy that exposes sensitive config data
DROP POLICY IF EXISTS "Anyone can view active payment settings" ON public.payment_settings;

-- Create a more restrictive SELECT policy - only admins can see full config
CREATE POLICY "Only admins can view payment settings config"
ON public.payment_settings
FOR SELECT
USING (is_admin());

-- Create a secure view for public access (excludes sensitive config field)
CREATE VIEW public.payment_settings_public
WITH (security_invoker = on) AS
SELECT 
  id,
  method,
  is_active,
  created_at,
  updated_at
FROM public.payment_settings
WHERE is_active = true;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.payment_settings_public TO authenticated, anon;