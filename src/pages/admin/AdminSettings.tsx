import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Database } from "@/integrations/supabase/types";
import LogoUpload from "@/components/admin/LogoUpload";
import FaviconUpload from "@/components/admin/FaviconUpload";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Send, Loader2, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/admin/ImageUpload";

type SiteSetting = Database["public"]["Tables"]["site_settings"]["Row"];

interface GeneralSettings {
  site_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
}

interface ContactSettings {
  email: string;
  phone: string;
  address: string;
}

interface ShippingSettings {
  free_shipping_threshold: number;
  default_shipping_cost: number;
}

interface LegalSettings {
  kvkk: string;
  privacy_policy: string;
  sales_agreement: string;
  return_policy: string;
  cookie_policy: string;
}

interface EmailSettings {
  sender_email: string;
  sender_name: string;
  order_confirmation_enabled: boolean;
  order_status_enabled: boolean;
  shipping_notification_enabled: boolean;
  contact_form_notification_email: string;
}

interface AppPromotionSettings {
  enabled: boolean;
  android_url: string;
  ios_url: string;
  android_logo: string;
  ios_logo: string;
}

const AdminSettings = () => {
  const queryClient = useQueryClient();
  
  const [general, setGeneral] = useState<GeneralSettings>({
    site_name: "MEDEA",
    tagline: "Doğal Güzellik",
    logo_url: "",
    favicon_url: "",
  });

  const [contact, setContact] = useState<ContactSettings>({
    email: "",
    phone: "",
    address: "",
  });

  const [shipping, setShipping] = useState<ShippingSettings>({
    free_shipping_threshold: 300,
    default_shipping_cost: 29.90,
  });

  const [legal, setLegal] = useState<LegalSettings>({
    kvkk: "",
    privacy_policy: "",
    sales_agreement: "",
    return_policy: "",
    cookie_policy: "",
  });

  const [email, setEmail] = useState<EmailSettings>({
    sender_email: "noreply@medea.lovable.app",
    sender_name: "MEDEA",
    order_confirmation_enabled: true,
    order_status_enabled: true,
    shipping_notification_enabled: true,
    contact_form_notification_email: "",
  });

  const [testEmailTo, setTestEmailTo] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [appPromotion, setAppPromotion] = useState<AppPromotionSettings>({
    enabled: false,
    android_url: "",
    ios_url: "",
    android_logo: "",
    ios_logo: "",
  });
  const [appLogoImages, setAppLogoImages] = useState<{ android: string[]; ios: string[] }>({
    android: [],
    ios: [],
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  useEffect(() => {
    if (settings) {
      settings.forEach((setting) => {
        const value = setting.value as Record<string, any>;
        switch (setting.key) {
          case "general":
            setGeneral(value as GeneralSettings);
            break;
          case "contact":
            setContact(value as ContactSettings);
            break;
          case "shipping":
            setShipping(value as ShippingSettings);
            break;
          case "legal_pages":
            setLegal(value as LegalSettings);
            break;
          case "email":
            setEmail(prev => ({ ...prev, ...value }));
            break;
          case "app_promotion":
            setAppPromotion(prev => ({ ...prev, ...value }));
            setAppLogoImages({
              android: (value as any).android_logo ? [(value as any).android_logo] : [],
              ios: (value as any).ios_logo ? [(value as any).ios_logo] : [],
            });
            break;
        }
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-public"] });
      toast.success("Ayarlar kaydedildi");
    },
    onError: () => {
      toast.error("Kaydetme başarısız");
    },
  });

  const sendTestEmail = async () => {
    if (!testEmailTo) {
      toast.error("Lütfen test e-posta adresi girin");
      return;
    }
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "order_confirmation",
          to: testEmailTo,
          data: {
            orderNumber: "TEST-001",
            customerName: "Test Kullanıcı",
            total: "100.00₺",
            shippingAddress: "Test Adresi, İstanbul",
          },
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Test e-postası gönderildi!");
      } else {
        toast.error(data?.message || "E-posta gönderilemedi. Resend API anahtarını kontrol edin.");
      }
    } catch (err: any) {
      toast.error(err.message || "Test e-postası gönderilemedi");
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">Site Ayarları</h1>
        <p className="text-muted-foreground mt-1 text-sm lg:text-base">Genel site ayarlarını yönetin</p>
      </div>

      <Tabs defaultValue="general" className="w-full max-w-3xl">
        <ScrollArea className="w-full">
          <TabsList className="mb-6 inline-flex w-auto">
            <TabsTrigger value="general">Genel</TabsTrigger>
            <TabsTrigger value="contact">İletişim</TabsTrigger>
            <TabsTrigger value="shipping">Kargo</TabsTrigger>
            <TabsTrigger value="email">E-posta</TabsTrigger>
            <TabsTrigger value="legal">Hukuki</TabsTrigger>
            <TabsTrigger value="app">Mobil Uygulama</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Site adı ve logo ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="site_name">Site Adı</Label>
                  <Input
                    id="site_name"
                    value={general.site_name}
                    onChange={(e) => setGeneral(prev => ({ ...prev, site_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Slogan</Label>
                  <Input
                    id="tagline"
                    value={general.tagline}
                    onChange={(e) => setGeneral(prev => ({ ...prev, tagline: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Logo</Label>
                <LogoUpload
                  currentLogo={general.logo_url || null}
                  onLogoChange={(url) => setGeneral(prev => ({ ...prev, logo_url: url || "" }))}
                />
              </div>

              <div>
                <Label className="mb-2 block">Favicon</Label>
                <FaviconUpload
                  currentFavicon={general.favicon_url || null}
                  onFaviconChange={(url) => setGeneral(prev => ({ ...prev, favicon_url: url || "" }))}
                />
              </div>
              
              <Button 
                onClick={() => saveMutation.mutate({ key: "general", value: general })}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
              <CardDescription>Footer ve iletişim sayfasında görünecek bilgiler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={contact.phone}
                  onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+90 555 123 45 67"
                />
              </div>
              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={contact.address}
                  onChange={(e) => setContact(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "contact", value: contact })}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Kargo Ayarları</CardTitle>
              <CardDescription>Ücretsiz kargo limiti ve varsayılan kargo ücreti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="free_shipping_threshold">Ücretsiz Kargo Limiti (₺)</Label>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    value={shipping.free_shipping_threshold}
                    onChange={(e) => setShipping(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="default_shipping_cost">Varsayılan Kargo Ücreti (₺)</Label>
                  <Input
                    id="default_shipping_cost"
                    type="number"
                    step="0.01"
                    value={shipping.default_shipping_cost}
                    onChange={(e) => setShipping(prev => ({ ...prev, default_shipping_cost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "shipping", value: shipping })}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>E-posta Gönderim Ayarları</CardTitle>
                <CardDescription>
                  E-posta bildirimleri Resend servisi üzerinden gönderilir. 
                  API anahtarı Lovable Cloud üzerinden güvenli şekilde saklanır.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="sender_name">Gönderici Adı</Label>
                    <Input
                      id="sender_name"
                      value={email.sender_name}
                      onChange={(e) => setEmail(prev => ({ ...prev, sender_name: e.target.value }))}
                      placeholder="MEDEA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sender_email">Gönderici E-posta</Label>
                    <Input
                      id="sender_email"
                      type="email"
                      value={email.sender_email}
                      onChange={(e) => setEmail(prev => ({ ...prev, sender_email: e.target.value }))}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact_notification_email">İletişim Formu Bildirim E-postası</Label>
                  <Input
                    id="contact_notification_email"
                    type="email"
                    value={email.contact_form_notification_email}
                    onChange={(e) => setEmail(prev => ({ ...prev, contact_form_notification_email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">İletişim formu mesajları bu adrese iletilir</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Bildirim Türleri</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={email.order_confirmation_enabled}
                        onChange={(e) => setEmail(prev => ({ ...prev, order_confirmation_enabled: e.target.checked }))}
                        className="accent-primary"
                      />
                      <span className="text-sm">Sipariş onay e-postası</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={email.order_status_enabled}
                        onChange={(e) => setEmail(prev => ({ ...prev, order_status_enabled: e.target.checked }))}
                        className="accent-primary"
                      />
                      <span className="text-sm">Sipariş durum güncelleme e-postası</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={email.shipping_notification_enabled}
                        onChange={(e) => setEmail(prev => ({ ...prev, shipping_notification_enabled: e.target.checked }))}
                        className="accent-primary"
                      />
                      <span className="text-sm">Kargo bildirim e-postası</span>
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={() => saveMutation.mutate({ key: "email", value: email })}
                  disabled={saveMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Kaydet
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test E-postası</CardTitle>
                <CardDescription>Resend API bağlantısını test edin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendTestEmail} disabled={isSendingTest}>
                    {isSendingTest ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Gönder
                  </Button>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Not:</strong> E-posta gönderimi için Resend API anahtarının Lovable Cloud ortam değişkenlerinde 
                    (<code>RESEND_API_KEY</code>) tanımlı olması gerekir.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Hukuki Metinler</CardTitle>
              <CardDescription>KVKK, gizlilik politikası ve diğer yasal metinler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="kvkk">KVKK Metni</Label>
                <Textarea
                  id="kvkk"
                  value={legal.kvkk}
                  onChange={(e) => setLegal(prev => ({ ...prev, kvkk: e.target.value }))}
                  rows={6}
                  placeholder="KVKK aydınlatma metni..."
                />
              </div>
              <div>
                <Label htmlFor="privacy_policy">Gizlilik Politikası</Label>
                <Textarea
                  id="privacy_policy"
                  value={legal.privacy_policy}
                  onChange={(e) => setLegal(prev => ({ ...prev, privacy_policy: e.target.value }))}
                  rows={6}
                  placeholder="Gizlilik politikası metni..."
                />
              </div>
              <div>
                <Label htmlFor="sales_agreement">Mesafeli Satış Sözleşmesi</Label>
                <Textarea
                  id="sales_agreement"
                  value={legal.sales_agreement}
                  onChange={(e) => setLegal(prev => ({ ...prev, sales_agreement: e.target.value }))}
                  rows={6}
                  placeholder="Mesafeli satış sözleşmesi..."
                />
              </div>
              <div>
                <Label htmlFor="return_policy">İade ve İptal Koşulları</Label>
                <Textarea
                  id="return_policy"
                  value={legal.return_policy}
                  onChange={(e) => setLegal(prev => ({ ...prev, return_policy: e.target.value }))}
                  rows={6}
                  placeholder="İade politikası..."
                />
              </div>
              <div>
                <Label htmlFor="cookie_policy">Çerez Politikası</Label>
                <Textarea
                  id="cookie_policy"
                  value={legal.cookie_policy}
                  onChange={(e) => setLegal(prev => ({ ...prev, cookie_policy: e.target.value }))}
                  rows={6}
                  placeholder="Çerez politikası..."
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "legal_pages", value: legal })}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobil Uygulama Tanıtımı
              </CardTitle>
              <CardDescription>
                Android ve iOS uygulama indirme linkleri. Sadece bilgisayardan görünen küçük bir popup olarak gösterilir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={appPromotion.enabled}
                  onCheckedChange={(checked) => setAppPromotion(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Popup Aktif</Label>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Android (Google Play)</h3>
                <div>
                  <Label htmlFor="android_url">Google Play Linki</Label>
                  <Input
                    id="android_url"
                    value={appPromotion.android_url}
                    onChange={(e) => setAppPromotion(prev => ({ ...prev, android_url: e.target.value }))}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Android Logo / Badge</Label>
                  <ImageUpload
                    images={appLogoImages.android}
                    onImagesChange={(imgs) => {
                      setAppLogoImages(prev => ({ ...prev, android: imgs }));
                      setAppPromotion(prev => ({ ...prev, android_logo: imgs[0] || "" }));
                    }}
                    bucket="site-assets"
                    maxImages={1}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">iOS (App Store)</h3>
                <div>
                  <Label htmlFor="ios_url">App Store Linki</Label>
                  <Input
                    id="ios_url"
                    value={appPromotion.ios_url}
                    onChange={(e) => setAppPromotion(prev => ({ ...prev, ios_url: e.target.value }))}
                    placeholder="https://apps.apple.com/app/..."
                  />
                </div>
                <div>
                  <Label className="mb-2 block">iOS Logo / Badge</Label>
                  <ImageUpload
                    images={appLogoImages.ios}
                    onImagesChange={(imgs) => {
                      setAppLogoImages(prev => ({ ...prev, ios: imgs }));
                      setAppPromotion(prev => ({ ...prev, ios_logo: imgs[0] || "" }));
                    }}
                    bucket="site-assets"
                    maxImages={1}
                  />
                </div>
              </div>

              <Button
                onClick={() => saveMutation.mutate({ key: "app_promotion", value: appPromotion })}
                disabled={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;