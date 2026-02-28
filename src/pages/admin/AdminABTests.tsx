import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FlaskConical, TrendingUp, Eye, Target, Trash2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type ABTest = Tables<"ab_tests">;

const AdminABTests = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    test_type: "banner",
    traffic_split: 50,
  });

  const { data: tests, isLoading } = useQuery({
    queryKey: ["admin", "ab-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ab_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ABTest[];
    },
  });

  const createTest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ab_tests").insert({
        name: form.name,
        description: form.description,
        test_type: form.test_type,
        traffic_split: form.traffic_split,
        variant_a: { label: "Kontrol" },
        variant_b: { label: "Varyant" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ab-tests"] });
      toast.success("A/B test oluşturuldu");
      setDialogOpen(false);
      setForm({ name: "", description: "", test_type: "banner", traffic_split: 50 });
    },
    onError: () => toast.error("Oluşturulamadı"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ab_tests").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "ab-tests"] }),
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ab_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ab-tests"] });
      toast.success("Test silindi");
    },
  });

  const getConversionRate = (impressions: number, conversions: number) => {
    if (impressions === 0) return "0.0";
    return ((conversions / impressions) * 100).toFixed(1);
  };

  const getWinner = (test: ABTest) => {
    const rateA = test.impressions_a > 0 ? test.conversions_a / test.impressions_a : 0;
    const rateB = test.impressions_b > 0 ? test.conversions_b / test.impressions_b : 0;
    if (rateA === rateB || (test.impressions_a < 100 && test.impressions_b < 100)) return null;
    return rateA > rateB ? "A" : "B";
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-7 w-7" />
            A/B Test Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">Site öğelerini test edin ve dönüşümleri optimize edin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Yeni Test</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni A/B Test Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Test Adı</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Banner CTA Testi" />
              </div>
              <div>
                <Label>Açıklama</Label>
                <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Test amacı ve detayları" rows={2} />
              </div>
              <div>
                <Label>Test Türü</Label>
                <Select value={form.test_type} onValueChange={(v) => setForm(p => ({ ...p, test_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="button">Buton</SelectItem>
                    <SelectItem value="layout">Sayfa Düzeni</SelectItem>
                    <SelectItem value="pricing">Fiyatlandırma</SelectItem>
                    <SelectItem value="copy">Metin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trafik Dağılımı (A: %{form.traffic_split} / B: %{100 - form.traffic_split})</Label>
                <Input type="range" min="10" max="90" value={form.traffic_split} onChange={(e) => setForm(p => ({ ...p, traffic_split: parseInt(e.target.value) }))} />
              </div>
              <Button onClick={() => createTest.mutate()} disabled={!form.name || createTest.isPending} className="w-full">Oluştur</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Yükleniyor...</p>
      ) : !tests?.length ? (
        <Card className="p-8 text-center">
          <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Henüz A/B test oluşturulmamış</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => {
            const winner = getWinner(test);
            return (
              <Card key={test.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <Badge variant={test.is_active ? "default" : "secondary"}>
                      {test.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                    <Badge variant="outline">{test.test_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={test.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: test.id, is_active: v })} />
                    <Button variant="ghost" size="icon" onClick={() => deleteTest.mutate(test.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.description && <p className="text-sm text-muted-foreground mb-4">{test.description}</p>}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${winner === "A" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Varyant A (Kontrol)</span>
                        {winner === "A" && <Badge className="bg-green-500">Kazanan</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Eye className="h-3 w-3" />Gösterim</p>
                          <p className="font-bold">{test.impressions_a.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Target className="h-3 w-3" />Dönüşüm</p>
                          <p className="font-bold">{test.conversions_a.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" />Oran</p>
                          <p className="font-bold">%{getConversionRate(test.impressions_a, test.conversions_a)}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${winner === "B" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Varyant B</span>
                        {winner === "B" && <Badge className="bg-green-500">Kazanan</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Eye className="h-3 w-3" />Gösterim</p>
                          <p className="font-bold">{test.impressions_b.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Target className="h-3 w-3" />Dönüşüm</p>
                          <p className="font-bold">{test.conversions_b.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" />Oran</p>
                          <p className="font-bold">%{getConversionRate(test.impressions_b, test.conversions_b)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Trafik: A %{test.traffic_split} / B %{100 - test.traffic_split}</span>
                    <span>Oluşturulma: {new Date(test.created_at).toLocaleDateString("tr-TR")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminABTests;
