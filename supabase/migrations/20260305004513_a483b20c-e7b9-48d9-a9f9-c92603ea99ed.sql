
-- Fix the overly permissive insert policy on spin_results
DROP POLICY IF EXISTS "System can insert results" ON public.spin_results;
CREATE POLICY "Authenticated users can insert own results" ON public.spin_results FOR INSERT WITH CHECK (auth.uid() = user_id);
