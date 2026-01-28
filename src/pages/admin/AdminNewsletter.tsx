import { Mail, Trash2, Download, Loader2 } from "lucide-react";
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
  useNewsletterSubscribers,
  useUnsubscribeNewsletter,
  useDeleteNewsletterSubscriber,
} from "@/hooks/useNewsletter";
import { toast } from "sonner";

const AdminNewsletter = () => {
  const { data: subscribers, isLoading } = useNewsletterSubscribers();
  const unsubscribe = useUnsubscribeNewsletter();
  const deleteSubscriber = useDeleteNewsletterSubscriber();

  const activeSubscribers = subscribers?.filter((s) => s.is_active) || [];
  const inactiveSubscribers = subscribers?.filter((s) => !s.is_active) || [];

  const handleUnsubscribe = async (id: string) => {
    try {
      await unsubscribe.mutateAsync(id);
      toast.success("Abonelik iptal edildi");
    } catch (error) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu aboneyi silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteSubscriber.mutateAsync(id);
      toast.success("Abone silindi");
    } catch (error) {
      toast.error("Abone silinemedi");
    }
  };

  const handleExport = () => {
    if (!activeSubscribers.length) {
      toast.error("Dışa aktarılacak abone yok");
      return;
    }

    const csv = [
      "E-posta,Kayıt Tarihi",
      ...activeSubscribers.map(
        (s) => `${s.email},${new Date(s.subscribed_at).toLocaleDateString("tr-TR")}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter-aboneleri-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Aboneler dışa aktarıldı");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bülten Aboneleri</h1>
          <p className="text-muted-foreground">
            {activeSubscribers.length} aktif abone
          </p>
        </div>
        <Button onClick={handleExport} disabled={!activeSubscribers.length}>
          <Download className="h-4 w-4 mr-2" />
          CSV İndir
        </Button>
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
                  <TableHead>E-posta</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers?.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {subscriber.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(subscriber.subscribed_at).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      {subscriber.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">İptal Edilmiş</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {subscriber.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnsubscribe(subscriber.id)}
                          >
                            İptal Et
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(subscriber.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!subscribers || subscribers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Henüz abone yok
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
