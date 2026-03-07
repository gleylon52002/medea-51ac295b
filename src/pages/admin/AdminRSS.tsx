import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Rss, Copy, ExternalLink, Loader2, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminRSS = () => {
  const [loading, setLoading] = useState(false);
  const [rssContent, setRssContent] = useState<string | null>(null);

  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-rss-feed`;

  const handleGenerateRSS = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("product-rss-feed");
      if (error) throw error;
      
      // data comes as text
      const text = typeof data === "string" ? data : JSON.stringify(data);
      setRssContent(text);
      toast.success("RSS beslemesi başarıyla oluşturuldu!");
    } catch (err: any) {
      console.error("RSS generation error:", err);
      toast.error("RSS beslemesi oluşturulamadı: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  };

  const copyRssUrl = () => {
    navigator.clipboard.writeText(rssUrl);
    toast.success("RSS URL kopyalandı!");
  };

  const copyRssContent = () => {
    if (rssContent) {
      navigator.clipboard.writeText(rssContent);
      toast.success("RSS içeriği kopyalandı!");
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
          <Rss className="h-7 w-7 text-primary" />
          RSS Beslemesi
        </h1>
        <p className="text-muted-foreground mt-1 text-sm lg:text-base">
          Ürünleriniz için RSS beslemesi oluşturun ve Instagram otomasyon araçlarına entegre edin
        </p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* RSS URL Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">RSS Feed URL</CardTitle>
            <CardDescription>
              Bu URL'yi Instagram otomasyon araçlarınıza (Zapier, Make, IFTTT vb.) ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all select-all">
                {rssUrl}
              </div>
              <Button variant="outline" size="icon" onClick={copyRssUrl} title="URL Kopyala">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Bu URL yalnızca admin yetkisiyle erişilebilir. Otomasyon araçlarınızda Authorization header'ı eklemeniz gerekir.
            </p>
          </CardContent>
        </Card>

        {/* Generate & Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Besleme Oluştur & Önizle</CardTitle>
            <CardDescription>
              Ürün görselleri, açıklamaları ve linkleri içeren RSS XML'ini oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={handleGenerateRSS} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Rss className="h-4 w-4 mr-2" />
                    RSS Oluştur
                  </>
                )}
              </Button>
              {rssContent && (
                <Button variant="outline" onClick={copyRssContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  XML Kopyala
                </Button>
              )}
            </div>

            {rssContent && (
              <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                  {rssContent}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instagram Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Instagram Otomasyon Rehberi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground">1. Zapier / Make ile Otomatik Paylaşım:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Zapier veya Make hesabınıza giriş yapın</li>
                <li>"RSS by Zapier" veya "RSS" modülünü tetikleyici olarak ekleyin</li>
                <li>Yukarıdaki RSS URL'sini Feed URL olarak yapıştırın</li>
                <li>Instagram Business hesabınızı bağlayın</li>
                <li>Ürün görselini, açıklamasını ve linkini eşleştirin</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">2. RSS Formatı:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li><strong>Başlık:</strong> Ürün adı</li>
                <li><strong>Görsel:</strong> &lt;enclosure&gt; ve &lt;media:content&gt; etiketleri</li>
                <li><strong>Açıklama:</strong> Ürün kısa açıklaması</li>
                <li><strong>Link:</strong> Ürün sayfası URL'si</li>
                <li><strong>Kategori:</strong> Ürün kategorisi</li>
                <li><strong>Fiyat:</strong> Güncel satış fiyatı</li>
              </ul>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs">
                💡 <strong>İpucu:</strong> Instagram Business API, doğrudan RSS desteklemez. Zapier, Make veya IFTTT gibi 
                bir otomasyon aracı kullanarak RSS'i Instagram paylaşımlarına dönüştürebilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRSS;
