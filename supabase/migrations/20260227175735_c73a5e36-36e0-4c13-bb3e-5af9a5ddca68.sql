-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Add admin management policy for message_attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'message_attachments' AND policyname = 'Admins can manage all attachments'
  ) THEN
    CREATE POLICY "Admins can manage all attachments"
    ON public.message_attachments FOR ALL
    USING (public.is_admin());
  END IF;
END $$;
