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

interface SocialSettings {
  instagram: string;
  facebook: string;
  twitter: string;
}

interface ShippingSettings {
  free_shipping_threshold: number;
  default_shipping_cost: number;
}

interface SeoSettings {
  meta_title: string;
  meta_description: string;
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

  const [social, setSocial] = useState<SocialSettings>({
    instagram: "",
    facebook: "",
    twitter: "",
  });

  const [shipping, setShipping] = useState<ShippingSettings>({
    free_shipping_threshold: 300,
    default_shipping_cost: 29.90,
  });

  const [seo, setSeo] = useState<SeoSettings>({
    meta_title: "",
    meta_description: "",
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
          case "social":
            setSocial(value as SocialSettings);
            break;
          case "shipping":
            setShipping(value as ShippingSettings);
            break;
          case "seo":
            setSeo(value as SeoSettings);
            break;
        }
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
      toast.success("Ayarlar kaydedildi");
    },
    onError: () => {
      toast.error("Kaydetme başarısız");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">Site Ayarları</h1>
        <p className="text-muted-foreground mt-1">Genel site ayarlarını yönetin</p>
      </div>

      <Tabs defaultValue="general" className="max-w-3xl">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="contact">İletişim</TabsTrigger>
          <TabsTrigger value="social">Sosyal Medya</TabsTrigger>
          <TabsTrigger value="shipping">Kargo</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Site adı ve logo ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={general.logo_url}
                  onChange={(e) => setGeneral(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "general", value: general })}
                disabled={saveMutation.isPending}
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
              <CardDescription>Müşterilerinizin sizinle iletişim kurması için</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={contact.phone}
                  onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={contact.address}
                  onChange={(e) => setContact(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "contact", value: contact })}
                disabled={saveMutation.isPending}
              >
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Sosyal Medya</CardTitle>
              <CardDescription>Sosyal medya hesaplarınızın linkleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={social.instagram}
                  onChange={(e) => setSocial(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={social.facebook}
                  onChange={(e) => setSocial(prev => ({ ...prev, facebook: e.target.value }))}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={social.twitter}
                  onChange={(e) => setSocial(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "social", value: social })}
                disabled={saveMutation.isPending}
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
              <div>
                <Label htmlFor="free_shipping_threshold">Ücretsiz Kargo Limiti (₺)</Label>
                <Input
                  id="free_shipping_threshold"
                  type="number"
                  value={shipping.free_shipping_threshold}
                  onChange={(e) => setShipping(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="default_shipping_cost">Varsayılan Kargo Ücreti (₺)</Label>
                <Input
                  id="default_shipping_cost"
                  type="number"
                  step="0.01"
                  value={shipping.default_shipping_cost}
                  onChange={(e) => setShipping(prev => ({ ...prev, default_shipping_cost: parseFloat(e.target.value) }))}
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "shipping", value: shipping })}
                disabled={saveMutation.isPending}
              >
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Ayarları</CardTitle>
              <CardDescription>Arama motorları için varsayılan meta bilgileri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Başlık</Label>
                <Input
                  id="meta_title"
                  value={seo.meta_title}
                  onChange={(e) => setSeo(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="MEDEA - Doğal Kozmetik"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Açıklama</Label>
                <Textarea
                  id="meta_description"
                  value={seo.meta_description}
                  onChange={(e) => setSeo(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="El yapımı, doğal içerikli kozmetik ürünleri..."
                />
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ key: "seo", value: seo })}
                disabled={saveMutation.isPending}
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
