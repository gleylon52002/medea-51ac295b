import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Image, Video, Upload } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface HeroSettings {
  type: "image" | "video";
  image_url: string;
  video_url: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
}

const defaultHero: HeroSettings = {
  type: "image",
  image_url: "",
  video_url: "",
  title: "Doğanın Gücünü Cildinize Taşıyın",
  subtitle: "El yapımı, vegan ve sürdürülebilir kozmetik ürünleriyle cildinize hak ettiği doğal bakımı sunun.",
  cta_text: "Ürünleri Keşfet",
  cta_link: "/urunler",
};

const AdminHero = () => {
  const queryClient = useQueryClient();
  const [hero, setHero] = useState<HeroSettings>(defaultHero);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "hero-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "hero")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as HeroSettings | undefined;
    },
  });

  useEffect(() => {
    if (settings) {
      setHero(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "hero")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: hero as any })
          .eq("key", "hero");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "hero", value: hero as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hero-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings", "hero"] });
      toast.success("Hero ayarları kaydedildi");
    },
    onError: () => {
      toast.error("Kaydetme başarısız");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">Hero Bölümü</h1>
        <p className="text-muted-foreground mt-1">Anasayfa tanıtım alanını düzenleyin</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medya Tipi</CardTitle>
              <CardDescription>Görsel veya video kullanın</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={hero.type}
                onValueChange={(v) => setHero({ ...hero, type: v as "image" | "video" })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="image" />
                  <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                    <Image className="h-4 w-4" />
                    Görsel
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                    <Video className="h-4 w-4" />
                    Video
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {hero.type === "image" ? (
            <Card>
              <CardHeader>
                <CardTitle>Hero Görseli</CardTitle>
                <CardDescription>Anasayfada görünecek tanıtım görseli</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  images={hero.image_url ? [hero.image_url] : []}
                  onImagesChange={(images) => setHero({ ...hero, image_url: images[0] || "" })}
                  bucket="product-images"
                  maxImages={1}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Hero Videosu</CardTitle>
                <CardDescription>YouTube veya doğrudan video URL'i</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Video URL</Label>
                  <Input
                    value={hero.video_url}
                    onChange={(e) => setHero({ ...hero, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/embed/... veya video.mp4"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    YouTube için embed URL kullanın (örn: https://www.youtube.com/embed/VIDEO_ID)
                  </p>
                </div>
                {hero.video_url && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    {hero.video_url.includes("youtube") || hero.video_url.includes("youtu.be") ? (
                      <iframe
                        src={hero.video_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={hero.video_url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>İçerik</CardTitle>
              <CardDescription>Başlık, açıklama ve buton ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Başlık</Label>
                <Input
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  placeholder="Doğanın Gücünü Cildinize Taşıyın"
                />
              </div>
              <div>
                <Label>Alt Başlık</Label>
                <Textarea
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  placeholder="El yapımı, vegan ve sürdürülebilir kozmetik ürünleri..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Buton Metni</Label>
                  <Input
                    value={hero.cta_text}
                    onChange={(e) => setHero({ ...hero, cta_text: e.target.value })}
                    placeholder="Ürünleri Keşfet"
                  />
                </div>
                <div>
                  <Label>Buton Linki</Label>
                  <Input
                    value={hero.cta_link}
                    onChange={(e) => setHero({ ...hero, cta_link: e.target.value })}
                    placeholder="/urunler"
                  />
                </div>
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Önizleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-b from-background to-secondary/30 rounded-lg p-6">
              <div className="grid lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-medium text-foreground">
                    {hero.title || "Başlık"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {hero.subtitle || "Alt başlık metni"}
                  </p>
                  <Button size="sm">
                    {hero.cta_text || "Buton"}
                  </Button>
                </div>
                <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
                  {hero.type === "image" && hero.image_url ? (
                    <img
                      src={hero.image_url}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  ) : hero.type === "video" && hero.video_url ? (
                    hero.video_url.includes("youtube") ? (
                      <iframe
                        src={hero.video_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={hero.video_url}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Upload className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHero;
