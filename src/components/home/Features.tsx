import { Truck, Shield, Leaf, Heart } from "lucide-react";
import TranslatedText from "@/components/TranslatedText";

const features = [
  {
    icon: Truck,
    titleKey: "features.free_shipping",
    title: "Ücretsiz Kargo",
    descKey: "features.free_shipping_desc",
    description: "300₺ üzeri siparişlerde ücretsiz kargo",
  },
  {
    icon: Shield,
    titleKey: "features.secure_payment",
    title: "Güvenli Ödeme",
    descKey: "features.secure_payment_desc",
    description: "256-bit SSL ile korunan ödeme altyapısı",
  },
  {
    icon: Leaf,
    titleKey: "features.natural",
    title: "Doğal İçerik",
    descKey: "features.natural_desc",
    description: "%100 doğal ve organik içerikler",
  },
  {
    icon: Heart,
    titleKey: "features.cruelty_free",
    title: "Cruelty-Free",
    descKey: "features.cruelty_free_desc",
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
              <h3 className="font-medium text-foreground mb-1">
                <TranslatedText textKey={feature.titleKey} originalText={feature.title} />
              </h3>
              <p className="text-sm text-muted-foreground">
                <TranslatedText textKey={feature.descKey} originalText={feature.description} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
