import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Upload, X } from "lucide-react";

interface AboutContent {
  hero_title: string;
  hero_description: string;
  story_title: string;
  story_paragraphs: string[];
  story_image: string;
  values_title: string;
  values: { icon: string; title: string; description: string }[];
  team_title: string;
  team_description: string;
  team_images: string[];
}

const defaultContent: AboutContent = {
  hero_title: "Doğanın Gücü, Cildinizin Güzelliği",
  hero_description: "MEDEA olarak, doğal kozmetik ürünler üretme tutkusuyla yola çıktık. Her ürünümüz, doğadan özenle seçilmiş içeriklerle, el emeğiyle ve sevgiyle üretilmektedir.",
  story_title: "Hikayemiz",
  story_paragraphs: [
    "2020 yılında İstanbul'da kurulan MEDEA, doğal ve sürdürülebilir kozmetik ürünlere olan ihtiyaçtan doğdu.",
    "Bugün, Ege'nin bereketli topraklarından toplanan bitkileri kullanarak, geleneksel yöntemlerle modern kozmetik bilimini birleştiriyoruz.",
    "Amacımız sadece güzel ürünler üretmek değil, aynı zamanda çevreye ve topluma karşı sorumluluklarımızı yerine getirmektir."
  ],
  story_image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600",
  values_title: "Değerlerimiz",
  values: [
    { icon: "leaf", title: "%100 Doğal", description: "Tüm ürünlerimiz doğal ve organik içeriklerden üretilmektedir." },
    { icon: "heart", title: "Cruelty-Free", description: "Hiçbir ürünümüz hayvanlar üzerinde test edilmemektedir." },
    { icon: "shield", title: "Güvenilir", description: "Tüm ürünlerimiz dermatolojik olarak test edilmiştir." },
    { icon: "sparkles", title: "El Yapımı", description: "Her ürün özenle ve küçük partiler halinde üretilmektedir." },
  ],
  team_title: "Ekibimiz",
  team_description: "MEDEA ailesinde, kozmetik biliminden botanik uzmanlığına kadar farklı alanlarda deneyimli bir ekip yer almaktadır.",
  team_images: [
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  ],
};

