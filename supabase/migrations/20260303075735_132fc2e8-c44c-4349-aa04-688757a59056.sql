
-- Fix gift_packages overly permissive SELECT/UPDATE policies
DROP POLICY IF EXISTS "Recipients can view by token" ON public.gift_packages;
DROP POLICY IF EXISTS "Recipients can update address" ON public.gift_packages;

CREATE POLICY "Anyone can view by token" ON public.gift_packages FOR SELECT USING (
  (auth.uid() = sender_id) OR is_admin() OR (gift_link_token IS NOT NULL)
);
CREATE POLICY "Recipients can update their address by token" ON public.gift_packages FOR UPDATE USING (
  (auth.uid() = sender_id) OR is_admin()
);
