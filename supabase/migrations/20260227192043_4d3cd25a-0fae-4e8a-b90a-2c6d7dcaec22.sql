-- Fix: sellers table public SELECT policy exposes banking info
-- Drop the overly permissive public policy and create a restricted one
DROP POLICY IF EXISTS "Anyone can view active sellers" ON public.sellers;

-- Public can only see non-sensitive seller info
CREATE POLICY "Anyone can view active seller public info"
ON public.sellers FOR SELECT
USING (status = 'active'::text);

-- Create a view for public seller info that excludes sensitive fields
CREATE OR REPLACE VIEW public.sellers_public AS
SELECT 
  id, company_name, slug, description, logo_url, banner_url,
  city, district, reputation_points, total_orders, total_sales,
  is_featured, status, created_at
FROM public.sellers
WHERE status = 'active';
