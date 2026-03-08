import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Trash2, Loader2, Hash, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  color: string;
  is_completed: boolean;
  campaign_id: string | null;
}

const presetEvents = [
  { title: "Yılbaşı Kampanyası", event_date: "2026-12-25", event_type: "campaign", color: "#dc2626" },
  { title: "Sevgililer Günü", event_date: "2026-02-14", event_type: "campaign", color: "#ec4899" },
  { title: "8 Mart Kadınlar Günü", event_date: "2026-03-08", event_type: "campaign", color: "#a855f7" },
  { title: "Anneler Günü", event_date: "2026-05-10", event_type: "campaign", color: "#f59e0b" },
  { title: "Babalar Günü", event_date: "2026-06-21", event_type: "campaign", color: "#3b82f6" },
  { title: "Black Friday", event_date: "2026-11-27", event_type: "campaign", color: "#1f2937" },
  { title: "11.11 İndirim Festivali", event_date: "2026-11-11", event_type: "campaign", color: "#f97316" },
  { title: "Ramazan Bayramı", event_date: "2026-03-30", event_type: "campaign", color: "#059669" },
  { title: "Kurban Bayramı", event_date: "2026-06-06", event_type: "campaign", color: "#059669" },
  { title: "Yaz İndirimi Başlangıç", event_date: "2026-06-01", event_type: "campaign", color: "#eab308" },
];

const AdminCampaignCalendar = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hashtagDialog, setHashtagDialog] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", event_type: "campaign", color: "#8B7355" });

  const { data: events, isLoading } = useQuery({
    queryKey: ["campaign-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaign_calendar" as any).select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data as unknown as CalendarEvent[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (evt: any) => {
      const { error } = await supabase.from("campaign_calendar" as any).insert(evt as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["campaign-calendar"] }); toast.success("Etkinlik eklendi"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from("campaign_calendar" as any).update({ is_completed } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaign-calendar"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaign_calendar" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["campaign-calendar"] }); toast.success("Etkinlik silindi"); },
  });

  const generateHashtags = async () => {
    if (!hashtagInput.trim()) { toast.error("Ürün veya kampanya adı girin"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-ai-fill", {
        body: {
          prompt: `Şu ürün/kampanya için Instagram ve sosyal medya hashtag'leri üret (Türkçe ve İngilizce karışık, 15-20 adet). Sadece hashtag listesi ver, başka bir şey yazma. Ürün/Kampanya: ${hashtagInput}`,
          field: "hashtags",
        },
      });
      if (error) throw error;
      const text = data?.result || data?.content || "";
      const tags = text.match(/#\w+/g) || [];
      setGeneratedHashtags(tags.length > 0 ? tags : text.split("\n").filter((t: string) => t.trim()));
    } catch (err) {
      toast.error("Hashtag üretilemedi");
      setGeneratedHashtags(["#doğalbakım", "#ciltbakımı", "#skincare", "#organik", "#güzellik", "#beauty", "#naturalskincare", "#kozmetik", "#bakım", "#sağlıklıcilt", "#doğal", "#vegan", "#crueltyfree", "#türkkozmetik", "#handmade"]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyHashtags = () => {
    navigator.clipboard.writeText(generatedHashtags.join(" "));
    toast.success("Hashtag'ler kopyalandı!");
  };

  const months = events?.reduce((acc, evt) => {
    const month = format(new Date(evt.event_date), "MMMM yyyy", { locale: tr });
    if (!acc[month]) acc[month] = [];
    acc[month].push(evt);
    return acc;
  }, {} as Record<string, CalendarEvent[]>) || {};

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" /> Kampanya Takvimi</h1>
          <p className="text-muted-foreground">Yıl boyunca kampanyalarınızı planlayın ve hashtag'ler üretin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHashtagDialog(true)}>
            <Hash className="h-4 w-4 mr-2" /> Hashtag Üret
          </Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Etkinlik Ekle</Button>
        </div>
      </div>

      {/* Preset Events */}
      <Card>
        <CardHeader><CardTitle className="text-base">Hazır Etkinlikler</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {presetEvents.map((preset) => (
              <Button key={preset.title} variant="outline" size="sm" onClick={() => createEvent.mutate(preset)} disabled={createEvent.isPending} className="text-xs">
                <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: preset.color }} />
                {preset.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Events */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : Object.keys(months).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz etkinlik yok. Hazır etkinliklerden ekleyin.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(months).map(([month, evts]) => (
            <div key={month}>
              <h3 className="text-lg font-semibold mb-3 capitalize">{month}</h3>
              <div className="space-y-2">
                {evts.map((evt) => (
                  <div key={evt.id} className={`flex items-center justify-between p-3 rounded-lg border ${evt.is_completed ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: evt.color }} />
                      <div>
                        <p className={`font-medium text-sm ${evt.is_completed ? "line-through" : ""}`}>{evt.title}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(evt.event_date), "dd MMMM yyyy", { locale: tr })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleComplete.mutate({ id: evt.id, is_completed: !evt.is_completed })}>
                        <CheckCircle2 className={`h-4 w-4 ${evt.is_completed ? "text-green-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteEvent.mutate(evt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Etkinlik</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Başlık</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Açıklama</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tarih</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Renk</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={() => createEvent.mutate(form)} disabled={!form.title || !form.event_date || createEvent.isPending}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hashtag Generator Dialog */}
      <Dialog open={hashtagDialog} onOpenChange={setHashtagDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Hashtag Üretici</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ürün veya Kampanya Adı</Label>
              <Input value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} placeholder="Örn: Doğal cilt bakım seti, Black Friday..." />
            </div>
            <Button onClick={generateHashtags} disabled={isGenerating} className="w-full">
              {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Üretiliyor...</> : <><Hash className="h-4 w-4 mr-2" />Hashtag Üret</>}
            </Button>
            {generatedHashtags.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5 p-3 bg-muted/50 rounded-lg">
                  {generatedHashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <Button variant="outline" onClick={copyHashtags} className="w-full">Tümünü Kopyala</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCampaignCalendar;
