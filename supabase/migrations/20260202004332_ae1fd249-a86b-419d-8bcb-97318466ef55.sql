-- FAQ tablosu
CREATE TABLE public.faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQs" ON public.faqs
    FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage FAQs" ON public.faqs
    FOR ALL USING (is_admin());

-- Kampanyalar tablosu
CREATE TABLE public.campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    product_ids UUID[] DEFAULT '{}',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    banner_image TEXT,
    banner_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active campaigns" ON public.campaigns
    FOR SELECT USING ((is_active = true AND (ends_at IS NULL OR ends_at > now()) AND starts_at <= now()) OR is_admin());

CREATE POLICY "Admins can manage campaigns" ON public.campaigns
    FOR ALL USING (is_admin());

-- Sosyal medya hesapları tablosu
CREATE TABLE public.social_media_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    icon_name TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active social links" ON public.social_media_links
    FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage social links" ON public.social_media_links
    FOR ALL USING (is_admin());

-- Tema ayarları için site_settings'e eklemeler
INSERT INTO public.site_settings (key, value) VALUES 
('theme', '{"primary_hue": 150, "primary_saturation": 25, "primary_lightness": 25, "accent_hue": 20, "accent_saturation": 50, "accent_lightness": 55}'::jsonb),
('hero', '{"type": "image", "image_url": "", "video_url": "", "title": "Doğanın Gücünü Cildinize Taşıyın", "subtitle": "El yapımı, vegan ve sürdürülebilir kozmetik ürünleriyle cildinize hak ettiği doğal bakımı sunun.", "cta_text": "Ürünleri Keşfet", "cta_link": "/urunler"}'::jsonb),
('footer', '{"description": "Doğanın gücünü cildinize taşıyoruz. El yapımı, doğal ve sürdürülebilir kozmetik ürünleri.", "copyright": "© 2024 MEDEA. Tüm hakları saklıdır."}'::jsonb),
('legal_pages', '{"kvkk": "", "privacy": "", "sales_agreement": "", "return_policy": "", "cookie_policy": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Varsayılan sosyal medya linkleri
INSERT INTO public.social_media_links (platform, url, icon_name, sort_order) VALUES
('Instagram', 'https://instagram.com', 'Instagram', 1),
('Facebook', 'https://facebook.com', 'Facebook', 2),
('Twitter', 'https://twitter.com', 'Twitter', 3),
('YouTube', 'https://youtube.com', 'Youtube', 4),
('TikTok', 'https://tiktok.com', 'Music2', 5),
('Pinterest', 'https://pinterest.com', 'Image', 6);

-- Triggers for updated_at
CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();