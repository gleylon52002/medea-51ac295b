import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Palette, RefreshCw } from "lucide-react";

interface ThemeSettings {
  primary_hue: number;
  primary_saturation: number;
  primary_lightness: number;
  accent_hue: number;
  accent_saturation: number;
  accent_lightness: number;
}

const defaultTheme: ThemeSettings = {
  primary_hue: 150,
  primary_saturation: 25,
  primary_lightness: 25,
  accent_hue: 20,
  accent_saturation: 50,
  accent_lightness: 55,
};

const presetThemes = [
  { name: "Zeytin (Varsayılan)", primary: { h: 150, s: 25, l: 25 }, accent: { h: 20, s: 50, l: 55 } },
  { name: "Okyanus", primary: { h: 200, s: 60, l: 35 }, accent: { h: 40, s: 80, l: 50 } },
  { name: "Gül", primary: { h: 350, s: 50, l: 45 }, accent: { h: 30, s: 60, l: 50 } },
  { name: "Mor", primary: { h: 270, s: 50, l: 40 }, accent: { h: 45, s: 70, l: 55 } },
  { name: "Altın", primary: { h: 40, s: 70, l: 35 }, accent: { h: 15, s: 60, l: 50 } },
  { name: "Gece", primary: { h: 220, s: 40, l: 25 }, accent: { h: 200, s: 50, l: 55 } },
];

const AdminTheme = () => {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [previewActive, setPreviewActive] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "theme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "theme")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as ThemeSettings | undefined;
    },
  });

  useEffect(() => {
    if (settings) {
      setTheme(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (previewActive) {
      applyThemeToDocument(theme);
    }
  }, [theme, previewActive]);

  const applyThemeToDocument = (t: ThemeSettings) => {
    document.documentElement.style.setProperty('--primary', `${t.primary_hue} ${t.primary_saturation}% ${t.primary_lightness}%`);
    document.documentElement.style.setProperty('--olive', `${t.primary_hue} ${t.primary_saturation}% ${t.primary_lightness}%`);
    document.documentElement.style.setProperty('--olive-light', `${t.primary_hue} ${Math.max(t.primary_saturation - 5, 0)}% ${Math.min(t.primary_lightness + 15, 100)}%`);
    document.documentElement.style.setProperty('--accent', `${t.accent_hue} ${t.accent_saturation}% ${t.accent_lightness}%`);
    document.documentElement.style.setProperty('--terracotta', `${t.accent_hue} ${t.accent_saturation}% ${t.accent_lightness}%`);
    document.documentElement.style.setProperty('--ring', `${t.primary_hue} ${t.primary_saturation}% ${t.primary_lightness}%`);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: theme as any })
        .eq("key", "theme");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "theme-settings"] });
      toast.success("Tema kaydedildi");
      setPreviewActive(false);
    },
    onError: () => {
      toast.error("Kaydetme başarısız");
    },
  });

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setTheme({
      primary_hue: preset.primary.h,
      primary_saturation: preset.primary.s,
      primary_lightness: preset.primary.l,
      accent_hue: preset.accent.h,
      accent_saturation: preset.accent.s,
      accent_lightness: preset.accent.l,
    });
    setPreviewActive(true);
  };

  const resetToDefault = () => {
    setTheme(defaultTheme);
    setPreviewActive(true);
  };

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
        <h1 className="font-serif text-3xl font-bold text-foreground">Tema Ayarları</h1>
        <p className="text-muted-foreground mt-1">Site renklerini özelleştirin</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Hazır Temalar
            </CardTitle>
            <CardDescription>Hızlıca bir tema seçin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-4 rounded-lg border border-border hover:border-primary transition-colors text-left"
                >
                  <div className="flex gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.primary.h}, ${preset.primary.s}%, ${preset.primary.l}%)` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.accent.h}, ${preset.accent.s}%, ${preset.accent.l}%)` }}
                    />
                  </div>
                  <p className="text-sm font-medium">{preset.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Önizleme</CardTitle>
            <CardDescription>Tema değişikliklerini görün</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="p-6 rounded-lg"
              style={{ backgroundColor: `hsl(${theme.primary_hue}, ${theme.primary_saturation}%, ${theme.primary_lightness}%)` }}
            >
              <p className="text-white font-medium">Ana Renk (Primary)</p>
              <p className="text-white/80 text-sm">Butonlar, linkler, navbar</p>
            </div>
            <div 
              className="p-6 rounded-lg"
              style={{ backgroundColor: `hsl(${theme.accent_hue}, ${theme.accent_saturation}%, ${theme.accent_lightness}%)` }}
            >
              <p className="text-white font-medium">Vurgu Rengi (Accent)</p>
              <p className="text-white/80 text-sm">İkonlar, badge'ler, vurgular</p>
            </div>
            <div className="flex gap-2">
              <Button
                style={{ 
                  backgroundColor: `hsl(${theme.primary_hue}, ${theme.primary_saturation}%, ${theme.primary_lightness}%)`,
                  color: 'white'
                }}
              >
                Örnek Buton
              </Button>
              <Button variant="outline">
                Outline Buton
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Özel Ayarlar</CardTitle>
            <CardDescription>Renkleri manuel olarak ayarlayın (HSL değerleri)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Ana Renk (Primary)</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Ton (Hue): {theme.primary_hue}°</Label>
                    </div>
                    <Slider
                      value={[theme.primary_hue]}
                      onValueChange={([v]) => {
                        setTheme({ ...theme, primary_hue: v });
                        setPreviewActive(true);
                      }}
                      max={360}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Doygunluk: {theme.primary_saturation}%</Label>
                    </div>
                    <Slider
                      value={[theme.primary_saturation]}
                      onValueChange={([v]) => {
                        setTheme({ ...theme, primary_saturation: v });
                        setPreviewActive(true);
                      }}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Parlaklık: {theme.primary_lightness}%</Label>
                    </div>
                    <Slider
                      value={[theme.primary_lightness]}
                      onValueChange={([v]) => {
                        setTheme({ ...theme, primary_lightness: v });
                        setPreviewActive(true);
                      }}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Vurgu Rengi (Accent)</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Ton (Hue): {theme.accent_hue}°</Label>
                    </div>
                    <Slider
                      value={[theme.accent_hue]}
                      onValueChange={([v]) => {
                        setTheme({ ...theme, accent_hue: v });
                        setPreviewActive(true);
                      }}
                      max={360}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Doygunluk: {theme.accent_saturation}%</Label>
                    </div>
                    <Slider
                      value={[theme.accent_saturation]}
                      onValueChange={([v]) => {
                        setTheme({ ...theme, accent_saturation: v });
                        setPreviewActive(true);
                      }}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Parlaklık: {theme.accent_lightness}%</Label>
                    </div>
                    <Slider
                      value={[theme.accent_lightness]}
                      onValueChange={([v]) => {
                        setTheme({ ...theme, accent_lightness: v });
                        setPreviewActive(true);
                      }}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetToDefault}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Varsayılana Dön
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Kaydediliyor..." : "Temayı Kaydet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTheme;
