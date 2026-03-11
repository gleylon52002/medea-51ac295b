import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Eye, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "./SmsSettings";

interface SmsHistoryItem {
  id: string;
  date: string;
  recipients: string[];
  message: string;
  status: "success" | "error";
  errorMessage?: string;
}

const SMS_HISTORY_KEY = "vatansms_history";

const getHistory = (): SmsHistoryItem[] => {
  try {
    const stored = localStorage.getItem(SMS_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

const addToHistory = (item: SmsHistoryItem) => {
  const history = getHistory();
  history.unshift(item);
  localStorage.setItem(SMS_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
};

const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("90")) cleaned = cleaned.slice(2);
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  return cleaned;
};

const validatePhone = (phone: string): boolean => {
  return /^5\d{9}$/.test(phone);
};

const SmsSend = () => {
  const [phones, setPhones] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const settings = getSettings();
  const charCount = message.length;
  const smsCount = charCount === 0 ? 0 : charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  const parsedPhones = phones
    .split(/[,\s\n]+/)
    .map((p) => formatPhoneNumber(p.trim()))
    .filter(Boolean);

  const validPhones = parsedPhones.filter(validatePhone);
  const invalidPhones = parsedPhones.filter((p) => p && !validatePhone(p));

  const settingsComplete = settings.apiId && settings.apiKey && settings.sender;

  const handleSend = async () => {
    if (!settingsComplete) {
      toast.error("API ayarlarını önce tamamlayın");
      return;
    }
    if (validPhones.length === 0) {
      toast.error("Geçerli telefon numarası giriniz");
      return;
    }
    if (!message.trim()) {
      toast.error("Mesaj metni boş olamaz");
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("ileti-merkezi-sms", {
        body: {
          api_id: settings.apiId,
          api_key: settings.apiKey,
          sender: settings.sender,
          message: message,
          phones: validPhones,
          message_content_type: settings.messageContentType,
        },
      });

      if (error) {
        toast.error(`Hata: ${error.message}`);
        addToHistory({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          recipients: validPhones,
          message,
          status: "error",
          errorMessage: error.message,
        });
        return;
      }

      if (data?.success) {
        toast.success("SMS başarıyla gönderildi!", { duration: 5000 });
        addToHistory({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          recipients: validPhones,
          message,
          status: "success",
        });
        setPhones("");
        setMessage("");
        setShowPreview(false);
      } else {
        toast.error(`Hata: ${data?.error}`, { duration: 8000 });
        addToHistory({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          recipients: validPhones,
          message,
          status: "error",
          errorMessage: data?.error,
        });
      }
    } catch (err: any) {
      toast.error(`Beklenmeyen hata: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {!settingsComplete && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">API Ayarları Eksik</p>
            <p className="text-xs text-destructive/80">
              SMS göndermek için önce "Ayarlar" sekmesinden VatanSMS API bilgilerinizi girin.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alıcılar</CardTitle>
          <CardDescription>
            Telefon numaralarını 5XXXXXXXXX formatında girin. Birden fazla numara için virgül veya yeni satır kullanın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={phones}
            onChange={(e) => setPhones(e.target.value)}
            rows={4}
            placeholder={"5350000001\n5350000002, 5350000003"}
          />
          <div className="flex flex-wrap gap-2 text-xs">
            {validPhones.length > 0 && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {validPhones.length} geçerli numara
              </Badge>
            )}
            {invalidPhones.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {invalidPhones.length} geçersiz: {invalidPhones.join(", ")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mesaj</CardTitle>
          <CardDescription>Göndermek istediğiniz SMS metnini yazın.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Merhaba, MEDEA'dan özel bir teklifimiz var..."
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{charCount} karakter</span>
            <div className="flex gap-3">
              <Badge variant={smsCount <= 1 ? "secondary" : "outline"}>
                {smsCount} SMS
              </Badge>
              {smsCount > 1 && (
                <span className="text-orange-500">Uzun mesaj: {smsCount} SMS olarak gönderilecek</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Gönderim Önizleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Gönderici</Label>
                <p className="font-medium">{settings.sender || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Alıcı Sayısı</Label>
                <p className="font-medium">{validPhones.length} kişi</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">SMS Adedi</Label>
                <p className="font-medium">{smsCount} × {validPhones.length} = {smsCount * validPhones.length} SMS</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mesaj Tipi</Label>
                <p className="font-medium">{settings.messageContentType === "bilgi" ? "Bilgi" : "Ticari"}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mesaj</Label>
              <p className="mt-1 p-3 bg-background rounded border text-sm">{message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          disabled={!message || validPhones.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? "Önizlemeyi Kapat" : "Önizle"}
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !settingsComplete || validPhones.length === 0 || !message.trim()}
          size="lg"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {sending ? "Gönderiliyor..." : "SMS Gönder"}
        </Button>
      </div>
    </div>
  );
};

export default SmsSend;
