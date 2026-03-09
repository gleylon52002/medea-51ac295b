import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Calculator, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PricingRule {
  id: string;
  name: string;
  rule_type: string;
  applies_to: string;
  adjustment_type: string;
  adjustment_value: number;
  min_price: number | null;
  max_price: number | null;
  is_active: boolean;
  priority: number;
}

const AdminPricingRules = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [form, setForm] = useState({
    name: "",
    rule_type: "margin",
    applies_to: "all",
    adjustment_type: "percentage",
    adjustment_value: 0,
    min_price: "",
    max_price: "",
    priority: 0,
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["admin", "pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as PricingRule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (rule: Partial<PricingRule>) => {
      if (editingRule) {
        const { error } = await supabase.from("pricing_rules").update(rule as any).eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricing_rules").insert(rule as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing-rules"] });
      toast.success(editingRule ? "Kural güncellendi" : "Kural eklendi");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("İşlem başarısız"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing-rules"] });
      toast.success("Kural silindi");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from("pricing_rules").update({ is_active }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pricing-rules"] }),
  });

  const resetForm = () => {
    setForm({ name: "", rule_type: "margin", applies_to: "all", adjustment_type: "percentage", adjustment_value: 0, min_price: "", max_price: "", priority: 0 });
    setEditingRule(null);
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Kural adı zorunludur");
      return;
    }
    saveMutation.mutate({
      name: form.name,
      rule_type: form.rule_type,
      applies_to: form.applies_to,
      adjustment_type: form.adjustment_type,
      adjustment_value: form.adjustment_value,
      min_price: form.min_price ? parseFloat(form.min_price) : null,
      max_price: form.max_price ? parseFloat(form.max_price) : null,
      priority: form.priority,
    });
  };

  const ruleTypeLabels: Record<string, string> = {
    margin: "Maliyet + Marj",
    discount: "Yüzde İndirim",
    fixed_increase: "Sabit Artış",
    fixed_decrease: "Sabit Azaltma",
    competitor: "Rakip Fiyatı",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Otomatik Fiyatlandırma
          </h1>
          <p className="text-sm text-muted-foreground">Ürün fiyatlarını otomatik güncelleyen kurallar</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Yeni Kural</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? "Kural Düzenle" : "Yeni Fiyatlandırma Kuralı"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Kural Adı</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: %20 Marj" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kural Tipi</Label>
                  <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="margin">Maliyet + Marj</SelectItem>
                      <SelectItem value="discount">Yüzde İndirim</SelectItem>
                      <SelectItem value="fixed_increase">Sabit Artış</SelectItem>
                      <SelectItem value="fixed_decrease">Sabit Azaltma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Uygulama</Label>
                  <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Ürünler</SelectItem>
                      <SelectItem value="category">Kategori</SelectItem>
                      <SelectItem value="selected">Seçili Ürünler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ayarlama Tipi</Label>
                  <Select value={form.adjustment_type} onValueChange={(v) => setForm({ ...form, adjustment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Değer</Label>
                  <Input type="number" value={form.adjustment_value} onChange={(e) => setForm({ ...form, adjustment_value: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Fiyat (opsiyonel)</Label>
                  <Input type="number" value={form.min_price} onChange={(e) => setForm({ ...form, min_price: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Max Fiyat (opsiyonel)</Label>
                  <Input type="number" value={form.max_price} onChange={(e) => setForm({ ...form, max_price: e.target.value })} placeholder="∞" />
                </div>
              </div>
              <div>
                <Label>Öncelik (yüksek = önce uygulanır)</Label>
                <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingRule ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kural</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Uygulama</TableHead>
                <TableHead>Ayarlama</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell><Badge variant="outline">{ruleTypeLabels[rule.rule_type] || rule.rule_type}</Badge></TableCell>
                  <TableCell className="capitalize">{rule.applies_to === "all" ? "Tüm Ürünler" : rule.applies_to}</TableCell>
                  <TableCell>
                    {rule.adjustment_type === "percentage" ? `%${rule.adjustment_value}` : `₺${rule.adjustment_value}`}
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Switch checked={rule.is_active} onCheckedChange={(checked) => toggleActive.mutate({ id: rule.id, is_active: checked })} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Henüz fiyatlandırma kuralı eklenmemiş
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPricingRules;
