import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

export interface VatanSmsSettings {
  apiId: string;
  apiKey: string;
  sender: string;
  messageContentType: "bilgi" | "ticari";
}

const STORAGE_KEY = "vatansms_settings";

export const getSettings = (): VatanSmsSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { apiId: "", apiKey: "", sender: "", messageContentType: "bilgi" };
};

export const saveSettings = (settings: VatanSmsSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const SmsSettings = () => {
  const [settings, setSettings] = useState<VatanSmsSettings>(getSettings);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    if (!settings.apiId || !settings.apiKey || !settings.sender) {
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
            VatanSMS API Ayarları
          </CardTitle>
          <CardDescription>
            vatansms.net hesabınızdan aldığınız API bilgilerini girin.
            <a href="https://vatansms.net" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 underline">
              Hesap Oluştur →
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API ID</Label>
              <Input
                type="password"
                value={settings.apiId}
                onChange={(e) => setSettings({ ...settings, apiId: e.target.value })}
                placeholder="API ID'niz"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="API Key'iniz"
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
              VatanSMS panelinde tanımlı başlık adınızı yazın.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mesaj Tipi</Label>
            <Select
              value={settings.messageContentType}
              onValueChange={(val) => setSettings({ ...settings, messageContentType: val as "bilgi" | "ticari" })}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bilgi">Bilgi (Bilgilendirme SMS)</SelectItem>
                <SelectItem value="ticari">Ticari (Kampanya SMS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
