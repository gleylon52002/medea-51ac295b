import { Truck, Shield, Leaf, Heart } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Ücretsiz Kargo",
    description: "300₺ üzeri siparişlerde ücretsiz kargo",
  },
  {
    icon: Shield,
    title: "Güvenli Ödeme",
    description: "256-bit SSL ile korunan ödeme altyapısı",
  },
  {
    icon: Leaf,
    title: "Doğal İçerik",
    description: "%100 doğal ve organik içerikler",
  },
  {
    icon: Heart,
    title: "Cruelty-Free",
    description: "Hayvanlar üzerinde test edilmemiştir",
  },
];

const Features = () => {
  return (
    <section className="py-12 lg:py-16 border-y border-border bg-background">
      <div className="container-main">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
