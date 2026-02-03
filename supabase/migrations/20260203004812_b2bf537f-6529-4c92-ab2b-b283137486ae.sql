-- Add new payment methods to enum (separate statements for each)
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'shopier';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'shopinext';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'payizone';