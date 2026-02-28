import { useState } from "react";
import { Bell, Send, Users, Smartphone, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePushNotifications, useSendPushNotification, useDeviceTokenStats } from "@/hooks/usePushNotifications";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const AdminPushNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "targeted">("all");
  const [targetUserIds, setTargetUserIds] = useState("");

  const { data: notifications, isLoading } = usePushNotifications();
  const { data: deviceCount } = useDeviceTokenStats();
  const sendMutation = useSendPushNotification();

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;

    const payload: any = { title, message, target_type: targetType };
    if (targetType === "targeted" && targetUserIds.trim()) {
      payload.target_user_ids = targetUserIds.split(",").map((id) => id.trim());
    }

    sendMutation.mutate(payload, {
      onSuccess: () => {
        setTitle("");
        setMessage("");
        setTargetUserIds("");
      },
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-primary/10 text-primary"><CheckCircle className="h-3 w-3 mr-1" />Gönderildi</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Başarısız</Badge>;
      case "no_devices":
        return <Badge variant="secondary">Cihaz Yok</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Bekliyor</Badge>;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Push Bildirimler</h1>
          <p className="text-muted-foreground text-sm">Kullanıcılara mobil bildirim gönderin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{deviceCount ?? 0}</p>
                <p className="text-sm text-muted-foreground">Kayıtlı Cihaz</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{notifications?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Toplam Bildirim</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-accent-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {notifications?.reduce((sum, n) => sum + n.sent_count, 0) ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">Toplam Teslimat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Form */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Bildirim Gönder</CardTitle>
          <CardDescription>Tüm kullanıcılara veya belirli kullanıcılara bildirim gönderin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Başlık</label>
              <Input
                placeholder="Bildirim başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hedef</label>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  <SelectItem value="targeted">Belirli Kullanıcılar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "targeted" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Kullanıcı ID'leri (virgülle ayırın)</label>
              <Input
                placeholder="user-id-1, user-id-2"
                value={targetUserIds}
                onChange={(e) => setTargetUserIds(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Mesaj</label>
            <Textarea
              placeholder="Bildirim mesajı..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!title.trim() || !message.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Bildirim Gönder
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !notifications?.length ? (
            <p className="text-center text-muted-foreground py-8">Henüz bildirim gönderilmedi</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Mesaj</TableHead>
                    <TableHead>Hedef</TableHead>
                    <TableHead>Teslimat</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{n.message}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {n.target_type === "all" ? "Tümü" : `${n.target_user_ids?.length || 0} kişi`}
                        </Badge>
                      </TableCell>
                      <TableCell>{n.sent_count}</TableCell>
                      <TableCell>{statusBadge(n.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {n.sent_at ? format(new Date(n.sent_at), "dd MMM yyyy HH:mm", { locale: tr }) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPushNotifications;
