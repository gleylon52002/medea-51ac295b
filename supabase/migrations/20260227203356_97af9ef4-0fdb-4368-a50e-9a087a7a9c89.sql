
-- 1. Fix chat_attachments storage policy: restrict to conversation participants
DROP POLICY IF EXISTS "Users can view their own chat attachments" ON storage.objects;

CREATE POLICY "Users can view attachments from their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_attachments'
  AND auth.role() = 'authenticated'
  AND (
    name LIKE '%' || auth.uid()::text || '%'
    OR
    EXISTS (
      SELECT 1 FROM public.message_attachments ma
      JOIN public.messages m ON ma.message_id = m.id
      JOIN public.conversations c ON m.conversation_id = c.id
      WHERE ma.file_path = name
      AND auth.uid() = ANY(c.participants)
    )
  )
);

-- 2. Add explicit deny INSERT policy on wallet_transactions
CREATE POLICY "No direct wallet transaction insertion"
ON public.wallet_transactions FOR INSERT
TO authenticated
WITH CHECK (false);

-- 3. Fix activity logs INSERT policy to validate user_id
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON public.site_activity_logs;

CREATE POLICY "Validated activity logging"
ON public.site_activity_logs FOR INSERT
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);
