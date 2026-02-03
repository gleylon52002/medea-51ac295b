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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
        }
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      // Check if setting exists
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
            <TabsTrigger value="legal">Hukuki</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default AdminSettings;