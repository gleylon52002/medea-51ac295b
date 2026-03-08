import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Trash2, RefreshCw, Loader2, Target, UserCheck, ShoppingCart, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Segment {
  id: string;
  name: string;
  description: string | null;
  segment_type: string;
  conditions: any[];
  user_count: number;
  is_active: boolean;
  created_at: string;
}

const presetSegments = [
  { name: "VIP Müşteriler", description: "3+ sipariş veren müşteriler", segment_type: "auto", conditions: [{ type: "min_orders", value: 3 }] },
  { name: "Yüksek Harcama", description: "Toplam 1000₺+ harcama yapanlar", segment_type: "auto", conditions: [{ type: "min_total_spent", value: 1000 }] },
  { name: "Kayıp Müşteriler", description: "Son 60 günde alışveriş yapmayanlar", segment_type: "auto", conditions: [{ type: "inactive_days", value: 60 }] },
  { name: "Yeni Üyeler", description: "Son 7 günde kayıt olanlar", segment_type: "auto", conditions: [{ type: "registered_within_days", value: 7 }] },
  { name: "Sepet Terk Edenler", description: "Sepetinde ürün olup sipariş vermeyenler", segment_type: "auto", conditions: [{ type: "abandoned_cart", value: 1 }] },
  { name: "Sadık Müşteriler", description: "Gold veya Platinum tier sadakat üyeleri", segment_type: "auto", conditions: [{ type: "loyalty_tier", value: "gold" }] },
];

const AdminSegments = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", segment_type: "manual", conditions: "[]" });

  const { data: segments, isLoading } = useQuery({
    queryKey: ["customer-segments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_segments" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Segment[];
    },
  });

  const createSegment = useMutation({
    mutationFn: async (seg: any) => {
      const { error } = await supabase.from("customer_segments" as any).insert(seg as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customer-segments"] }); toast.success("Segment oluşturuldu"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_segments" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customer-segments"] }); toast.success("Segment silindi"); },
  });

  const refreshCounts = useMutation({
    mutationFn: async () => {
      if (!segments) return;
      for (const seg of segments) {
        let count = 0;
        const conditions = seg.conditions || [];
        for (const cond of conditions) {
          if (cond.type === "min_orders") {
            const { count: c } = await supabase.from("orders").select("user_id", { count: "exact", head: true });
            count = c || 0;
          } else if (cond.type === "registered_within_days") {
            const since = new Date(); since.setDate(since.getDate() - cond.value);
            const { count: c } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since.toISOString());
            count = c || 0;
          } else if (cond.type === "abandoned_cart") {
            const { count: c } = await supabase.from("abandoned_cart_reminders").select("id", { count: "exact", head: true }).eq("recovered", false);
            count = c || 0;
          }
        }
        await supabase.from("customer_segments" as any).update({ user_count: count } as any).eq("id", seg.id);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customer-segments"] }); toast.success("Sayılar güncellendi"); },
  });

  const handleCreatePreset = (preset: typeof presetSegments[0]) => {
    createSegment.mutate({ name: preset.name, description: preset.description, segment_type: preset.segment_type, conditions: preset.conditions });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Müşteri Segmentasyonu</h1>
          <p className="text-muted-foreground">Kullanıcıları davranışlarına göre gruplandırın ve hedefli kampanyalar oluşturun</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refreshCounts.mutate()} disabled={refreshCounts.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshCounts.isPending ? "animate-spin" : ""}`} /> Sayıları Güncelle
          </Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Yeni Segment</Button>
        </div>
      </div>

      {/* Preset Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hazır Segmentler</CardTitle>
          <CardDescription>Tek tıkla önceden tanımlı müşteri grupları oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {presetSegments.map((preset) => (
              <Button key={preset.name} variant="outline" size="sm" onClick={() => handleCreatePreset(preset)} disabled={createSegment.isPending}>
                <Target className="h-3 w-3 mr-1" /> {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segments List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !segments?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Henüz segment oluşturulmamış. Hazır segmentlerden birini deneyin.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <Card key={seg.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{seg.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSegment.mutate(seg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {seg.description && <CardDescription>{seg.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{seg.user_count}</span>
                    <span className="text-sm text-muted-foreground">kullanıcı</span>
                  </div>
                  <Badge variant={seg.is_active ? "default" : "secondary"}>{seg.segment_type === "auto" ? "Otomatik" : "Manuel"}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {seg.conditions?.map((c: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{c.type}: {c.value}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Segment Oluştur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Segment Adı</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VIP Müşteriler" />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select value={form.segment_type} onValueChange={(v) => setForm({ ...form, segment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="auto">Otomatik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={() => createSegment.mutate({ name: form.name, description: form.description, segment_type: form.segment_type, conditions: [] })} disabled={!form.name || createSegment.isPending}>
              {createSegment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSegments;
