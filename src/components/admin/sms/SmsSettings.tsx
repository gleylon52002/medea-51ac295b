import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface TwilioSettings {
  fromNumber: string;
}

const STORAGE_KEY = "twilio_settings_v2";

export const getSettings = (): TwilioSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { fromNumber: "" };
};

export const saveSettings = (settings: TwilioSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const SmsSettings = () => {
  const [settings, setSettings] = useState<TwilioSettings>(getSettings);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    const cleaned = String(settings.fromNumber || "").replace(/\s/g, "");
    if (!cleaned) {
      toast.error("Twilio telefon numarasını girin");
      return;
    }

    saveSettings({ fromNumber: cleaned });
    setSettings({ fromNumber: cleaned });
    toast.success("Twilio ayarları kaydedildi");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Twilio SMS Ayarları
          </CardTitle>
          <CardDescription>
            Twilio bağlantısı otomatik olarak yapılandırılmıştır. Sadece gönderici telefon numaranızı girin.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <Badge variant="outline" className="text-green-600 border-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Bağlı
            </Badge>
            <p className="text-xs text-green-600">
              Twilio API otomatik olarak bağlandı. Kimlik bilgileri güvenli şekilde saklanmaktadır.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Twilio Telefon Numarası (Gönderici)</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                value={settings.fromNumber}
                onChange={(e) => setSettings({ ...settings, fromNumber: e.target.value })}
                placeholder="+15017122661"
                className="max-w-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Twilio'dan aldığınız telefon numarası. E.164 formatında olmalı: +1xxxxxxxxxx
            </p>
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
