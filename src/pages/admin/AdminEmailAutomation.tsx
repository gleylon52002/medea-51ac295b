import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Plus, Trash2, Loader2, Zap, Clock, Send } from "lucide-react";
import { toast } from "sonner";

interface EmailAutomation {
  id: string;
  name: string;
  trigger_type: string;
  delay_minutes: number;
  email_subject: string;
  email_body: string;
  is_active: boolean;
  sent_count: number;
  created_at: string;
}

const triggerLabels: Record<string, string> = {
  welcome: "Yeni Üye Kaydı",
  abandoned_cart: "Terk Edilmiş Sepet",
  post_purchase: "Sipariş Sonrası",
  birthday: "Doğum Günü",
  inactive_30d: "30 Gün İnaktif",
  review_request: "Yorum Talebi",
};

const presetFlows = [
  { name: "Hoşgeldin Serisi", trigger_type: "welcome", delay_minutes: 0, email_subject: "Hoş Geldiniz! 🎉", email_body: "Merhaba {musteri_adi},\n\nMEDEA ailesine hoş geldiniz! İlk alışverişinize özel %10 indirim kodu: HOSGELDIN\n\nDoğal bakım dünyasını keşfetmeye başlayın.\n\nSevgilerle,\nMEDEA" },
  { name: "Sepet Hatırlatma", trigger_type: "abandoned_cart", delay_minutes: 60, email_subject: "Sepetinizde ürünler bekliyor! 🛒", email_body: "Merhaba {musteri_adi},\n\nSepetinizde bıraktığınız ürünler hâlâ sizi bekliyor.\n\nHemen alışverişinizi tamamlayın, ücretsiz kargo fırsatını kaçırmayın!\n\nMEDEA" },
  { name: "Sipariş Teşekkür", trigger_type: "post_purchase", delay_minutes: 1440, email_subject: "Siparişiniz için teşekkürler! ❤️", email_body: "Merhaba {musteri_adi},\n\nSiparişiniz umarız elinize ulaşmıştır. Ürünlerimizden memnun kaldıysanız, yorum bırakmayı unutmayın!\n\nSonraki alışverişinizde %5 indirim kodu: TEKRAR5\n\nMEDEA" },
  { name: "Doğum Günü Tebriği", trigger_type: "birthday", delay_minutes: 0, email_subject: "Doğum Gününüz Kutlu Olsun! 🎂", email_body: "Sevgili {musteri_adi},\n\nDoğum gününüz kutlu olsun! 🎁\n\nSize özel %20 doğum günü indirimi: DOGUMGUNU\n\n7 gün geçerlidir.\n\nSevgilerle,\nMEDEA" },
  { name: "Seni Özledik", trigger_type: "inactive_30d", delay_minutes: 0, email_subject: "Sizi Özledik! 💫", email_body: "Merhaba {musteri_adi},\n\nSizi uzun süredir göremedik. Yeni ürünlerimizi ve kampanyalarımızı kaçırmayın!\n\nÖzel geri dönüş indirimi: %15 indirim kodu: GERIDON\n\nMEDEA" },
  { name: "Yorum Talebi", trigger_type: "review_request", delay_minutes: 4320, email_subject: "Ürünümüzü beğendiniz mi? ⭐", email_body: "Merhaba {musteri_adi},\n\nAlışverişinizden memnun kaldınız mı? Deneyiminizi diğer müşterilerimizle paylaşın!\n\nYorum yazanlar arasından her ay hediye çekilişi yapıyoruz.\n\nMEDEA" },
];

const AdminEmailAutomation = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", trigger_type: "welcome", delay_minutes: 0, email_subject: "", email_body: "" });

  const { data: automations, isLoading } = useQuery({
    queryKey: ["email-automations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_automations" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as EmailAutomation[];
    },
  });

  const createAutomation = useMutation({
    mutationFn: async (auto: any) => {
      const { error } = await supabase.from("email_automations" as any).insert(auto as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["email-automations"] }); toast.success("Otomasyon oluşturuldu"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("email_automations" as any).update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-automations"] }),
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_automations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["email-automations"] }); toast.success("Otomasyon silindi"); },
  });

  const handlePreset = (preset: typeof presetFlows[0]) => {
    createAutomation.mutate(preset);
  };

  const formatDelay = (minutes: number) => {
    if (minutes === 0) return "Anında";
    if (minutes < 60) return `${minutes} dk`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} saat`;
    return `${Math.round(minutes / 1440)} gün`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6" /> E-posta Otomasyonu</h1>
          <p className="text-muted-foreground">Otomatik e-posta akışları oluşturun — hoşgeldin, sepet hatırlatma, sipariş sonrası</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Yeni Otomasyon</Button>
      </div>

      {/* Preset Flows */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hazır Akışlar</CardTitle>
          <CardDescription>Tek tıkla önceden tanımlı e-posta otomasyonları ekleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {presetFlows.map((preset) => (
              <Button key={preset.name} variant="outline" size="sm" onClick={() => handlePreset(preset)} disabled={createAutomation.isPending} className="justify-start text-xs">
                <Mail className="h-3 w-3 mr-1 shrink-0" /> {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !automations?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz otomasyon yok. Hazır akışlardan birini ekleyin.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {automations.map((auto) => (
            <Card key={auto.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={auto.is_active} onCheckedChange={(checked) => toggleAutomation.mutate({ id: auto.id, is_active: checked })} />
                    <div>
                      <CardTitle className="text-base">{auto.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{triggerLabels[auto.trigger_type] || auto.trigger_type}</Badge>
                        <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{formatDelay(auto.delay_minutes)}</Badge>
                        <Badge variant="secondary" className="text-xs"><Send className="h-3 w-3 mr-1" />{auto.sent_count} gönderildi</Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAutomation.mutate(auto.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium">{auto.email_subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{auto.email_body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni E-posta Otomasyonu</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Otomasyon Adı</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tetikleyici</Label>
              <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gecikme (dakika)</Label>
              <Input type="number" value={form.delay_minutes} onChange={(e) => setForm({ ...form, delay_minutes: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>E-posta Konusu</Label>
              <Input value={form.email_subject} onChange={(e) => setForm({ ...form, email_subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>E-posta İçeriği</Label>
              <Textarea value={form.email_body} onChange={(e) => setForm({ ...form, email_body: e.target.value })} rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={() => createAutomation.mutate(form)} disabled={!form.name || !form.email_subject || createAutomation.isPending}>
              {createAutomation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailAutomation;
