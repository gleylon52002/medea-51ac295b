import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

const Categories = () => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container-main flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="container-main">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
            Kategoriler
          </h2>
          <p className="mt-2 text-muted-foreground">
            İhtiyacınıza uygun ürünleri keşfedin
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/kategori/${category.slug}`}
              className="group animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-card shadow-soft group-hover:shadow-medium transition-all duration-300">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                  <h3 className="font-serif text-lg font-medium text-white mb-1">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
