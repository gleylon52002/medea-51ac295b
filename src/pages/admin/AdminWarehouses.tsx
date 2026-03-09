import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Warehouse, Plus, Package, MapPin, Trash2, Edit, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface WarehouseType {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  district: string | null;
  is_active: boolean;
  is_default: boolean;
  seller_id: string | null;
}

const AdminWarehouses = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    district: "",
  });

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WarehouseType[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (warehouse: Partial<WarehouseType>) => {
      if (editingWarehouse) {
        const { error } = await supabase
          .from("warehouses")
          .update(warehouse as any)
          .eq("id", editingWarehouse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("warehouses").insert(warehouse as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "warehouses"] });
      toast.success(editingWarehouse ? "Depo güncellendi" : "Depo eklendi");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("İşlem başarısız"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("warehouses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "warehouses"] });
      toast.success("Depo silindi");
    },
  });

  const toggleDefault = useMutation({
    mutationFn: async (id: string) => {
      // First unset all defaults
      await supabase.from("warehouses").update({ is_default: false }).eq("is_default", true);
      // Then set this one
      await supabase.from("warehouses").update({ is_default: true }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "warehouses"] });
      toast.success("Varsayılan depo güncellendi");
    },
  });

  const resetForm = () => {
    setForm({ name: "", code: "", address: "", city: "", district: "" });
    setEditingWarehouse(null);
  };

  const openEdit = (wh: WarehouseType) => {
    setEditingWarehouse(wh);
    setForm({
      name: wh.name,
      code: wh.code,
      address: wh.address || "",
      city: wh.city || "",
      district: wh.district || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.code) {
      toast.error("Ad ve kod zorunludur");
      return;
    }
    saveMutation.mutate({
      name: form.name,
      code: form.code.toUpperCase(),
      address: form.address || null,
      city: form.city || null,
      district: form.district || null,
    });
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
            <Warehouse className="h-6 w-6" />
            Depo Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground">Çoklu depo ile stok takibi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Depo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWarehouse ? "Depo Düzenle" : "Yeni Depo Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Depo Adı</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ana Depo"
                  />
                </div>
                <div>
                  <Label>Depo Kodu</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="DEPO-01"
                  />
                </div>
              </div>
              <div>
                <Label>Adres</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Depo adresi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>İl</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="İstanbul"
                  />
                </div>
                <div>
                  <Label>İlçe</Label>
                  <Input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Kadıköy"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingWarehouse ? "Güncelle" : "Ekle"}
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
                <TableHead>Depo</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Varsayılan</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses?.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium">{wh.name}</TableCell>
                  <TableCell><Badge variant="outline">{wh.code}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {wh.city && wh.district ? `${wh.district}, ${wh.city}` : wh.city || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={wh.is_active ? "default" : "secondary"}>
                      {wh.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={wh.is_default}
                      onCheckedChange={() => toggleDefault.mutate(wh.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(wh)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(wh.id)}
                        disabled={wh.is_default}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {warehouses?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Henüz depo eklenmemiş
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

export default AdminWarehouses;
