import { useState } from "react";
import { Mail, Trash2, Eye, Loader2, Reply, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useContactMessages,
  useMarkMessageRead,
  useMarkMessageReplied,
  useDeleteContactMessage,
} from "@/hooks/useContactMessages";
import { toast } from "sonner";

const AdminContactMessages = () => {
  const { data: messages, isLoading } = useContactMessages();
  const markRead = useMarkMessageRead();
  const markReplied = useMarkMessageReplied();
  const deleteMessage = useDeleteContactMessage();
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const filtered = messages?.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleView = (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      markRead.mutate(msg.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu mesajı silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteMessage.mutateAsync(id);
      toast.success("Mesaj silindi");
      setSelectedMessage(null);
    } catch {
      toast.error("Mesaj silinemedi");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">İletişim Mesajları</h1>
        <p className="text-muted-foreground mt-1">İletişim formundan gelen mesajlar</p>
      </div>

      <div className="relative max-w-sm">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Mesaj ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg border">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gönderen</TableHead>
                <TableHead>Konu</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((msg) => (
                <TableRow
                  key={msg.id}
                  className={!msg.is_read ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{msg.name}</p>
                      <p className="text-xs text-muted-foreground">{msg.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{msg.subject}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(msg.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    {msg.replied_at ? (
                      <Badge className="bg-green-100 text-green-800">Yanıtlandı</Badge>
                    ) : msg.is_read ? (
                      <Badge variant="secondary">Okundu</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">Yeni</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(msg)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(msg.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Mesaj bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gönderen:</span>{" "}
                    <span className="font-medium">{selectedMessage.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">E-posta:</span>{" "}
                    <a href={`mailto:${selectedMessage.email}`} className="text-primary underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`);
                      markReplied.mutate(selectedMessage.id);
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    E-posta ile Yanıtla
                  </Button>
                  {!selectedMessage.replied_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        markReplied.mutate(selectedMessage.id);
                        toast.success("Yanıtlandı olarak işaretlendi");
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Yanıtlandı İşaretle
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContactMessages;
