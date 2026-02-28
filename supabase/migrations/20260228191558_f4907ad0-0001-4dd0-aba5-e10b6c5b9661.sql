
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Validated activity logging" ON public.site_activity_logs;
DROP POLICY IF EXISTS "Admins can manage activity logs" ON public.site_activity_logs;

-- Create PERMISSIVE admin policy
CREATE POLICY "Admins can manage activity logs"
ON public.site_activity_logs FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create PERMISSIVE insert policy for everyone (anon + authenticated)
CREATE POLICY "Anyone can log activity"
ON public.site_activity_logs FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);
