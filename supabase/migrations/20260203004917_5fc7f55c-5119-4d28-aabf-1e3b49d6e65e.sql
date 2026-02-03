-- Create payment transactions table for tracking payments
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  callback_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all payment transactions"
  ON public.payment_transactions FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create site-assets bucket for logo and other assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT DO NOTHING;

-- Storage policies for site-assets bucket
CREATE POLICY "Site assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can manage site assets"
  ON storage.objects FOR ALL
  USING (bucket_id = 'site-assets' AND is_admin());