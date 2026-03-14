
CREATE TABLE IF NOT EXISTS public.sms_automation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL UNIQUE,
  trigger_label text NOT NULL,
  message_template text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  variables text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_automation_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage sms automation settings') THEN
    CREATE POLICY "Admins can manage sms automation settings"
    ON public.sms_automation_settings FOR ALL TO public
    USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read sms automation settings') THEN
    CREATE POLICY "Anyone can read sms automation settings"
    ON public.sms_automation_settings FOR SELECT TO public
    USING (true);
  END IF;
END $$;

INSERT INTO public.sms_automation_settings (trigger_type, trigger_label, message_template, is_enabled, variables, sort_order) VALUES
('welcome', 'Yeni Üyelik - Hoş Geldiniz', 'Merhaba {name}! Medea''ya hoş geldiniz. İlk siparişinizde %10 indirim için HOSGELDIN kodunu kullanabilirsiniz.', true, ARRAY['name']::text[], 1),
('order_confirmed', 'Sipariş Onayı', 'Siparişiniz alındı! Sipariş No: {order_number}. Toplam: {total} TL. Hesabınızdan takip edebilirsiniz.', true, ARRAY['order_number', 'total', 'name']::text[], 2),
('order_shipped', 'Kargoya Verildi', 'Siparişiniz kargoya verildi! Sipariş No: {order_number}. Kargo Takip: {tracking_number}.', true, ARRAY['order_number', 'tracking_number']::text[], 3),
('order_delivered', 'Teslim Edildi', 'Siparişiniz teslim edildi! Deneyiminizi paylaşır mısınız? Ürünlerimizi değerlendirin.', true, ARRAY['order_number']::text[], 4),
('review_request', 'Yorum Talebi', 'Merhaba {name}! Aldığınız {product_name} hakkında ne düşünüyorsunuz? Yorumunuz bizim için çok değerli.', true, ARRAY['name', 'product_name']::text[], 5),
('promotion', 'Kampanya / İndirim', '{title}! {message}', false, ARRAY['title', 'message']::text[], 6),
('abandoned_cart', 'Terk Edilen Sepet', 'Sepetinizde ürünler sizi bekliyor! Siparişinizi tamamlamayı unutmayın.', false, '{}'::text[], 7),
('login_welcome', 'Giriş Bildirimi', 'Merhaba {name}! Hesabınıza başarıyla giriş yapıldı. Güvenliğiniz için bilgilendirme yapılmıştır.', false, ARRAY['name']::text[], 8)
ON CONFLICT (trigger_type) DO NOTHING;
