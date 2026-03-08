import { useState } from "react";
import { Mail, Trash2, Download, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useNewsletterSubscribers, useUnsubscribeNewsletter, useDeleteNewsletterSubscriber,
} from "@/hooks/useNewsletter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const newsletterTemplates = [
  { name: "Anneler Günü", subject: "💐 Anneler Günü'ne Özel İndirimler!", body: "Sevgili Abonemiz,\n\nAnneler Günü'ne özel %25'e varan indirimlerle en güzel hediyeleri keşfedin! Annenize doğal bakım ürünleriyle kendini özel hissettirin.\n\n🌸 Hediye önerileri ve kampanyalar sizi bekliyor!\n\nSevgilerle,\nMEDEA" },
  { name: "8 Mart Kadınlar Günü", subject: "✨ 8 Mart'a Özel — Kendinize Bir İyilik Yapın!", body: "Değerli Abonemiz,\n\n8 Mart Dünya Kadınlar Günü'nüz kutlu olsun! 🌺\n\nBu özel günde tüm ürünlerde %20 indirim sizi bekliyor. Kendinize bir iyilik yapın, doğal güzelliğinizi keşfedin.\n\nKod: KADIN8MART\n\nSevgilerle,\nMEDEA" },
  { name: "Black Friday", subject: "🖤 Black Friday Çılgınlığı Başladı!", body: "Merhaba,\n\n🔥 Black Friday kampanyamız başladı! Tüm ürünlerde %40'a varan indirimler sizi bekliyor.\n\nSınırlı stoklar tükenene kadar acele edin!\n\n⏰ Kampanya 3 gün sürecek.\n\nMEDEA" },
  { name: "Yılbaşı", subject: "🎄 Yılbaşı Hediye Rehberi — Sevdiklerinize En Güzel Hediye!", body: "Sevgili Abonemiz,\n\nYılbaşı yaklaşıyor! 🎁 Sevdiklerinize doğal ve özel hediyeler hazırladık.\n\nHediye paketleri ve özel yılbaşı setleri mağazamızda!\n\n%15 indirim kodu: YILBASI2025\n\nMutlu yıllar dileriz!\nMEDEA" },
  { name: "Sevgililer Günü", subject: "❤️ Sevgililer Günü'ne Özel Sürprizler!", body: "Merhaba,\n\n14 Şubat'a özel romantik hediye setleri hazırladık! 💝\n\nDoğal bakım ürünlerinden oluşan özel paketler ile sevdiklerinize en güzel hediyeyi verin.\n\nÜcretsiz hediye paketi + %10 indirim!\n\nSevgilerle,\nMEDEA" },
  { name: "Bahar Kampanyası", subject: "🌷 Bahar Geldi — Yeni Sezon Ürünleri Keşfedin!", body: "Merhaba,\n\nBaharın gelişiyle birlikte cildinizi yenileyin! 🌿\n\nYeni sezon ürünlerimiz ve bahar bakım önerileri bloğumuzda.\n\nİlk alışverişe özel %15 indirim.\n\nMEDEA" },
  { name: "Ramazan Bayramı", subject: "🌙 Ramazan Bayramınız Mübarek Olsun!", body: "Değerli Abonemiz,\n\nRamazan Bayramınızı en içten dileklerimizle kutlarız! 🕌\n\nBayrama özel hediye setlerimiz ve kampanyalar sizi bekliyor.\n\n%20 indirim kodu: BAYRAM\n\nHayırlı bayramlar,\nMEDEA" },
  { name: "Yaz İndirimi", subject: "☀️ Yaz Kampanyası — %30'a Varan İndirimler!", body: "Merhaba,\n\nYaz geldi, güneş koruma ve bakım zamanı! ☀️\n\nTüm güneş koruma ürünlerinde %30 indirim.\nYaz bakım setleri özel fiyatlarla!\n\nMEDEA" },
];

