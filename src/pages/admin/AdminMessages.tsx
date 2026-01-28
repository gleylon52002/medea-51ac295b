import { useState } from "react";
import { Mail, MailOpen, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ContactMessage,
} from "@/hooks/useContactMessages";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

const AdminMessages = () => {
  const { data: messages, isLoading } = useContactMessages();
  const markRead = useMarkMessageRead();
  const markReplied = useMarkMessageReplied();
  const deleteMessage = useDeleteContactMessage();

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      await markRead.mutateAsync(message.id);
    }
  };

  const handleMarkReplied = async (id: string) => {
    try {
      await markReplied.mutateAsync(id);
      toast.success("Yanıtlandı olarak işaretlendi");
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu mesajı silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteMessage.mutateAsync(id);
      setSelectedMessage(null);
      toast.success("Mesaj silindi");
    } catch (error) {
      toast.error("Mesaj silinemedi");
    }
  };

  const unreadCount = messages?.filter((m) => !m.is_read).length || 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          Mesajlar
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} yeni</Badge>
          )}
        </h1>
        <p className="text-muted-foreground">İletişim formundan gelen mesajlar</p>
      </div>

      {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-background rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Gönderen</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages?.map((message) => (
                  <TableRow
                    key={message.id}
                    className={!message.is_read ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      {message.is_read ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className={!message.is_read ? "font-medium" : ""}>
                          {message.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {message.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className={!message.is_read ? "font-medium" : ""}>
                      {message.subject}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </TableCell>
                    <TableCell>
                      {message.replied_at ? (
                        <Badge variant="outline" className="text-green-600">
                          Yanıtlandı
                        </Badge>
                      ) : message.is_read ? (
                        <Badge variant="outline">Okundu</Badge>
                      ) : (
                        <Badge>Yeni</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewMessage(message)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(message.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!messages || messages.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Henüz mesaj yok
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Mesaj Detayı</DialogTitle>
            </DialogHeader>

            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Gönderen</p>
                    <p className="font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">E-posta</p>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Konu</p>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Tarih</p>
                    <p className="font-medium">
                      {new Date(selectedMessage.created_at).toLocaleString("tr-TR")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2">Mesaj</p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      asChild
                    >
                      <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        E-posta Gönder
                      </a>
                    </Button>
                    {!selectedMessage.replied_at && (
                      <Button onClick={() => handleMarkReplied(selectedMessage.id)}>
                        Yanıtlandı İşaretle
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default AdminMessages;
