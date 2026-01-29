import { Shield, Truck, RotateCcw, CreditCard, Leaf, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgesProps {
  variant?: "horizontal" | "grid";
  className?: string;
}

const badges = [
  {
    icon: Shield,
    title: "Güvenli Alışveriş",
    description: "256-bit SSL şifreleme",
  },
  {
    icon: Truck,
    title: "Hızlı Teslimat",
    description: "1-3 iş günü içinde kargo",
  },
  {
    icon: RotateCcw,
    title: "Kolay İade",
    description: "14 gün içinde ücretsiz iade",
  },
  {
    icon: CreditCard,
    title: "Taksit İmkanı",
    description: "9 taksit seçeneği",
  },
  {
    icon: Leaf,
    title: "%100 Doğal",
    description: "Organik ve vegan",
  },
  {
    icon: Award,
    title: "Kalite Garantisi",
    description: "Orijinal ürün garantisi",
  },
];

const TrustBadges = ({ variant = "horizontal", className }: TrustBadgesProps) => {
  if (variant === "horizontal") {
    return (
      <div className={cn(
        "flex flex-wrap items-center justify-center gap-8 py-6 px-4 bg-muted/30 rounded-xl",
        className
      )}>
        {badges.slice(0, 4).map((badge) => (
          <div key={badge.title} className="flex items-center gap-2 text-center">
            <badge.icon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{badge.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-3 gap-4",
      className
    )}>
      {badges.map((badge) => (
        <div
          key={badge.title}
          className="flex flex-col items-center text-center p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
        >
          <div className="p-3 bg-primary/10 rounded-full mb-3">
            <badge.icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium text-sm text-foreground">{badge.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
