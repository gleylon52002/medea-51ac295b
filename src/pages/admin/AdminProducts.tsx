import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

const AdminProducts = () => {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Ürün silindi");
    },
    onError: () => {
      toast.error("Ürün silinemedi");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(product)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(product as Product);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(editingProduct ? "Ürün güncellendi" : "Ürün eklendi");
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const product: Partial<Product> = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.get("description") as string,
      short_description: formData.get("short_description") as string,
      price: parseFloat(formData.get("price") as string),
      sale_price: formData.get("sale_price") ? parseFloat(formData.get("sale_price") as string) : null,
      stock: parseInt(formData.get("stock") as string),
      category_id: formData.get("category_id") as string || null,
      is_featured: formData.get("is_featured") === "on",
      is_active: formData.get("is_active") === "on",
      ingredients: formData.get("ingredients") as string,
      usage_instructions: formData.get("usage_instructions") as string,
      images: (formData.get("images") as string).split(",").map(s => s.trim()).filter(Boolean),
    };

    saveMutation.mutate(product);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Ürünler</h1>
          <p className="text-muted-foreground mt-1">Ürünlerinizi yönetin</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Stok</TableHead>
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
            ) : filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {product.short_description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{(product as any).categories?.name || "-"}</TableCell>
                  <TableCell>
                    <div>
                      {product.sale_price ? (
                        <>
                          <span className="font-medium">{formatPrice(Number(product.sale_price))}</span>
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            {formatPrice(Number(product.price))}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium">{formatPrice(Number(product.price))}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={product.stock <= 5 ? "text-destructive font-medium" : ""}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.is_active 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {product.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
                            deleteMutation.mutate(product.id);
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
                  Ürün bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Ürün Adı</Label>
                <Input id="name" name="name" defaultValue={editingProduct?.name || ""} required />
              </div>
              <div className="col-span-2">
                <Label htmlFor="short_description">Kısa Açıklama</Label>
                <Input 
                  id="short_description" 
                  name="short_description" 
                  defaultValue={editingProduct?.short_description || ""} 
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  rows={3}
                  defaultValue={editingProduct?.description || ""} 
                />
              </div>
              <div>
                <Label htmlFor="price">Fiyat (₺)</Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  step="0.01"
                  defaultValue={editingProduct?.price || ""} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="sale_price">İndirimli Fiyat (₺)</Label>
                <Input 
                  id="sale_price" 
                  name="sale_price" 
                  type="number" 
                  step="0.01"
                  defaultValue={editingProduct?.sale_price || ""} 
                />
              </div>
              <div>
                <Label htmlFor="stock">Stok</Label>
                <Input 
                  id="stock" 
                  name="stock" 
                  type="number" 
                  defaultValue={editingProduct?.stock || 0} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="category_id">Kategori</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="images">Görsel URL'leri (virgülle ayırın)</Label>
                <Input 
                  id="images" 
                  name="images" 
                  defaultValue={editingProduct?.images?.join(", ") || ""} 
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="ingredients">İçerikler</Label>
                <Textarea 
                  id="ingredients" 
                  name="ingredients" 
                  rows={2}
                  defaultValue={editingProduct?.ingredients || ""} 
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="usage_instructions">Kullanım Talimatı</Label>
                <Textarea 
                  id="usage_instructions" 
                  name="usage_instructions" 
                  rows={2}
                  defaultValue={editingProduct?.usage_instructions || ""} 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="is_featured" 
                  name="is_featured" 
                  defaultChecked={editingProduct?.is_featured || false} 
                />
                <Label htmlFor="is_featured">Öne Çıkan</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="is_active" 
                  name="is_active" 
                  defaultChecked={editingProduct?.is_active ?? true} 
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
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

export default AdminProducts;
