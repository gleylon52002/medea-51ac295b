
-- Fix overly permissive INSERT policy on coupon_uses
DROP POLICY IF EXISTS "Anyone can insert coupon uses" ON coupon_uses;
CREATE POLICY "Authenticated users can insert coupon uses" ON coupon_uses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
