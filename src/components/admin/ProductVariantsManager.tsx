import { useState } from "react";
import { Plus, Trash2, GripVertical, Palette, Weight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  useProductVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  ProductVariant,
  VariantType,
  getVariantTypeLabel,
} from "@/hooks/useProductVariants";
import ImageUpload from "./ImageUpload";

interface ProductVariantsManagerProps {
  productId: string;
}

const variantTypeIcons: Record<VariantType, React.ReactNode> = {
  color: <Palette className="h-4 w-4" />,
  weight: <Weight className="h-4 w-4" />,
  scent: <Sparkles className="h-4 w-4" />,
};

const ProductVariantsManager = ({ productId }: ProductVariantsManagerProps) => {
  const { data: variants, isLoading } = useProductVariants(productId);
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState({
    variant_type: "color" as VariantType,
    name: "",
    value: "",
    color_code: "#000000",
    price_adjustment: "0",
    stock: "0",
    sku: "",
    is_active: true,
  });
  const [variantImages, setVariantImages] = useState<string[]>([]);

  const openDialog = (variant?: ProductVariant) => {
    if (variant) {
      setEditingVariant(variant);
      setFormData({
        variant_type: variant.variant_type,
        name: variant.name,
        value: variant.value,
        color_code: variant.color_code || "#000000",
        price_adjustment: variant.price_adjustment?.toString() || "0",
        stock: variant.stock?.toString() || "0",
        sku: variant.sku || "",
        is_active: variant.is_active,
      });
      setVariantImages(variant.images || []);
    } else {
      setEditingVariant(null);
      setFormData({
        variant_type: "color",
        name: "",
        value: "",
        color_code: "#000000",
        price_adjustment: "0",
        stock: "0",
        sku: "",
        is_active: true,
      });
      setVariantImages([]);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      product_id: productId,
      variant_type: formData.variant_type,
      name: formData.name.trim(),
      value: formData.value.trim(),
      color_code: formData.variant_type === "color" ? formData.color_code : null,
      price_adjustment: parseFloat(formData.price_adjustment) || 0,
      stock: parseInt(formData.stock) || 0,
      sku: formData.sku.trim() || null,
      is_active: formData.is_active,
      images: variantImages,
    };

    if (editingVariant) {
      updateVariant.mutate({ id: editingVariant.id, ...data });
    } else {
      createVariant.mutate(data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (variant: ProductVariant) => {
    if (confirm("Bu varyantı silmek istediğinize emin misiniz?")) {
      deleteVariant.mutate({ id: variant.id, productId });
    }
  };

  // Group variants by type
  const groupedVariants = variants?.reduce((acc, variant) => {
    if (!acc[variant.variant_type]) {
      acc[variant.variant_type] = [];
    }
    acc[variant.variant_type].push(variant);
    return acc;
  }, {} as Record<VariantType, ProductVariant[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Ürün Varyasyonları</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Varyant Ekle
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : variants && variants.length > 0 ? (
        <div className="space-y-4">
          {(["color", "weight", "scent"] as VariantType[]).map((type) => {
            const typeVariants = groupedVariants?.[type];
            if (!typeVariants || typeVariants.length === 0) return null;

            return (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {variantTypeIcons[type]}
                  <h4 className="font-medium">{getVariantTypeLabel(type)}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {typeVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {type === "color" && variant.color_code && (
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: variant.color_code }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{variant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {variant.price_adjustment > 0
                              ? `+${variant.price_adjustment}₺`
                              : variant.price_adjustment < 0
                              ? `${variant.price_adjustment}₺`
                              : "Fiyat farkı yok"}{" "}
                            • Stok: {variant.stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(variant)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(variant)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground border rounded-lg p-4 text-center">
          Henüz varyant eklenmemiş. Renk, ağırlık veya koku varyasyonları ekleyebilirsiniz.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Varyant Düzenle" : "Yeni Varyant Ekle"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Varyant Tipi</Label>
              <Select
                value={formData.variant_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, variant_type: value as VariantType })
                }
                disabled={!!editingVariant}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Renk</SelectItem>
                  <SelectItem value="weight">Ağırlık</SelectItem>
                  <SelectItem value="scent">Koku/Aroma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Varyant Adı</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    formData.variant_type === "color"
                      ? "Kırmızı"
                      : formData.variant_type === "weight"
                      ? "100g"
                      : "Lavanta"
                  }
                  required
                />
              </div>
              <div>
                <Label>Değer (filtreleme için)</Label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={
                    formData.variant_type === "color"
                      ? "red"
                      : formData.variant_type === "weight"
                      ? "100"
                      : "lavender"
                  }
                  required
                />
              </div>
            </div>

            {formData.variant_type === "color" && (
              <div>
                <Label>Renk Kodu</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color_code}
                    onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.color_code}
                    onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                    placeholder="#FF0000"
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fiyat Farkı (₺)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_adjustment}
                  onChange={(e) =>
                    setFormData({ ...formData, price_adjustment: e.target.value })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  + veya - değer girebilirsiniz
                </p>
              </div>
              <div>
                <Label>Stok</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>SKU (Stok Kodu)</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SABUN-LAV-100G"
              />
            </div>

            <div>
              <Label className="mb-2 block">Varyant Görselleri</Label>
              <ImageUpload
                images={variantImages}
                onImagesChange={setVariantImages}
                bucket="product-images"
                maxImages={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Aktif</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">
                {editingVariant ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductVariantsManager;
