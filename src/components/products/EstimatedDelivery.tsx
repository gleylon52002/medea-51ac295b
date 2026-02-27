import { Truck, Clock } from "lucide-react";

interface EstimatedDeliveryProps {
  stock: number;
}

const EstimatedDelivery = ({ stock }: EstimatedDeliveryProps) => {
  if (stock === 0) return null;

  const now = new Date();
  const minDays = stock > 50 ? 1 : stock > 10 ? 2 : 3;
  const maxDays = minDays + 2;

  const addBusinessDays = (date: Date, days: number) => {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) added++;
    }
    return result;
  };

  const minDate = addBusinessDays(now, minDays);
  const maxDate = addBusinessDays(now, maxDays);

  const formatDate = (d: Date) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" });

  const isExpressEligible = now.getHours() < 14 && stock > 10;

  return (
    <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">Tahmini Teslimat:</span>
        <span className="font-medium text-foreground">
          {formatDate(minDate)} - {formatDate(maxDate)}
        </span>
      </div>
      {isExpressEligible && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <Clock className="h-3.5 w-3.5" />
          <span>14:00'e kadar sipariş verin, bugün kargolansın!</span>
        </div>
      )}
    </div>
  );
};

export default EstimatedDelivery;
