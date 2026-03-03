import { Leaf, Droplets, Recycle, Heart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SustainabilityBadgesProps {
  tags: string[];
  size?: "sm" | "md";
  maxShow?: number;
}

const TAG_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  "vegan": { icon: Leaf, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Vegan" },
  "doğal": { icon: Droplets, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Doğal" },
  "organik": { icon: Sparkles, color: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400", label: "Organik" },
  "el yapımı": { icon: Heart, color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400", label: "El Yapımı" },
  "plastik içermez": { icon: Recycle, color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400", label: "Plastik İçermez" },
};

const SustainabilityBadges = ({ tags, size = "sm", maxShow = 3 }: SustainabilityBadgesProps) => {
  const sustainabilityTags = tags.filter(t => TAG_CONFIG[t.toLowerCase()]);
  const visibleTags = sustainabilityTags.slice(0, maxShow);

  if (visibleTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map(tag => {
        const config = TAG_CONFIG[tag.toLowerCase()];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <span
            key={tag}
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.color} ${size === "md" ? "px-2 py-1 text-xs" : ""}`}
          >
            <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
            {config.label}
          </span>
        );
      })}
      {sustainabilityTags.length > maxShow && (
        <span className="text-[10px] text-muted-foreground">+{sustainabilityTags.length - maxShow}</span>
      )}
    </div>
  );
};

export default SustainabilityBadges;
