import { useState } from "react";
import { TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PriceHistoryProps {
  currentPrice: number;
  originalPrice?: number;
  productId: string;
}

const PriceHistory = ({ currentPrice, originalPrice, productId }: PriceHistoryProps) => {
  const [expanded, setExpanded] = useState(false);

  // Generate simulated price history based on current/original price
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const lowestPrice = hasDiscount ? currentPrice : currentPrice * 0.9;
  const highestPrice = originalPrice || currentPrice * 1.15;

  // Generate last 90 days data points
  const generateHistory = () => {
    const points: { date: string; price: number }[] = [];
    const now = new Date();
    for (let i = 90; i >= 0; i -= 7) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const variation = Math.sin(i / 15) * (highestPrice - lowestPrice) * 0.3;
      const price = i === 0 ? currentPrice : Math.max(lowestPrice, Math.min(highestPrice, currentPrice + variation));
      points.push({
        date: date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
        price: Math.round(price * 100) / 100,
      });
    }
    return points;
  };

  const history = generateHistory();
  const maxPrice = Math.max(...history.map(h => h.price));
  const minPrice = Math.min(...history.map(h => h.price));
  const priceRange = maxPrice - minPrice || 1;

  const trend = history[history.length - 1].price - history[Math.max(0, history.length - 5)].price;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {trend < 0 ? (
            <TrendingDown className="h-4 w-4 text-green-600" />
          ) : trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Fiyat Geçmişi (Son 90 Gün)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            En düşük: {formatPrice(minPrice)}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Simple SVG chart */}
          <div className="relative h-32 w-full">
            <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${productId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={history.map((point, i) => {
                  const x = (i / (history.length - 1)) * 400;
                  const y = 110 - ((point.price - minPrice) / priceRange) * 100;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ") + ` L 400 120 L 0 120 Z`}
                fill={`url(#grad-${productId})`}
              />
              {/* Line */}
              <path
                d={history.map((point, i) => {
                  const x = (i / (history.length - 1)) * 400;
                  const y = 110 - ((point.price - minPrice) / priceRange) * 100;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ")}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
              {/* Current price dot */}
              <circle
                cx="400"
                cy={110 - ((currentPrice - minPrice) / priceRange) * 100}
                r="4"
                fill="hsl(var(--primary))"
              />
            </svg>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>90 gün önce</span>
            <span>Bugün</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted/30 rounded">
              <p className="text-[10px] text-muted-foreground">En Düşük</p>
              <p className="text-sm font-semibold text-green-600">{formatPrice(minPrice)}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded">
              <p className="text-[10px] text-muted-foreground">Ortalama</p>
              <p className="text-sm font-semibold">{formatPrice(history.reduce((s, h) => s + h.price, 0) / history.length)}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded">
              <p className="text-[10px] text-muted-foreground">En Yüksek</p>
              <p className="text-sm font-semibold text-red-500">{formatPrice(maxPrice)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistory;
