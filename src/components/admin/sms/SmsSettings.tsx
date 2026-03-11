import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Settings, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

export interface IletiMerkeziSettings {
  apiKey: string;
  apiHash: string;
  sender: string;
  iysEnabled: boolean;
  iysList: "BIREYSEL" | "TACIR";
}

const STORAGE_KEY = "ileti_merkezi_settings";

export const getSettings = (): IletiMerkeziSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { apiKey: "", apiHash: "", sender: "", iysEnabled: true, iysList: "BIREYSEL" };
};

export const saveSettings = (settings: IletiMerkeziSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const SmsSettings = () => {
  const [settings, setSettings] = useState<IletiMerkeziSettings>(getSettings);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    if (!settings.apiKey || !settings.apiHash || !settings.sender) {
      toast.error("Tüm alanları doldurun");
      return;
    }
    if (settings.sender.length > 11) {
      toast.error("Gönderici adı en fazla 11 karakter olabilir");
      return;
    }
    saveSettings(settings);
    toast.success("Ayarlar kaydedildi");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            İleti Merkezi API Ayarları
          </CardTitle>
          <CardDescription>
            iletimerkezi.com hesabınızdan aldığınız API bilgilerini girin.
            <a href="https://www.iletimerkezi.com" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 underline">
              Hesap Oluştur →
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="API anahtarınız"
              />
            </div>
            <div className="space-y-2">
              <Label>API Hash</Label>
              <Input
                type="password"
                value={settings.apiHash}
                onChange={(e) => setSettings({ ...settings, apiHash: e.target.value })}
                placeholder="API hash değeriniz"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gönderici Adı (Başlık)</Label>
            <div className="flex items-center gap-2">
              <Input
                value={settings.sender}
                onChange={(e) => setSettings({ ...settings, sender: e.target.value.slice(0, 11) })}
                placeholder="MEDEA"
                maxLength={11}
                className="max-w-xs"
              />
              <Badge variant="outline">{settings.sender.length}/11</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              İleti Merkezi panelinde tanımlı başlık adınızı yazın.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IYS (İleti Yönetim Sistemi)
          </CardTitle>
          <CardDescription>
            Ticari SMS gönderimleri için IYS zorunludur. Kapatırsanız yalnızca bilgilendirme SMS'leri gönderebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>IYS Sorgulaması</Label>
              <p className="text-xs text-muted-foreground">Ticari mesajlar için açık olmalıdır</p>
            </div>
            <Switch
              checked={settings.iysEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, iysEnabled: checked })}
            />
          </div>

          {!settings.iysEnabled && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">IYS Kapalı!</p>
                <p className="text-xs text-destructive/80">
                  IYS kapalıyken ticari SMS göndermek yasalara aykırıdır. Yalnızca bilgilendirme amaçlı mesajlar gönderebilirsiniz.
                </p>
              </div>
            </div>
          )}

          {settings.iysEnabled && (
            <div className="space-y-2">
              <Label>IYS Listesi</Label>
              <Select
                value={settings.iysList}
                onValueChange={(val) => setSettings({ ...settings, iysList: val as "BIREYSEL" | "TACIR" })}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIREYSEL">Bireysel</SelectItem>
                  <SelectItem value="TACIR">Tacir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Ayarları Kaydet
        </Button>
      </div>
    </div>
  );
};

export default SmsSettings;