const AdminAbout = () => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: savedContent, isLoading } = useQuery({
    queryKey: ["site-settings", "about_page"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "about_page")
        .maybeSingle();
      return (data?.value as unknown as AboutContent) || null;
    },
  });

  useEffect(() => {
    if (savedContent) setContent(savedContent);
  }, [savedContent]);

  const saveMutation = useMutation({
    mutationFn: async (data: AboutContent) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "about_page", value: data as any }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Hakkımızda sayfası güncellendi");
    },
    onError: () => toast.error("Kaydetme başarısız"),
  });

  const uploadImage = async (file: File, target: string) => {
    if (!file.type.startsWith("image/")) { toast.error("Geçersiz dosya"); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Dosya 5MB'dan büyük"); return null; }

    setUploading(target);
    const ext = file.name.split(".").pop();
    const path = `about/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (error) { toast.error("Yükleme hatası"); setUploading(null); return null; }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setUploading(null);
    return data.publicUrl;
  };

  const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, "story");
    if (url) setContent(prev => ({ ...prev, story_image: url }));
  };

  const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, `team-${index ?? "new"}`);
    if (!url) return;
    setContent(prev => {
      const imgs = [...prev.team_images];
      if (index !== undefined) imgs[index] = url;
      else imgs.push(url);
      return { ...prev, team_images: imgs };
    });
  };

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hakkımızda Sayfası</h1>
          <p className="text-muted-foreground text-sm">Sayfa içeriklerini ve görsellerini düzenleyin</p>
        </div>
        <Button onClick={() => saveMutation.mutate(content)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Kaydet
        </Button>
      </div>

      {/* Hero Section */}
      <Card>
        <CardHeader><CardTitle>Hero Bölümü</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Başlık</Label>
            <Input value={content.hero_title} onChange={e => setContent(p => ({ ...p, hero_title: e.target.value }))} />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea value={content.hero_description} onChange={e => setContent(p => ({ ...p, hero_description: e.target.value }))} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Story Section */}
      <Card>
        <CardHeader><CardTitle>Hikaye Bölümü</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bölüm Başlığı</Label>
            <Input value={content.story_title} onChange={e => setContent(p => ({ ...p, story_title: e.target.value }))} />
          </div>
          <div>
            <Label>Görsel</Label>
            <div className="flex items-start gap-4">
              {content.story_image && (
                <img src={content.story_image} alt="Hikaye" className="w-32 h-24 object-cover rounded-lg" />
              )}
              <div>
                <input type="file" accept="image/*" onChange={handleStoryImageUpload} className="hidden" id="story-img" />
                <Button variant="outline" size="sm" asChild disabled={uploading === "story"}>
                  <label htmlFor="story-img" className="cursor-pointer">
                    {uploading === "story" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Görsel Yükle
                  </label>
                </Button>
                <Input
                  placeholder="veya URL girin"
                  value={content.story_image}
                  onChange={e => setContent(p => ({ ...p, story_image: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Paragraflar</Label>
            {content.story_paragraphs.map((p, i) => (
              <div key={i} className="flex gap-2 mt-2">
                <Textarea
                  value={p}
                  onChange={e => {
                    const arr = [...content.story_paragraphs];
                    arr[i] = e.target.value;
                    setContent(prev => ({ ...prev, story_paragraphs: arr }));
                  }}
                  rows={2}
                />
                <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => {
                  setContent(prev => ({ ...prev, story_paragraphs: prev.story_paragraphs.filter((_, idx) => idx !== i) }));
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setContent(p => ({ ...p, story_paragraphs: [...p.story_paragraphs, ""] }))}>
              <Plus className="h-4 w-4 mr-1" /> Paragraf Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Values Section */}
      <Card>
        <CardHeader><CardTitle>Değerler Bölümü</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bölüm Başlığı</Label>
            <Input value={content.values_title} onChange={e => setContent(p => ({ ...p, values_title: e.target.value }))} />
          </div>
          {content.values.map((v, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Değer #{i + 1}</Label>
                {content.values.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                    setContent(prev => ({ ...prev, values: prev.values.filter((_, idx) => idx !== i) }));
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">İkon (leaf/heart/shield/sparkles)</Label>
                  <Input value={v.icon} onChange={e => {
                    const arr = [...content.values]; arr[i] = { ...arr[i], icon: e.target.value };
                    setContent(prev => ({ ...prev, values: arr }));
                  }} />
                </div>
                <div>
                  <Label className="text-xs">Başlık</Label>
                  <Input value={v.title} onChange={e => {
                    const arr = [...content.values]; arr[i] = { ...arr[i], title: e.target.value };
                    setContent(prev => ({ ...prev, values: arr }));
                  }} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Açıklama</Label>
                <Textarea value={v.description} onChange={e => {
                  const arr = [...content.values]; arr[i] = { ...arr[i], description: e.target.value };
                  setContent(prev => ({ ...prev, values: arr }));
                }} rows={2} />
              </div>
            </div>
          ))}
          {content.values.length < 6 && (
            <Button variant="outline" size="sm" onClick={() => setContent(p => ({ ...p, values: [...p.values, { icon: "sparkles", title: "", description: "" }] }))}>
              <Plus className="h-4 w-4 mr-1" /> Değer Ekle
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Team Section */}
      <Card>
        <CardHeader><CardTitle>Ekip Bölümü</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bölüm Başlığı</Label>
            <Input value={content.team_title} onChange={e => setContent(p => ({ ...p, team_title: e.target.value }))} />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea value={content.team_description} onChange={e => setContent(p => ({ ...p, team_description: e.target.value }))} rows={3} />
          </div>
          <div>
            <Label>Ekip Görselleri</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
              {content.team_images.map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={img} alt={`Ekip ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setContent(p => ({ ...p, team_images: p.team_images.filter((_, idx) => idx !== i) }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <input type="file" accept="image/*" className="hidden" id={`team-img-${i}`} onChange={e => handleTeamImageUpload(e, i)} />
                  <label htmlFor={`team-img-${i}`} className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Değiştir</span>
                  </label>
                </div>
              ))}
              {content.team_images.length < 6 && (
                <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <input type="file" accept="image/*" className="hidden" id="team-img-new" onChange={e => handleTeamImageUpload(e)} />
                  <label htmlFor="team-img-new" className="cursor-pointer flex flex-col items-center gap-1 text-muted-foreground">
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">Ekle</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAbout;
