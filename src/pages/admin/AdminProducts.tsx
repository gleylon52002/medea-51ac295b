import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";
import ProductVariantsManager from "@/components/admin/ProductVariantsManager";
import RelatedProductsManager from "@/components/admin/RelatedProductsManager";
import InstagramShareButton from "@/components/admin/InstagramShareButton";
import AIFillButton from "@/components/admin/AIFillButton";
type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

const AdminProducts = () => {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    description: "",
    price: "",
    sale_price: "",
    stock: "0",
    category_id: "",
    is_featured: false,
    is_active: true,
    ingredients: "",
    usage_instructions: "",
    meta_title: "",
    meta_description: "",
    keywords: "",
  });
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
      closeDialog();
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("İşlem başarısız");
    },
  });

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductImages(product.images || []);
      setFormData({
        name: product.name || "",
        short_description: product.short_description || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        sale_price: product.sale_price?.toString() || "",
        stock: product.stock?.toString() || "0",
        category_id: product.category_id || "",
        is_featured: product.is_featured || false,
        is_active: product.is_active ?? true,
        ingredients: product.ingredients || "",
        usage_instructions: product.usage_instructions || "",
        meta_title: product.meta_title || "",
        meta_description: product.meta_description || "",
        keywords: ((product as any).keywords || []).join(", "),
      });
    } else {
      setEditingProduct(null);
      setProductImages([]);
      setFormData({
        name: "",
        short_description: "",
        description: "",
        price: "",
        sale_price: "",
        stock: "0",
        category_id: "",
        is_featured: false,
        is_active: true,
        ingredients: "",
        usage_instructions: "",
        meta_title: "",
        meta_description: "",
        keywords: "",
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setProductImages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Ürün adı zorunludur");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Geçerli bir fiyat giriniz");
      return;
    }
    if (productImages.length === 0) {
      toast.error("En az bir ürün görseli ekleyin");
      return;
    }

    const keywordsArray = formData.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const product: any = {
      name: formData.name.trim(),
      slug: generateSlug(formData.name),
      description: formData.description.trim() || null,
      short_description: formData.short_description.trim() || null,
      price: parseFloat(formData.price),
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      stock: parseInt(formData.stock) || 0,
      category_id: formData.category_id || null,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      ingredients: formData.ingredients.trim() || null,
      usage_instructions: formData.usage_instructions.trim() || null,
      meta_title: formData.meta_title.trim() || null,
      meta_description: formData.meta_description.trim() || null,
      images: productImages,
      keywords: keywordsArray,
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
        <Button onClick={() => openDialog()}>
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
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
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
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.is_active 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {product.is_active ? "Aktif" : "Pasif"}
                      </span>
                      {product.is_featured && (
                        <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
                          Öne Çıkan
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(product)}
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
                      <InstagramShareButton
                        productName={product.name}
                        productPrice={Number(product.sale_price || product.price)}
                        productImage={product.images?.[0]}
                        productSlug={product.slug}
                      />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="general">Genel</TabsTrigger>
                <TabsTrigger value="variants" disabled={!editingProduct}>Varyantlar</TabsTrigger>
                <TabsTrigger value="related" disabled={!editingProduct}>İlgili Ürünler</TabsTrigger>
                <TabsTrigger value="details">Detaylar</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                {/* Images */}
                <div>
                  <Label className="mb-2 block">Ürün Görselleri *</Label>
                  <ImageUpload
                    images={productImages}
                    onImagesChange={setProductImages}
                    bucket="product-images"
                    maxImages={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Ürün Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                   <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="short_description">Kısa Açıklama</Label>
                      <AIFillButton
                        field="short_description"
                        context={`Ürün Adı: ${formData.name}`}
                        onResult={(val) => setFormData({ ...formData, short_description: val })}
                        disabled={!formData.name}
                      />
                    </div>
                    <Input
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      placeholder="Ürün listelerinde gösterilecek kısa açıklama"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="description">Açıklama</Label>
                      <AIFillButton
                        field="description"
                        context={`Ürün Adı: ${formData.name}\nKısa Açıklama: ${formData.short_description}`}
                        onResult={(val) => setFormData({ ...formData, description: val })}
                        disabled={!formData.name}
                      />
                    </div>
                    <Textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.endsWith("@") && formData.keywords.trim()) {
                          const keywordsText = formData.keywords
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                            .join(", ");
                          setFormData({
                            ...formData,
                            description: val.slice(0, -1) + keywordsText,
                          });
                        } else {
                          setFormData({ ...formData, description: val });
                        }
                      }}
                      placeholder="Ürün detay sayfasında gösterilecek açıklama. @ yazarak anahtar kelimeleri ekleyin."
                    />
                    {formData.keywords.trim() && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Açıklamaya @ yazarak anahtar kelimeleri otomatik ekleyebilirsiniz
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price">Fiyat (₺) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sale_price">İndirimli Fiyat (₺)</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      placeholder="Boş bırakılırsa indirim yok"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Stok Miktarı</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category_id">Kategori</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
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

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Aktif</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                      />
                      <Label htmlFor="is_featured">Öne Çıkan</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4">
                {editingProduct ? (
                  <ProductVariantsManager productId={editingProduct.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Varyant eklemek için önce ürünü kaydedin.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="related" className="space-y-4">
                {editingProduct ? (
                  <RelatedProductsManager productId={editingProduct.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    İlgili ürün eklemek için önce ürünü kaydedin.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="ingredients">İçerikler</Label>
                    <AIFillButton
                      field="ingredients"
                      context={`Ürün Adı: ${formData.name}\nKısa Açıklama: ${formData.short_description}\nKategori: ${categories?.find(c => c.id === formData.category_id)?.name || ''}`}
                      onResult={(val) => setFormData({ ...formData, ingredients: val })}
                      disabled={!formData.name}
                    />
                  </div>
                  <Textarea
                    id="ingredients"
                    rows={4}
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="Ürün içerikleri (sabun, krem vb. için)"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="usage_instructions">Kullanım Talimatı</Label>
                    <AIFillButton
                      field="usage_instructions"
                      context={`Ürün Adı: ${formData.name}\nKısa Açıklama: ${formData.short_description}\nİçerikler: ${formData.ingredients}`}
                      onResult={(val) => setFormData({ ...formData, usage_instructions: val })}
                      disabled={!formData.name}
                    />
                  </div>
                  <Textarea
                    id="usage_instructions"
                    rows={4}
                    value={formData.usage_instructions}
                    onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
                    placeholder="Ürün nasıl kullanılır?"
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="keywords">Anahtar Kelimeler</Label>
                    <AIFillButton
                      field="keywords"
                      context={`Ürün Adı: ${formData.name}\nKısa Açıklama: ${formData.short_description}\nKategori: ${categories?.find(c => c.id === formData.category_id)?.name || ''}`}
                      onResult={(val) => setFormData({ ...formData, keywords: val })}
                      disabled={!formData.name}
                    />
                  </div>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="doğal sabun, el yapımı, organik, vegan (virgülle ayırın)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Virgülle ayırarak birden fazla anahtar kelime girin. Açıklamada @ yazarak otomatik ekleyebilirsiniz.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="meta_title">SEO Başlık</Label>
                    <AIFillButton
                      field="meta_title"
                      context={`Ürün Adı: ${formData.name}\nKısa Açıklama: ${formData.short_description}`}
                      onResult={(val) => setFormData({ ...formData, meta_title: val })}
                      disabled={!formData.name}
                    />
                  </div>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Arama motorlarında görünecek başlık (60 karakter önerilir)"
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
                    placeholder="Arama motorlarında görünecek açıklama (160 karakter önerilir)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_description.length}/160 karakter
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Önizleme</p>
                  <div className="text-blue-600 text-base font-medium truncate">
                    {formData.meta_title || formData.name || "Ürün Başlığı"}
                  </div>
                  <div className="text-green-700 text-sm">
                    medea.lovable.app/urun/{generateSlug(formData.name) || "urun-slug"}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {formData.meta_description || formData.short_description || "Ürün açıklaması..."}
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

export default AdminProducts;
