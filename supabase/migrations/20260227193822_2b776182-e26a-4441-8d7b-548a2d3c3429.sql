-- Fix security definer view by setting it to SECURITY INVOKER
ALTER VIEW public.sellers_public SET (security_invoker = on);
