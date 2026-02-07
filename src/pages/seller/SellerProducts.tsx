import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSellerProducts, useCreateSellerProduct, useUpdateSellerProduct, useDeleteSellerProduct } from "@/hooks/useSellerProducts";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/lib/utils";
import ImageUpload from "@/components/admin/ImageUpload";

const SellerProducts = () => {
  const { data: products, isLoading } = useSellerProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  const deleteProduct = useDeleteSellerProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    short_description: "",
    price: "",
    sale_price: "",
    category_id: "",
    stock: "",
    images: [] as string[],
    ingredients: "",
    usage_instructions: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      short_description: "",
      price: "",
      sale_price: "",
      category_id: "",
      stock: "",
      images: [],
      ingredients: "",
      usage_instructions: "",
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        short_description: product.short_description || "",
        price: String(product.price),
        sale_price: product.sale_price ? String(product.sale_price) : "",
        category_id: product.category_id || "",
        stock: String(product.stock),
        images: product.images || [],
        ingredients: product.ingredients || "",
        usage_instructions: product.usage_instructions || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      description: formData.description,
      short_description: formData.short_description,
      price: parseFloat(formData.price) || 0,
      sale_price: formData.sale_price ? (parseFloat(formData.sale_price) || null) : null,
      category_id: formData.category_id || null,
      stock: parseInt(formData.stock) || 0,
      images: formData.images,
      ingredients: formData.ingredients,
      usage_instructions: formData.usage_instructions,
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
          toast.success("Ürün başarıyla güncellendi");
        },
        onError: () => {
          toast.error("Ürün güncellenirken bir hata oluştu");
        }
      });
    } else {
      createProduct.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
          toast.success("Ürün başarıyla eklendi");
        },
        onError: () => {
          toast.error("Ürün eklenirken bir hata oluştu");
        }
      });
    }
  };

  const handleDelete = (productId: string) => {
    if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      deleteProduct.mutate(productId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ürünlerim</h1>
          <p className="text-muted-foreground">Ürünlerinizi buradan yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ürün Adı *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ürün adı"
                />
              </div>

              <div className="space-y-2">
                <Label>Kısa Açıklama</Label>
                <Input
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Kısa açıklama"
                />
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaylı açıklama"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fiyat (₺) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>İndirimli Fiyat (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
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
                <div className="space-y-2">
                  <Label>Stok *</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ürün Görselleri</Label>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                  bucket="product-images"
                />
              </div>

              <div className="space-y-2">
                <Label>İçindekiler</Label>
                <Textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="Ürün içerikleri"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Kullanım Talimatları</Label>
                <Textarea
                  value={formData.usage_instructions}
                  onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
                  placeholder="Kullanım bilgileri"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createProduct.isPending || updateProduct.isPending}
                >
                  {(createProduct.isPending || updateProduct.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingProduct ? "Güncelle" : "Ekle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {products?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz ürün eklemediniz.</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Ürününüzü Ekleyin
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category?.name || "Kategorisiz"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.sale_price ? (
                        <div>
                          <span className="text-destructive line-through text-xs">
                            {formatPrice(product.price)}
                          </span>
                          <br />
                          <span className="font-medium">{formatPrice(product.sale_price)}</span>
                        </div>
                      ) : (
                        formatPrice(product.price)
                      )}
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <Eye className="h-3 w-3 mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Onay Bekliyor
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerProducts;
