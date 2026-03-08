import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Globe, FileText, Search, Download, Copy, Check } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

interface SEOSettings {
  meta_title: string;
  meta_description: string;
  og_image: string;
  google_analytics_id: string;
  google_search_console: string;
}

const AdminSEO = () => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState<string | null>(null);
  const { data: products } = useProducts();
  const { data: categories } = useCategories();

  const [seo, setSeo] = useState<SEOSettings>({
    meta_title: "",
    meta_description: "",
    og_image: "",
    google_analytics_id: "",
    google_search_console: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "seo-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "seo")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as SEOSettings | undefined;
    },
  });

  useEffect(() => {
    if (settings) {
      setSeo(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "seo")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: seo as any })
          .eq("key", "seo");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "seo", value: seo as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "seo-settings"] });
      toast.success("SEO ayarları kaydedildi");
    },
    onError: () => {
      toast.error("Kaydetme başarısız");
    },
  });

  const generateSitemap = () => {
    const baseUrl = window.location.origin;
    const today = new Date().toISOString().split('T')[0];
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/urunler</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/hakkimizda</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/iletisim</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

    // Add categories
    categories?.forEach((cat) => {
      sitemap += `
  <url>
    <loc>${baseUrl}/kategori/${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add products
    products?.forEach((product) => {
      const lastmod = product.updated_at.split('T')[0];
      sitemap += `
  <url>
    <loc>${baseUrl}/urun/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    return sitemap;
  };

  const generateRobotsTxt = () => {
    const baseUrl = window.location.origin;
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin pages
Disallow: /admin/
Disallow: /hesabim/
Disallow: /giris
Disallow: /odeme

# Allow crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} kopyalandı`);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} indirildi`);
  };

  const autoGenerateFile = async (content: string, filename: string) => {
    const key = filename.includes("sitemap") ? "sitemap" : "robots";
    setIsAutoGenerating(key);
    try {
      let finalContent = content;

      // For sitemap, fetch the real dynamic content from edge function
      if (filename === "sitemap.xml") {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "gxzlltmivdlpplunuusi";
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/sitemap`
        );
        if (!response.ok) throw new Error("Sitemap fonksiyonu yanıt vermedi");
        finalContent = await response.text();
      }

      const blob = new Blob([finalContent], { type: filename.endsWith('.xml') ? 'text/xml' : 'text/plain' });
      const file = new File([blob], filename, { type: blob.type });

      const { error } = await supabase.storage
        .from("site-assets")
        .upload(filename, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filename);

      toast.success(`${filename} başarıyla oluşturuldu!`, {
        description: `URL: ${publicUrl.publicUrl}`,
      });
    } catch (e: any) {
      toast.error(`${filename} oluşturulamadı: ${e.message}`);
    } finally {
      setIsAutoGenerating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const sitemap = generateSitemap();
  const robotsTxt = generateRobotsTxt();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">SEO Yönetimi</h1>
        <p className="text-muted-foreground mt-1">Arama motoru optimizasyonu ayarları</p>
      </div>

      <Tabs defaultValue="meta">
        <TabsList className="mb-6">
          <TabsTrigger value="meta">
            <Search className="h-4 w-4 mr-2" />
            Meta Bilgileri
          </TabsTrigger>
          <TabsTrigger value="sitemap">
            <Globe className="h-4 w-4 mr-2" />
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="robots">
            <FileText className="h-4 w-4 mr-2" />
            Robots.txt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta">
          <Card>
            <CardHeader>
              <CardTitle>Meta Etiketleri</CardTitle>
              <CardDescription>Arama sonuçlarında görünecek bilgiler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Başlığı (Meta Title)</Label>
                <Input
                  value={seo.meta_title}
                  onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })}
                  placeholder="MEDEA - Doğal Kozmetik Ürünleri"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seo.meta_title.length}/60 karakter
                </p>
              </div>
              <div>
                <Label>Site Açıklaması (Meta Description)</Label>
                <Textarea
                  value={seo.meta_description}
                  onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })}
                  placeholder="El yapımı, doğal içerikli kozmetik ürünleri. Vegan ve sürdürülebilir güzellik."
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seo.meta_description.length}/160 karakter
                </p>
              </div>
              <div>
                <Label>OG Image URL (Sosyal Medya Paylaşım Görseli)</Label>
                <Input
                  value={seo.og_image}
                  onChange={(e) => setSeo({ ...seo, og_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Google Analytics ID</Label>
                <Input
                  value={seo.google_analytics_id}
                  onChange={(e) => setSeo({ ...seo, google_analytics_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div>
                <Label>Google Search Console Doğrulama Kodu</Label>
                <Input
                  value={seo.google_search_console}
                  onChange={(e) => setSeo({ ...seo, google_search_console: e.target.value })}
                  placeholder="google-site-verification=..."
                />
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>SEO Önizleme</CardTitle>
              <CardDescription>Google arama sonuçlarında nasıl görünür</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-white">
                <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {seo.meta_title || "MEDEA - Doğal Kozmetik Ürünleri"}
                </p>
                <p className="text-green-700 text-sm">{window.location.origin}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {seo.meta_description || "El yapımı, doğal içerikli kozmetik ürünleri. Vegan ve sürdürülebilir güzellik."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap.xml</CardTitle>
              <CardDescription>
                {products?.length || 0} ürün ve {categories?.length || 0} kategori içeren sitemap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs">{sitemap}</pre>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(sitemap, "Sitemap")}>
                  {copied === "Sitemap" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Kopyala
                </Button>
                <Button onClick={() => downloadFile(sitemap, "sitemap.xml")}>
                  <Download className="h-4 w-4 mr-2" />
                  İndir
                </Button>
                <Button 
                  variant="default"
                  onClick={() => autoGenerateFile(sitemap, "sitemap.xml")}
                  disabled={isAutoGenerating === "sitemap"}
                >
                  {isAutoGenerating === "sitemap" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
                  Otomatik Oluştur
                </Button>
              </div>
              <div className="bg-accent/30 border border-accent rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>💡 Otomatik Oluştur:</strong> Butona tıkladığınızda backend fonksiyonundan güncel sitemap çekilir ve 
                  Storage'a yüklenir. Google Search Console'a <code>https://medea.tr/sitemap.xml</code> adresini ekleyin.
                  <br /><strong>Not:</strong> Sitemap, ürün/kategori/blog değişikliklerinde her zaman günceldir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots">
          <Card>
            <CardHeader>
              <CardTitle>Robots.txt</CardTitle>
              <CardDescription>Arama motoru botlarına talimatlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-sm whitespace-pre-wrap">{robotsTxt}</pre>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(robotsTxt, "Robots.txt")}>
                  {copied === "Robots.txt" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Kopyala
                </Button>
                <Button onClick={() => downloadFile(robotsTxt, "robots.txt")}>
                  <Download className="h-4 w-4 mr-2" />
                  İndir
                </Button>
                <Button 
                  variant="default"
                  onClick={() => autoGenerateFile(robotsTxt, "robots.txt")}
                  disabled={isAutoGenerating === "robots"}
                >
                  {isAutoGenerating === "robots" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Otomatik Oluştur
                </Button>
              </div>
              <div className="bg-accent/30 border border-accent rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>💡 Otomatik Oluştur:</strong> Butona tıkladığınızda <code>robots.txt</code> dosyası 
                  storage'a yüklenir ve herkese açık URL üzerinden erişilebilir olur.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSEO;
