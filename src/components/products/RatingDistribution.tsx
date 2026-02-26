import { Star } from "lucide-react";

interface RatingDistributionProps {
  reviews: { rating: number }[];
}

const RatingDistribution = ({ reviews }: RatingDistributionProps) => {
  if (!reviews || reviews.length === 0) return null;

  const total = reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percent = total > 0 ? (count / total) * 100 : 0;
    return { star, count, percent };
  });

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 bg-muted/30 rounded-xl mb-6">
      {/* Average Score */}
      <div className="flex flex-col items-center justify-center min-w-[120px]">
        <span className="text-4xl font-bold text-foreground">{average.toFixed(1)}</span>
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i <= Math.round(average) ? "fill-terracotta text-terracotta" : "fill-muted text-muted"}`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground mt-1">{total} değerlendirme</span>
      </div>

      {/* Distribution Bars */}
      <div className="flex-1 space-y-2">
        {distribution.map(({ star, count, percent }) => (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground w-8 text-right">{star} ★</span>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground w-8">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingDistribution;
