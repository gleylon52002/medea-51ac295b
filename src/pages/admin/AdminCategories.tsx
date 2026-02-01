import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const AdminCategories = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryImage, setCategoryImage] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sort_order: "0",
    is_active: true,
    meta_title: "",
    meta_description: "",
  });
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

  // Count products per category
  const { data: productCounts } = useQuery({
    queryKey: ["admin", "category-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category_id");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
      return counts;
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
      closeDialog();
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const generateSlug = (name: string) => {
    const turkishMap: Record<string, string> = {
      ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
      Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U",
    };
    return name
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, (char) => turkishMap[char] || char)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryImage(category.image ? [category.image] : []);
      setFormData({
        name: category.name || "",
        description: category.description || "",
        sort_order: category.sort_order?.toString() || "0",
        is_active: category.is_active ?? true,
        meta_title: category.meta_title || "",
        meta_description: category.meta_description || "",
      });
    } else {
      setEditingCategory(null);
      setCategoryImage([]);
      setFormData({
        name: "",
        description: "",
        sort_order: "0",
        is_active: true,
        meta_title: "",
        meta_description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryImage([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Kategori adı zorunludur");
      return;
    }

    const category: Partial<Category> = {
      name: formData.name.trim(),
      slug: generateSlug(formData.name),
      description: formData.description.trim() || null,
      image: categoryImage[0] || null,
      sort_order: parseInt(formData.sort_order) || 0,
      is_active: formData.is_active,
      meta_title: formData.meta_title.trim() || null,
      meta_description: formData.meta_description.trim() || null,
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
        <Button onClick={() => openDialog()}>
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
              <TableHead>Ürün Sayısı</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-24">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                        {category.image ? (
                          <img src={category.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FolderTree className="h-5 w-5 text-muted-foreground" />
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
                  <TableCell>
                    <span className="text-muted-foreground">
                      {productCounts?.[category.id] || 0} ürün
                    </span>
                  </TableCell>
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
                        onClick={() => openDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const count = productCounts?.[category.id] || 0;
                          if (count > 0) {
                            toast.error(`Bu kategoride ${count} ürün var. Önce ürünleri silin veya başka kategoriye taşıyın.`);
                            return;
                          }
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Kategori bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="general">Genel</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                {/* Image */}
                <div>
                  <Label className="mb-2 block">Kategori Görseli</Label>
                  <ImageUpload
                    images={categoryImage}
                    onImagesChange={setCategoryImage}
                    bucket="category-images"
                    maxImages={1}
                  />
                </div>

                <div>
                  <Label htmlFor="name">Kategori Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Kategori açıklaması"
                  />
                </div>

                <div>
                  <Label htmlFor="sort_order">Sıralama</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Küçük sayılar önce gösterilir
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">SEO Başlık</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Arama motorlarında görünecek başlık"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_title.length}/60 karakter
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_description">SEO Açıklama</Label>
                  <Textarea
                    id="meta_description"
                    rows={3}
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Arama motorlarında görünecek açıklama"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_description.length}/160 karakter
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Önizleme</p>
                  <div className="text-blue-600 text-base font-medium truncate">
                    {formData.meta_title || formData.name || "Kategori Başlığı"}
                  </div>
                  <div className="text-green-700 text-sm">
                    medea.lovable.app/kategori/{generateSlug(formData.name) || "kategori-slug"}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {formData.meta_description || formData.description || "Kategori açıklaması..."}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeDialog}>
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
