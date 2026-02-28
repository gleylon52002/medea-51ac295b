
-- SMS Templates table
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  template_type text NOT NULL DEFAULT 'custom',
  variables text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage SMS templates"
ON public.sms_templates FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- SMS Settings (provider configs)
CREATE TABLE public.sms_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage SMS settings"
ON public.sms_settings FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- SMS Logs table
CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.sms_templates(id),
  phone text NOT NULL,
  content text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage SMS logs"
ON public.sms_logs FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- A/B Test tables
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  test_type text NOT NULL DEFAULT 'banner',
  variant_a jsonb NOT NULL DEFAULT '{}',
  variant_b jsonb NOT NULL DEFAULT '{}',
  traffic_split integer NOT NULL DEFAULT 50,
  impressions_a integer NOT NULL DEFAULT 0,
  impressions_b integer NOT NULL DEFAULT 0,
  conversions_a integer NOT NULL DEFAULT 0,
  conversions_b integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AB tests"
ON public.ab_tests FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active AB tests"
ON public.ab_tests FOR SELECT
USING (is_active = true OR is_admin());

-- Abandoned carts tracking
CREATE TABLE public.abandoned_cart_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cart_snapshot jsonb NOT NULL DEFAULT '[]',
  email_sent boolean NOT NULL DEFAULT false,
  sms_sent boolean NOT NULL DEFAULT false,
  reminder_count integer NOT NULL DEFAULT 0,
  last_reminder_at timestamptz,
  recovered boolean NOT NULL DEFAULT false,
  recovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_cart_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage abandoned cart reminders"
ON public.abandoned_cart_reminders FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own reminders"
ON public.abandoned_cart_reminders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insert default SMS templates
INSERT INTO public.sms_templates (name, content, template_type, variables) VALUES
('Sipariş Onayı', 'Sayın {musteri_adi}, #{siparis_no} numaralı siparişiniz onaylanmıştır. Toplam: {toplam} TL. Medea ile alışverişiniz için teşekkürler!', 'order_confirmed', ARRAY['musteri_adi', 'siparis_no', 'toplam']),
('Kargo Bildirimi', 'Sayın {musteri_adi}, #{siparis_no} numaralı siparişiniz kargoya verilmiştir. Takip No: {takip_no}. Kargo: {kargo_firmasi}', 'order_shipped', ARRAY['musteri_adi', 'siparis_no', 'takip_no', 'kargo_firmasi']),
('Teslim Bildirimi', 'Sayın {musteri_adi}, #{siparis_no} numaralı siparişiniz teslim edilmiştir. İyi günlerde kullanmanızı dileriz!', 'order_delivered', ARRAY['musteri_adi', 'siparis_no']),
('Sepet Hatırlatma', 'Sayın {musteri_adi}, sepetinizde {urun_sayisi} ürün sizi bekliyor! Siparişinizi tamamlamak için: {link}', 'cart_reminder', ARRAY['musteri_adi', 'urun_sayisi', 'link']),
('Hoş Geldiniz', 'Medea''ya hoş geldiniz {musteri_adi}! İlk siparişinize özel %10 indirim kodu: HOSGELDIN10', 'welcome', ARRAY['musteri_adi']),
('Stok Bildirimi', 'Sayın {musteri_adi}, takip ettiğiniz "{urun_adi}" ürünü tekrar stoklara girmiştir!', 'stock_alert', ARRAY['musteri_adi', 'urun_adi']),
('Kampanya Duyurusu', '{kampanya_adi} başladı! {kampanya_detay}. Kaçırmayın: {link}', 'campaign', ARRAY['kampanya_adi', 'kampanya_detay', 'link']),
('İade Onayı', 'Sayın {musteri_adi}, #{siparis_no} numaralı siparişinizin iade işlemi onaylanmıştır. İade tutarı: {tutar} TL', 'refund', ARRAY['musteri_adi', 'siparis_no', 'tutar']);

-- Insert default SMS provider settings
INSERT INTO public.sms_settings (provider, config, is_active) VALUES
('netgsm', '{"username": "", "password": "", "sender": "", "api_url": "https://api.netgsm.com.tr/sms/send/get"}'::jsonb, false),
('ileti_merkezi', '{"api_key": "", "sender": "", "api_url": "https://api.iletimerkezi.com/v1"}'::jsonb, false),
('twilio', '{"account_sid": "", "auth_token": "", "from_number": ""}'::jsonb, false);

-- Updated at triggers
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON public.sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_settings_updated_at BEFORE UPDATE ON public.sms_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON public.ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_abandoned_cart_updated_at BEFORE UPDATE ON public.abandoned_cart_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
