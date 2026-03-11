import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Settings, Phone } from "lucide-react";
import { toast } from "sonner";

export interface TwilioSettings {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

const STORAGE_KEY = "twilio_settings";

const normalizeIntlPhone = (phone: string): string => {
  const cleaned = String(phone || "").replace(/\D/g, "");
  return cleaned ? `+${cleaned}` : "";
};

export const getSettings = (): TwilioSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { accountSid: "", authToken: "", fromNumber: "" };
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
    const normalizedFrom = normalizeIntlPhone(settings.fromNumber);

    if (!settings.accountSid || !settings.authToken || !normalizedFrom) {
      toast.error("Tüm alanları doldurun");
      return;
    }

    if (!settings.accountSid.startsWith("AC")) {
      toast.error("Account SID 'AC' ile başlamalıdır");
      return;
    }

    saveSettings({
      ...settings,
      fromNumber: normalizedFrom,
    });

    setSettings((prev) => ({
      ...prev,
      fromNumber: normalizedFrom,
    }));

    toast.success("Twilio ayarları kaydedildi");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Twilio SMS Ayarları
          </CardTitle>
          <CardDescription>
            console.twilio.com adresinden aldığınız bilgileri girin.
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary ml-1 underline"
            >
              Twilio Console →
            </a>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Account SID</Label>
            <Input
              type="password"
              value={settings.accountSid}
              onChange={(e) => setSettings({ ...settings, accountSid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Twilio Console ana sayfasında "Account SID" bölümünden kopyalayın.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Auth Token</Label>
            <Input
              type="password"
              value={settings.authToken}
              onChange={(e) => setSettings({ ...settings, authToken: e.target.value })}
              placeholder="Auth Token"
            />
            <p className="text-xs text-muted-foreground">
              Twilio Console ana sayfasında "Auth Token" bölümünden kopyalayın.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Twilio Telefon Numarası</Label>
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

          {settings.accountSid && settings.authToken && settings.fromNumber && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <Badge variant="outline" className="text-green-600 border-green-500">
                ✓ Ayarlar Tamamlandı
              </Badge>
              <p className="text-xs text-green-600">SMS gönderimine hazırsınız.</p>
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
