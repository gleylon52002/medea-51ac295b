import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const AdminCategories = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Kategori silindi");
    },
    onError: () => {
      toast.error("Kategori silinemedi (ürünler olabilir)");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(category)
          .eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(category as Category);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success(editingCategory ? "Kategori güncellendi" : "Kategori eklendi");
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const category: Partial<Category> = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.get("description") as string,
      image: formData.get("image") as string || null,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
      is_active: formData.get("is_active") === "on",
      meta_title: formData.get("meta_title") as string || null,
      meta_description: formData.get("meta_description") as string || null,
    };

    saveMutation.mutate(category);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Kategoriler</h1>
          <p className="text-muted-foreground mt-1">Ürün kategorilerinizi yönetin</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-24">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                        {category.image && (
                          <img src={category.image} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      category.is_active 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {category.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingCategory(category); setIsDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
                            deleteMutation.mutate(category.id);
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
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Kategori bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Kategori Adı</Label>
              <Input id="name" name="name" defaultValue={editingCategory?.name || ""} required />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea 
                id="description" 
                name="description" 
                rows={2}
                defaultValue={editingCategory?.description || ""} 
              />
            </div>
            <div>
              <Label htmlFor="image">Görsel URL</Label>
              <Input 
                id="image" 
                name="image" 
                defaultValue={editingCategory?.image || ""} 
              />
            </div>
            <div>
              <Label htmlFor="sort_order">Sıra</Label>
              <Input 
                id="sort_order" 
                name="sort_order" 
                type="number"
                defaultValue={editingCategory?.sort_order || 0} 
              />
            </div>
            <div>
              <Label htmlFor="meta_title">SEO Başlık</Label>
              <Input 
                id="meta_title" 
                name="meta_title" 
                defaultValue={editingCategory?.meta_title || ""} 
              />
            </div>
            <div>
              <Label htmlFor="meta_description">SEO Açıklama</Label>
              <Textarea 
                id="meta_description" 
                name="meta_description" 
                rows={2}
                defaultValue={editingCategory?.meta_description || ""} 
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="is_active" 
                name="is_active" 
                defaultChecked={editingCategory?.is_active ?? true} 
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

export default AdminCategories;
