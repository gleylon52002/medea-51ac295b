import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Eye, Loader2, AlertTriangle, CheckCircle2, Users, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "./SmsSettings";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
}

const SmsSend = () => {
  const [phones, setPhones] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<"manual" | "users">("users");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");

  const settings = getSettings();
  const charCount = message.length;
  const smsCount = charCount === 0 ? 0 : charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-profiles-sms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, phone")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const usersWithPhone = users?.filter((u) => u.phone && u.phone.trim() !== "") || [];

  const filteredUsers = usersWithPhone.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("90")) cleaned = cleaned.slice(2);
    if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
    return cleaned;
  };

  const validatePhone = (phone: string): boolean => /^5\d{9}$/.test(phone);

  const getRecipientPhones = (): string[] => {
    if (sendMode === "users") {
      return Array.from(selectedUsers)
        .map((userId) => {
          const user = usersWithPhone.find((u) => u.user_id === userId);
          return user?.phone ? formatPhoneNumber(user.phone) : "";
        })
        .filter(validatePhone);
    }
    return phones
      .split(/[,\s\n]+/)
      .map((p) => formatPhoneNumber(p.trim()))
      .filter(validatePhone);
  };

  const validPhones = getRecipientPhones();
  const settingsComplete = Boolean(settings.fromNumber);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.user_id)));
    }
  };

  const handleSend = async () => {
    if (!settingsComplete) {
      toast.error("Twilio gönderici numarasını ayarlardan girin");
      return;
    }
    if (validPhones.length === 0) {
      toast.error("Geçerli telefon numarası seçin veya girin");
      return;
    }
    if (!message.trim()) {
      toast.error("Mesaj metni boş olamaz");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-sms", {
        body: {
          from: settings.fromNumber,
          to: validPhones,
          body: message.trim(),
        },
      });

      if (error) {
        toast.error(`Hata: ${error.message || "Edge function hatası"}`);
        return;
      }

      if (data?.success) {
        toast.success(data.message || `${validPhones.length} kişiye SMS gönderildi!`);
        setPhones("");
        setMessage("");
        setSelectedUsers(new Set());
        setShowPreview(false);
      } else {
        toast.error(data?.error || "SMS gönderilemedi");
      }
    } catch (err: any) {
      toast.error(`Beklenmeyen hata: ${err?.message}`);
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
            <p className="text-sm font-medium text-destructive">Twilio Ayarları Eksik</p>
            <p className="text-xs text-destructive/80">
              SMS göndermek için önce "Ayarlar" sekmesinden Twilio gönderici numaranızı girin.
            </p>
          </div>
        </div>
      )}

      {/* Mode Selection */}
      <div className="flex gap-2">
        <Button
          variant={sendMode === "users" ? "default" : "outline"}
          size="sm"
          onClick={() => setSendMode("users")}
        >
          <Users className="h-4 w-4 mr-2" />
          Kullanıcı Seç
        </Button>
        <Button
          variant={sendMode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setSendMode("manual")}
        >
          Manuel Numara Gir
        </Button>
      </div>

      {/* User Selection */}
      {sendMode === "users" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Alıcı Kullanıcılar
            </CardTitle>
            <CardDescription>Telefon numarası kayıtlı kullanıcıları seçin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim, e-posta veya telefon ile ara..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? "Tümünü Kaldır" : "Tümünü Seç"}
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Telefon numarası kayıtlı kullanıcı bulunamadı
              </p>
            ) : (
              <ScrollArea className="h-[250px] border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedUsers.has(user.user_id) ? "bg-primary/10" : ""
                      }`}
                      onClick={() => toggleUser(user.user_id)}
                    >
                      <Checkbox checked={selectedUsers.has(user.user_id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name || "İsimsiz"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {user.phone}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedUsers.size > 0 && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {selectedUsers.size} kullanıcı seçildi
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Phone Entry */}
      {sendMode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alıcılar</CardTitle>
            <CardDescription>
              Telefon numaralarını 5XXXXXXXXX formatında girin. Virgül veya yeni satır ile ayırın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              rows={4}
              placeholder={"5350000001\n5350000002, 5350000003"}
            />
          </CardContent>
        </Card>
      )}

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mesaj</CardTitle>
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
              <Badge variant={smsCount <= 1 ? "secondary" : "outline"}>{smsCount} SMS</Badge>
              {smsCount > 1 && <span className="text-orange-500">Uzun mesaj: {smsCount} SMS olarak gönderilecek</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Gönderim Önizleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Gönderici Numara</Label>
                <p className="font-medium">{settings.fromNumber || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Alıcı Sayısı</Label>
                <p className="font-medium">{validPhones.length} kişi</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">SMS Adedi</Label>
                <p className="font-medium">
                  {smsCount} × {validPhones.length} = {smsCount * validPhones.length} SMS
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mesaj</Label>
              <p className="mt-1 p-3 bg-background rounded border text-sm whitespace-pre-wrap">{message}</p>
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
          {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          {sending ? "Gönderiliyor..." : `SMS Gönder (${validPhones.length} kişi)`}
        </Button>
      </div>
    </div>
  );
};

export default SmsSend;
