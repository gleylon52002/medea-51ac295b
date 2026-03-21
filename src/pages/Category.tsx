import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { useCategoryBySlug } from "@/hooks/useCategories";
import { useProductsByCategory } from "@/hooks/useProducts";
import SEOHead from "@/components/SEOHead";

const categoryMeta: Record<string, { title: string; description: string; h1: string; intro: string }> = {
  "dogal-sabunlar": {
    title: "Doğal Sabunlar – El Yapımı Katı Sabun Çeşitleri | MEDEA Kozmetik",
    description: "MEDEA el yapımı doğal sabun koleksiyonu. Limonlu, sütlü, karbonlu ve daha fazla doğal katı sabun çeşidi. Kimyasal katkısız, cilde nazik.",
    h1: "Doğal El Yapımı Sabunlar",
    intro: "MEDEA doğal sabun koleksiyonu, Ege'nin bereketli topraklarından özenle seçilmiş bitkisel yağlar ve doğal esanslarla, geleneksel soğuk presleme yöntemiyle el emeğiyle üretilir. Limon esanslı, inek sütlü, aktif karbonlu ve daha birçok çeşidiyle cildinize en doğal bakımı sunun. Tüm katı sabunlarımız kimyasal katkı maddesi, paraben ve SLS içermez. MEDEA doğal sabunlarıyla cildinizi nazikçe temizlerken doğal nemini koruyun.",
  },
  "yuz-maskeleri": {
    title: "Doğal Yüz Maskeleri – Bitkisel Cilt Bakımı | MEDEA Kozmetik",
    description: "MEDEA doğal yüz maskeleri. Bitkisel içerikli, kimyasal katkısız yüz maskesi çeşitleri ile cildinizi doğal yollarla besleyin.",
    h1: "Doğal Yüz Maskeleri",
    intro: "MEDEA doğal yüz maskeleri, bitkisel içerikler ve doğal kil çeşitleriyle cildinizi derinlemesine temizler, besler ve yeniler. Kimyasal katkısız formüllerimiz hassas ciltler dahil tüm cilt tipleri için uygundur. Düzenli kullanımla cildinizin doğal parlaklığını ve canlılığını yeniden kazanın.",
  },
  "mumlar": {
    title: "El Yapımı Doğal Mumlar – Aromalı Mum Çeşitleri | MEDEA Kozmetik",
    description: "MEDEA el yapımı aromalı doğal mumlar. Ortamınıza huzur katan, doğal içerikli mum çeşitleri. Hediye ve dekorasyon için ideal.",
    h1: "El Yapımı Doğal Mumlar",
    intro: "MEDEA el yapımı doğal mumlar, soya mumu bazlı, doğal esanslarla zenginleştirilmiş özel formülleriyle evinize huzur ve doğallık katar. Aromaterapi etkili mumlarımız ortamınızı güzelleştirirken ruhunuzu da dinlendirir. Hediye paketi seçeneğiyle sevdiklerinize de doğal güzellik sunabilirsiniz.",
  },
};

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(slug || "");
  const { data: products, isLoading: productsLoading } = useProductsByCategory(slug || "");

  const meta = slug ? categoryMeta[slug] : undefined;

  // BreadcrumbList JSON-LD
  useEffect(() => {
    if (!category) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: "https://medea.tr" },
        { "@type": "ListItem", position: 2, name: "Ürünler", item: "https://medea.tr/urunler" },
        { "@type": "ListItem", position: 3, name: category.name, item: `https://medea.tr/kategori/${slug}` },
      ],
    };
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: category.name,
      numberOfItems: products?.length || 0,
      itemListElement: (products || []).map((p: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://medea.tr/urun/${p.slug}`,
        name: p.name,
      })),
    };
    const s1 = document.createElement("script");
    s1.type = "application/ld+json";
    s1.id = "category-breadcrumb-schema";
    s1.textContent = JSON.stringify(schema);
    document.head.appendChild(s1);

    const s2 = document.createElement("script");
    s2.type = "application/ld+json";
    s2.id = "category-itemlist-schema";
    s2.textContent = JSON.stringify(itemListSchema);
    document.head.appendChild(s2);

    return () => {
      document.getElementById("category-breadcrumb-schema")?.remove();
      document.getElementById("category-itemlist-schema")?.remove();
    };
  }, [category, products, slug]);

  if (categoryLoading || productsLoading) {
    return (
      <Layout>
        <div className="container-main py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="font-serif text-2xl font-medium mb-4">Kategori Bulunamadı</h1>
          <Button asChild>
            <Link to="/urunler">Ürünlere Dön</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={meta?.title || `${category.name} | MEDEA Kozmetik – Doğal & El Yapımı`}
        description={meta?.description || category.meta_description || `MEDEA ${category.name} koleksiyonu. Doğal, el yapımı, kimyasal katkısız ürünler.`}
        canonical={`https://medea.tr/kategori/${slug}`}
      />
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/urunler" className="hover:text-foreground transition-colors">Ürünler</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
            {meta?.h1 || category.name}
          </h1>
          {meta?.intro && (
            <p className="mt-3 text-muted-foreground leading-relaxed max-w-3xl">
              {meta.intro}
            </p>
          )}
          {!meta?.intro && category.description && (
            <p className="mt-2 text-muted-foreground">{category.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {products?.length || 0} ürün bulundu
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product, index) => (
            <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">Bu kategoride henüz ürün bulunmuyor.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Category;
