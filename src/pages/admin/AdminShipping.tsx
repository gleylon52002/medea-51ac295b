import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type ShippingCompany = Database["public"]["Tables"]["shipping_companies"]["Row"];

const AdminShipping = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ShippingCompany | null>(null);
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin", "shipping-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_companies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as ShippingCompany[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-companies"] });
      toast.success("Kargo firması silindi");
    },
    onError: () => {
      toast.error("Kargo firması silinemedi");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (company: Partial<ShippingCompany>) => {
      if (editingCompany) {
        const { error } = await supabase
          .from("shipping_companies")
          .update(company)
          .eq("id", editingCompany.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shipping_companies").insert(company as ShippingCompany);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-companies"] });
      toast.success(editingCompany ? "Kargo firması güncellendi" : "Kargo firması eklendi");
      setIsDialogOpen(false);
      setEditingCompany(null);
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("shipping_companies")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-companies"] });
      toast.success("Durum güncellendi");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const company: Partial<ShippingCompany> = {
      name: formData.get("name") as string,
      tracking_url: formData.get("tracking_url") as string || null,
      is_active: formData.get("is_active") === "on",
    };

    saveMutation.mutate(company);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Kargo Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Kargo firmalarını yönetin</p>
        </div>
        <Button onClick={() => { setEditingCompany(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kargo Firması
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma Adı</TableHead>
              <TableHead>Takip URL</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-24">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : companies && companies.length > 0 ? (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {company.tracking_url || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={company.is_active}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ id: company.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingCompany(company); setIsDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Bu kargo firmasını silmek istediğinize emin misiniz?")) {
                            deleteMutation.mutate(company.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Kargo firması bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Kargo Firması Düzenle" : "Yeni Kargo Firması"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Firma Adı</Label>
              <Input id="name" name="name" defaultValue={editingCompany?.name || ""} required />
            </div>
            <div>
              <Label htmlFor="tracking_url">Takip URL (Takip no sonuna eklenir)</Label>
              <Input 
                id="tracking_url" 
                name="tracking_url" 
                placeholder="https://www.kargofirma.com/takip?no="
                defaultValue={editingCompany?.tracking_url || ""} 
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="is_active" 
                name="is_active" 
                defaultChecked={editingCompany?.is_active ?? true} 
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShipping;