const AdminNewsletter = () => {
  const { data: subscribers, isLoading } = useNewsletterSubscribers();
  const unsubscribe = useUnsubscribeNewsletter();
  const deleteSubscriber = useDeleteNewsletterSubscriber();
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const activeSubscribers = subscribers?.filter((s) => s.is_active) || [];

  const handleUnsubscribe = async (id: string) => {
    try { await unsubscribe.mutateAsync(id); toast.success("Abonelik iptal edildi"); } catch { toast.error("Bir hata oluştu"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu aboneyi silmek istediğinizden emin misiniz?")) return;
    try { await deleteSubscriber.mutateAsync(id); toast.success("Abone silindi"); } catch { toast.error("Abone silinemedi"); }
  };

  const handleExport = () => {
    if (!activeSubscribers.length) { toast.error("Dışa aktarılacak abone yok"); return; }
    const csv = ["E-posta,Kayıt Tarihi", ...activeSubscribers.map(s => `${s.email},${new Date(s.subscribed_at).toLocaleDateString("tr-TR")}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter-aboneleri-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Aboneler dışa aktarıldı");
  };

  const handleSendBulk = async () => {
    if (!emailSubject || !emailBody) { toast.error("Konu ve içerik gerekli"); return; }
    if (activeSubscribers.length === 0) { toast.error("Aktif abone yok"); return; }

    setIsSending(true);
    let sent = 0;
    let failed = 0;

    for (const sub of activeSubscribers) {
      try {
        await supabase.functions.invoke("send-email", {
          body: { type: "newsletter_broadcast", to: sub.email, data: { subject: emailSubject, body: emailBody } },
        });
        sent++;
      } catch { failed++; }
    }

    setIsSending(false);
    toast.success(`${sent} mail gönderildi${failed > 0 ? `, ${failed} başarısız` : ""}`);
    setEmailDialog(false);
  };

  const handleSendTest = async () => {
    if (!testEmail || !emailSubject || !emailBody) { toast.error("Test e-postası, konu ve içerik gerekli"); return; }
    try {
      await supabase.functions.invoke("send-email", {
        body: { type: "newsletter_broadcast", to: testEmail, data: { subject: emailSubject, body: emailBody } },
      });
      toast.success("Test maili gönderildi");
    } catch { toast.error("Test maili gönderilemedi"); }
  };

  const applyTemplate = (template: typeof newsletterTemplates[0]) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bülten Aboneleri</h1>
          <p className="text-muted-foreground">{activeSubscribers.length} aktif abone</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEmailDialog(true)}>
            <Send className="h-4 w-4 mr-2" /> Toplu Mail Gönder
          </Button>
          <Button onClick={handleExport} disabled={!activeSubscribers.length}>
            <Download className="h-4 w-4 mr-2" /> CSV İndir
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
                  <TableCell><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{subscriber.email}</div></TableCell>
                  <TableCell>{new Date(subscriber.subscribed_at).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>{subscriber.is_active ? <Badge className="bg-green-100 text-green-800">Aktif</Badge> : <Badge variant="secondary">İptal Edilmiş</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {subscriber.is_active && <Button variant="ghost" size="sm" onClick={() => handleUnsubscribe(subscriber.id)}>İptal Et</Button>}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(subscriber.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!subscribers || subscribers.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Henüz abone yok</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Email Compose Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Toplu E-posta Gönder</DialogTitle></DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Hazır Şablonlar
              </Label>
              <div className="flex flex-wrap gap-2">
                {newsletterTemplates.map((t) => (
                  <Button key={t.name} variant="outline" size="sm" onClick={() => applyTemplate(t)} className="text-xs">
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Konu</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="E-posta konusu..." />
            </div>

            <div className="space-y-2">
              <Label>İçerik</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} placeholder="E-posta içeriği..." />
            </div>

            <div className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Test Maili Gönder</Label>
                <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@ornek.com" type="email" />
              </div>
              <Button variant="outline" size="sm" onClick={handleSendTest}>Test Gönder</Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>İptal</Button>
            <Button onClick={handleSendBulk} disabled={isSending || !emailSubject || !emailBody}>
              {isSending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Gönderiliyor...</> : <><Send className="h-4 w-4 mr-2" />{activeSubscribers.length} Aboneye Gönder</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNewsletter;
