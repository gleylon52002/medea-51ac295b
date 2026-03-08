
INSERT INTO storage.buckets (id, name, public)
VALUES ('file-manager', 'file-manager', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can do everything on file-manager"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'file-manager' AND public.is_admin())
WITH CHECK (bucket_id = 'file-manager' AND public.is_admin());

CREATE POLICY "Public read access on file-manager"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'file-manager');
