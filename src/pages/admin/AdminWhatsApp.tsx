import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageSquare, Settings, Send, Loader2, CheckCircle, XCircle } from "lucide-react";

const AdminWhatsApp = () => {
  const queryClient = useQueryClient();
  const [testPhone, setTestPhone] = useState("");
  const [sending, setSending] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "whatsapp-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "whatsapp_settings")
        .maybeSingle();
      return (data?.value || { enabled: false, phone_number_id: "", access_token: "" }) as {
        enabled: boolean;
        phone_number_id: string;
        access_token: string;
      };
    },
  });

  const [form, setForm] = useState({
    enabled: false,
    phone_number_id: "",
    access_token: "",
  });

  // Sync form with loaded settings
  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled || false,
        phone_number_id: settings.phone_number_id || "",
        access_token: settings.access_token || "",
      });
    }
  }, [settings]);

  const { data: logs } = useQuery({
    queryKey: ["admin", "whatsapp-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("channel", "whatsapp")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "whatsapp_settings")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: values as any })
          .eq("key", "whatsapp_settings");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "whatsapp_settings", value: values as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-settings"] });
      toast.success("WhatsApp ayarları kaydedildi");
    },
    onError: (err: any) => {
      toast.error("Kaydetme hatası: " + err.message);
    },
  });

  const sendTest = async () => {
    if (!testPhone) {
      toast.error("Test telefon numarası girin");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-notify", {
        body: {
          type: "order_confirmation",
          phone: testPhone,
          data: {
            orderNumber: "TEST-001",
            customerName: "Test Kullanıcı",
            total: "100,00₺",
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Test mesajı gönderildi!");
      } else {
        const errMsg = data?.error_message || data?.result?.error?.message || "Mesaj gönderilemedi";
        console.error("WhatsApp API Error:", JSON.stringify(data, null, 2));
        toast.error(`Hata: ${errMsg}`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-logs"] });
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      toast.error(err.message || "Hata oluştu");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-green-500" />
          WhatsApp Bildirimler
        </h1>
        <p className="text-sm text-muted-foreground">Sipariş ve kargo bildirimlerini WhatsApp üzerinden gönderin</p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          <TabsTrigger value="logs">Gönderim Geçmişi</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Meta Business Suite üzerinden WhatsApp Business API yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>WhatsApp Bildirimleri</Label>
                  <p className="text-xs text-muted-foreground">Sipariş ve kargo bildirimlerini aktif et</p>
                </div>
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
                />
              </div>

              <div>
                <Label>Phone Number ID</Label>
                <Input
                  value={form.phone_number_id}
                  onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })}
                  placeholder="1027325807129390"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Meta Business Suite → WhatsApp → API Setup → Phone Number ID
                </p>
              </div>

              <div>
                <Label>Access Token</Label>
                <Input
                  type="password"
                  value={form.access_token}
                  onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                  placeholder="EAAG..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Meta Business Suite → System Users → Generate Token
                </p>
              </div>

              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Kaydet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Gönderimi</CardTitle>
              <CardDescription>Ülke kodu ile birlikte numara girin (ör: 905350582392)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="905350582392"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
                <Button onClick={sendTest} disabled={sending || !form.enabled}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {!form.enabled && (
                <p className="text-xs text-yellow-600">WhatsApp bildirimleri kapalı. Önce ayarları kaydedin.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Otomatik Bildirimler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Sipariş Onayı</p>
                  <p className="text-xs text-muted-foreground">Sipariş alındığında müşteriye bildirim</p>
                </div>
                <Badge variant="default">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Kargo Bildirimi</p>
                  <p className="text-xs text-muted-foreground">Kargo verildiğinde takip bilgisi</p>
                </div>
                <Badge variant="default">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Teslimat Onayı</p>
                  <p className="text-xs text-muted-foreground">Teslimat tamamlandığında</p>
                </div>
                <Badge variant="default">Aktif</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Alıcı</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.recipient}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.message_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.status === "sent" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Henüz gönderim yok
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWhatsApp;
