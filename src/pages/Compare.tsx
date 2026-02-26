import { Link } from "react-router-dom";
import { Scale, X, ShoppingBag } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  useComparisonProducts,
  useRemoveFromComparison,
  useClearComparison,
} from "@/hooks/useProductComparison";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const Compare = () => {
  const { data: comparisons, isLoading } = useComparisonProducts();
  const removeFromComparison = useRemoveFromComparison();
  const clearComparison = useClearComparison();
  const { addToCart } = useCart();

  const products = comparisons?.map((c) => c.product).filter(Boolean) || [];

  const handleAddToCart = (product: any) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      shortDescription: product.short_description || "",
      price: Number(product.price),
      salePrice: product.sale_price ? Number(product.sale_price) : undefined,
      images: product.images || [],
      category: product.categories?.name || "",
      categorySlug: product.categories?.slug || "",
      stock: product.stock,
      featured: product.is_featured,
      ingredients: product.ingredients || undefined,
      usage: product.usage_instructions || undefined,
      rating: 0,
      reviewCount: 0,
      createdAt: product.created_at,
      sellerId: product.seller_id,
    };
    addToCart(cartProduct);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  if (!comparisons || comparisons.length === 0) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-serif text-2xl font-medium mb-2">Karşılaştırma Listeniz Boş</h1>
          <p className="text-muted-foreground mb-6">
            Ürünleri karşılaştırmak için ürün sayfalarından "Karşılaştır" butonuna tıklayın.
          </p>
          <Button asChild>
            <Link to="/urunler">Ürünlere Göz At</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Define comparison attributes
  const attributes = [
    { key: "price", label: "Fiyat" },
    { key: "category", label: "Kategori" },
    { key: "stock", label: "Stok Durumu" },
    { key: "ingredients", label: "İçerikler" },
    { key: "usage", label: "Kullanım" },
  ];

  const getAttributeValue = (product: any, key: string) => {
    switch (key) {
      case "price":
        return formatPrice(Number(product.sale_price || product.price));
      case "category":
        return product.categories?.name || "-";
      case "stock":
        return product.stock > 0 ? `${product.stock} adet` : "Stokta yok";
      case "ingredients":
        return product.ingredients || "-";
      case "usage":
        return product.usage_instructions || "-";
      default:
        return "-";
    }
  };

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Ürün Karşılaştırma</h1>
            <p className="text-muted-foreground mt-1">
              {products.length} ürün karşılaştırılıyor
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => clearComparison.mutate()}
            disabled={clearComparison.isPending}
          >
            Listeyi Temizle
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left bg-muted/50 border min-w-[150px]">Özellik</th>
                {products.map((product) => (
                  <th key={product?.id} className="p-4 text-center bg-muted/50 border min-w-[200px]">
                    <div className="relative">
                      <button
                        onClick={() => {
                          const comparison = comparisons.find((c) => c.product_id === product?.id);
                          if (comparison) {
                            removeFromComparison.mutate(comparison.id);
                          }
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <Link to={`/urun/${product?.slug}`}>
                        <div className="w-24 h-24 mx-auto mb-3 rounded-lg overflow-hidden bg-secondary">
                          <img
                            src={product?.images?.[0] || "/placeholder.svg"}
                            alt={product?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="font-medium text-sm hover:text-primary transition-colors">
                          {product?.name}
                        </p>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.key}>
                  <td className="p-4 font-medium bg-muted/30 border">{attr.label}</td>
                  {products.map((product) => (
                    <td key={product?.id} className="p-4 text-center border">
                      <span className={attr.key === "ingredients" || attr.key === "usage" ? "text-sm text-muted-foreground line-clamp-3" : ""}>
                        {getAttributeValue(product, attr.key)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-4 font-medium bg-muted/30 border">İşlem</td>
                {products.map((product) => (
                  <td key={product?.id} className="p-4 text-center border">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={product?.stock === 0}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Sepete Ekle
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Compare;
