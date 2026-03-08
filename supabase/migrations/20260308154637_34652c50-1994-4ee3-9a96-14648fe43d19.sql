
CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_lang text NOT NULL DEFAULT 'tr',
  target_lang text NOT NULL,
  content_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'general',
  source_text text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_lang, target_lang, content_key)
);

CREATE INDEX idx_translations_lookup ON public.translations(target_lang, content_key);
CREATE INDEX idx_translations_type ON public.translations(content_type, target_lang);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations" ON public.translations
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage translations" ON public.translations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
