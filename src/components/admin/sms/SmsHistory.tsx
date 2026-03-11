import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface SmsHistoryItem {
  id: string;
  date: string;
  recipients: string[];
  message: string;
  status: "success" | "error";
  orderId?: string;
  errorCode?: number;
  errorMessage?: string;
}

const SMS_HISTORY_KEY = "ileti_merkezi_history";

const SmsHistory = () => {
  const [history, setHistory] = useState<SmsHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SMS_HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(SMS_HISTORY_KEY);
    setHistory([]);
    toast.success("Geçmiş temizlendi");
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Henüz SMS gönderilmemiş</p>
            <p className="text-sm mt-1">SMS gönderdiğinizde geçmiş burada görünecek.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{history.length} kayıt</p>
        <Button variant="outline" size="sm" onClick={clearHistory}>
          <Trash2 className="h-4 w-4 mr-2" />
          Geçmişi Temizle
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Alıcı</TableHead>
                <TableHead>Mesaj</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Sipariş ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(item.date), "dd.MM.yyyy HH:mm", { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.recipients.length} kişi</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {item.message}
                  </TableCell>
                  <TableCell>
                    {item.status === "success" ? (
                      <Badge variant="default">Gönderildi</Badge>
                    ) : (
                      <Badge variant="destructive" title={item.errorMessage}>
                        Hata {item.errorCode ? `(${item.errorCode})` : ""}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.orderId || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmsHistory;
