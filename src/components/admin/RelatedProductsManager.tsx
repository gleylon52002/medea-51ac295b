import { useState } from "react";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import {
  useRelatedProducts,
  useAddRelatedProduct,
  useRemoveRelatedProduct,
} from "@/hooks/useRelatedProducts";
import { formatPrice } from "@/lib/utils";

interface RelatedProductsManagerProps {
  productId: string;
}

const RelatedProductsManager = ({ productId }: RelatedProductsManagerProps) => {
  const { data: allProducts } = useProducts();
  const { data: relatedProducts, isLoading } = useRelatedProducts(productId);
  const addRelated = useAddRelatedProduct();
  const removeRelated = useRemoveRelatedProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [relationType, setRelationType] = useState("related");

  const relatedProductIds = relatedProducts?.map((r) => r.related_product_id) || [];

  const filteredProducts = allProducts?.filter(
    (p) =>
      p.id !== productId &&
      !relatedProductIds.includes(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddRelated = (relatedProductId: string) => {
    addRelated.mutate({ productId, relatedProductId, relationType });
    setIsDialogOpen(false);
    setSearch("");
  };

  const handleRemoveRelated = (id: string) => {
    removeRelated.mutate({ id, productId });
  };

  const getRelationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      related: "İlgili Ürün",
      complementary: "Tamamlayıcı",
      upsell: "Alternatif",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">İlgili Ürünler</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          İlgili Ürün Ekle
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : relatedProducts && relatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {relatedProducts.map((relation) => (
            <div
              key={relation.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                  {relation.related_product?.images?.[0] ? (
                    <img
                      src={relation.related_product.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm line-clamp-1">
                    {relation.related_product?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRelationTypeLabel(relation.relation_type)} •{" "}
                    {formatPrice(Number(relation.related_product?.sale_price || relation.related_product?.price))}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveRelated(relation.id)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground border rounded-lg p-4 text-center">
          Henüz ilgili ürün eklenmemiş.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İlgili Ürün Ekle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>İlişki Tipi</Label>
              <Select value={relationType} onValueChange={setRelationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="related">İlgili Ürün</SelectItem>
                  <SelectItem value="complementary">Tamamlayıcı Ürün</SelectItem>
                  <SelectItem value="upsell">Alternatif Ürün</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                    onClick={() => handleAddRelated(product.id)}
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(Number(product.sale_price || product.price))}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {search ? "Ürün bulunamadı" : "Eklenebilir ürün yok"}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelatedProductsManager;
