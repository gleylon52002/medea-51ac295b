-- Step 1: Add seller to app_role enum (this must be committed first)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';