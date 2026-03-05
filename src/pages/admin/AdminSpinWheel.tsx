import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BarChart3, Settings2, Palette } from "lucide-react";
import {
  useSpinWheelAllConfigs,
  useSpinWheelAllSlices,
  useSpinWheelStats,
  SpinWheelConfig,
  SpinWheelSlice,
} from "@/hooks/useSpinWheel";

const AdminSpinWheel = () => {
  const queryClient = useQueryClient();
  const { data: configs, isLoading } = useSpinWheelAllConfigs();
  const config = configs?.[0];
  const { data: slices } = useSpinWheelAllSlices(config?.id);
  const { data: stats } = useSpinWheelStats();

  // Config form state
  const [configForm, setConfigForm] = useState({
    is_active: true,
    cooldown_hours: 24,
    coupon_prefix: "CARK",
    coupon_expiry_hours: 72,
    trigger_type: "scroll",
    trigger_delay_seconds: 30,
    trigger_scroll_percent: 50,
    center_color: "#2d4a3e",
    border_color: "#ffffff",
  });

  // Slice dialog
  const [sliceDialog, setSliceDialog] = useState(false);
  const [editingSlice, setEditingSlice] = useState<SpinWheelSlice | null>(null);
  const [sliceForm, setSliceForm] = useState({
    label: "",
    prize_type: "percentage",
    discount_value: 0,
    min_cart_amount: 0,
    probability: 10,
    color: "#FF6B6B",
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (config) {
      setConfigForm({
        is_active: config.is_active,
        cooldown_hours: config.cooldown_hours,
        coupon_prefix: config.coupon_prefix,
        coupon_expiry_hours: config.coupon_expiry_hours,
        trigger_type: config.trigger_type,
        trigger_delay_seconds: config.trigger_delay_seconds,
        trigger_scroll_percent: config.trigger_scroll_percent,
        center_color: config.center_color,
        border_color: config.border_color,
      });
    }
  }, [config]);

  const saveConfig = async () => {
    if (!config) return;
    const { error } = await supabase
      .from("spin_wheel_config")
      .update(configForm)
      .eq("id", config.id);
    if (error) {
      toast.error("Ayarlar kaydedilemedi");
    } else {
      toast.success("Çark ayarları güncellendi");
      queryClient.invalidateQueries({ queryKey: ["spin-wheel"] });
    }
  };

  const openSliceDialog = (slice?: SpinWheelSlice) => {
    if (slice) {
      setEditingSlice(slice);
      setSliceForm({
        label: slice.label,
        prize_type: slice.prize_type,
        discount_value: slice.discount_value,
        min_cart_amount: slice.min_cart_amount,
        probability: slice.probability,
        color: slice.color || "#FF6B6B",
        sort_order: slice.sort_order,
        is_active: slice.is_active ?? true,
      });
    } else {
      setEditingSlice(null);
      setSliceForm({
        label: "",
        prize_type: "percentage",
        discount_value: 0,
        min_cart_amount: 0,
        probability: 10,
        color: "#FF6B6B",
        sort_order: (slices?.length || 0),
        is_active: true,
      });
    }
    setSliceDialog(true);
  };

  const saveSlice = async () => {
    if (!config) return;
    if (editingSlice) {
      const { error } = await supabase
        .from("spin_wheel_slices")
        .update(sliceForm)
        .eq("id", editingSlice.id);
      if (error) toast.error("Dilim güncellenemedi");
      else toast.success("Dilim güncellendi");
    } else {
      const { error } = await supabase
        .from("spin_wheel_slices")
        .insert({ ...sliceForm, config_id: config.id });
      if (error) toast.error("Dilim eklenemedi");
      else toast.success("Dilim eklendi");
    }
    setSliceDialog(false);
    queryClient.invalidateQueries({ queryKey: ["spin-wheel-all-slices"] });
  };

  const deleteSlice = async (id: string) => {
    const { error } = await supabase.from("spin_wheel_slices").delete().eq("id", id);
    if (error) toast.error("Dilim silinemedi");
    else {
      toast.success("Dilim silindi");
      queryClient.invalidateQueries({ queryKey: ["spin-wheel-all-slices"] });
    }
  };

  const totalProbability = slices?.reduce((sum, s) => sum + s.probability, 0) || 0;

  if (isLoading) return <div className="p-6">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🎰 Çark Yönetimi</h1>

      {/* Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.todayTotal}</p>
              <p className="text-sm text-muted-foreground">Bugün Çevrilen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.todayWinners}</p>
              <p className="text-sm text-muted-foreground">Bugün Kazanan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.allTimeTotal}</p>
              <p className="text-sm text-muted-foreground">Toplam Çevrilen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">%{stats.conversionRate.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Kupon Dönüşüm</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Config Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Genel Ayarlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={configForm.is_active}
                onCheckedChange={(v) => setConfigForm((p) => ({ ...p, is_active: v }))}
              />
              <Label>Çark Aktif</Label>
            </div>
            <div>
              <Label>Bekleme Süresi (saat)</Label>
              <Input
                type="number"
                value={configForm.cooldown_hours}
                onChange={(e) => setConfigForm((p) => ({ ...p, cooldown_hours: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Kupon Ön Eki</Label>
              <Input
                value={configForm.coupon_prefix}
                onChange={(e) => setConfigForm((p) => ({ ...p, coupon_prefix: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <Label>Kupon Geçerlilik (saat)</Label>
              <Input
                type="number"
                value={configForm.coupon_expiry_hours}
                onChange={(e) => setConfigForm((p) => ({ ...p, coupon_expiry_hours: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Tetikleme Türü</Label>
              <Select
                value={configForm.trigger_type}
                onValueChange={(v) => setConfigForm((p) => ({ ...p, trigger_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scroll">Scroll</SelectItem>
                  <SelectItem value="exit_intent">Exit Intent</SelectItem>
                  <SelectItem value="both">Her İkisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tetikleme Gecikmesi (sn)</Label>
              <Input
                type="number"
                value={configForm.trigger_delay_seconds}
                onChange={(e) => setConfigForm((p) => ({ ...p, trigger_delay_seconds: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Scroll Yüzdesi (%)</Label>
              <Input
                type="number"
                value={configForm.trigger_scroll_percent}
                onChange={(e) => setConfigForm((p) => ({ ...p, trigger_scroll_percent: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Color Settings */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Palette className="h-4 w-4" /> Renk Ayarları</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Merkez Renk</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={configForm.center_color}
                    onChange={(e) => setConfigForm((p) => ({ ...p, center_color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={configForm.center_color}
                    onChange={(e) => setConfigForm((p) => ({ ...p, center_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Kenar Renk</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={configForm.border_color}
                    onChange={(e) => setConfigForm((p) => ({ ...p, border_color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={configForm.border_color}
                    onChange={(e) => setConfigForm((p) => ({ ...p, border_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button onClick={saveConfig}>Ayarları Kaydet</Button>
        </CardContent>
      </Card>

      {/* Slices Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Çark Dilimleri</CardTitle>
          <Button onClick={() => openSliceDialog()} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Dilim Ekle
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Toplam Ağırlık: <strong>{totalProbability}</strong> | Her dilimin olasılığı: ağırlık / toplam
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Renk</TableHead>
                <TableHead>Etiket</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Değer</TableHead>
                <TableHead>Min Sepet</TableHead>
                <TableHead>Ağırlık</TableHead>
                <TableHead>Olasılık</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slices?.map((slice) => (
                <TableRow key={slice.id}>
                  <TableCell>
                    <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: slice.color || "#ccc" }} />
                  </TableCell>
                  <TableCell className="font-medium">{slice.label}</TableCell>
                  <TableCell>
                    {{
                      percentage: "Yüzde",
                      fixed: "Sabit TL",
                      free_shipping: "Ücretsiz Kargo",
                      retry: "Tekrar Dene",
                    }[slice.prize_type] || slice.prize_type}
                  </TableCell>
                  <TableCell>
                    {slice.prize_type === "retry" ? "-" : 
                     slice.prize_type === "free_shipping" ? "✓" :
                     slice.prize_type === "percentage" ? `%${slice.discount_value}` : `${slice.discount_value}₺`}
                  </TableCell>
                  <TableCell>{slice.min_cart_amount > 0 ? `${slice.min_cart_amount}₺` : "-"}</TableCell>
                  <TableCell>{slice.probability}</TableCell>
                  <TableCell>%{totalProbability > 0 ? ((slice.probability / totalProbability) * 100).toFixed(1) : 0}</TableCell>
                  <TableCell>{slice.is_active ? "✅" : "❌"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openSliceDialog(slice)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSlice(slice.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Slice Dialog */}
      <Dialog open={sliceDialog} onOpenChange={setSliceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlice ? "Dilim Düzenle" : "Yeni Dilim Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Etiket (çarktaki yazı)</Label>
              <Input
                value={sliceForm.label}
                onChange={(e) => setSliceForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="Ör: %20 İndirim"
              />
            </div>
            <div>
              <Label>Ödül Türü</Label>
              <Select
                value={sliceForm.prize_type}
                onValueChange={(v) => setSliceForm((p) => ({ ...p, prize_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yüzde İndirim</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar (TL)</SelectItem>
                  <SelectItem value="free_shipping">Ücretsiz Kargo</SelectItem>
                  <SelectItem value="retry">Tekrar Deneyin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sliceForm.prize_type !== "retry" && sliceForm.prize_type !== "free_shipping" && (
              <div>
                <Label>İndirim Değeri ({sliceForm.prize_type === "percentage" ? "%" : "₺"})</Label>
                <Input
                  type="number"
                  value={sliceForm.discount_value}
                  onChange={(e) => setSliceForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
                />
              </div>
            )}
            <div>
              <Label>Minimum Sepet Tutarı (₺)</Label>
              <Input
                type="number"
                value={sliceForm.min_cart_amount}
                onChange={(e) => setSliceForm((p) => ({ ...p, min_cart_amount: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Ağırlık (olasılık)</Label>
              <Input
                type="number"
                value={sliceForm.probability}
                onChange={(e) => setSliceForm((p) => ({ ...p, probability: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Örnek: "Tekrar Dene" = 50, "%5 İndirim" = 20 → Tekrar dene olasılığı ~%71
              </p>
            </div>
            <div>
              <Label>Dilim Rengi</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={sliceForm.color}
                  onChange={(e) => setSliceForm((p) => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={sliceForm.color}
                  onChange={(e) => setSliceForm((p) => ({ ...p, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Sıra</Label>
              <Input
                type="number"
                value={sliceForm.sort_order}
                onChange={(e) => setSliceForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={sliceForm.is_active}
                onCheckedChange={(v) => setSliceForm((p) => ({ ...p, is_active: v }))}
              />
              <Label>Aktif</Label>
            </div>
            <Button onClick={saveSlice} className="w-full">Kaydet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSpinWheel;
