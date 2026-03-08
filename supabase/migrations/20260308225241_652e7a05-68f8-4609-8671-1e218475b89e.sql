
-- Create chat_attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat_attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat_attachments');

-- Allow anyone to read chat attachments (public bucket)
CREATE POLICY "Anyone can read chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat_attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat_attachments' AND (storage.foldername(name))[1] = 'chat');
