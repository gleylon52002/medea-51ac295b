import { useEffect } from "react";

interface ProductSchemaProps {
  product: {
    name: string;
    description?: string | null;
    price: number;
    sale_price?: number | null;
    images?: string[] | null;
    slug: string;
    stock: number;
    categories?: { name: string } | null;
    keywords?: string[] | null;
  };
  rating?: { average: number; count: number } | null;
  siteUrl?: string;
}

const ProductSchema = ({ product, rating, siteUrl = "https://medea.tr" }: ProductSchemaProps) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || "",
      image: product.images?.[0] || "",
      url: `${siteUrl}/urun/${product.slug}`,
      category: product.categories?.name || "",
      brand: {
        "@type": "Brand",
        name: "MEDEA Kozmetik",
      },
      ...(product.keywords && product.keywords.length > 0 && {
        keywords: product.keywords.join(", "),
      }),
      offers: {
        "@type": "Offer",
        price: product.sale_price || product.price,
        priceCurrency: "TRY",
        availability: product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: `${siteUrl}/urun/${product.slug}`,
        seller: {
          "@type": "Organization",
          name: "MEDEA Kozmetik",
        },
      },
      ...(rating && rating.count > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating.average.toFixed(1),
          reviewCount: rating.count,
          bestRating: "5",
          worstRating: "1",
        },
      }),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    script.id = `product-schema-${product.slug}`;
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById(`product-schema-${product.slug}`);
      if (existing) existing.remove();
    };
  }, [product, rating, siteUrl]);

  return null;
};

export default ProductSchema;
