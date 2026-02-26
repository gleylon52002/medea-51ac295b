import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface InstallmentCalculatorProps {
  price: number;
  className?: string;
  variant?: "inline" | "overlay";
}

const INSTALLMENT_OPTIONS = [
  { months: 2, rate: 0 },
  { months: 3, rate: 0 },
  { months: 6, rate: 1.49 },
  { months: 9, rate: 2.29 },
  { months: 12, rate: 3.19 },
];

const InstallmentCalculator = ({ price, className = "", variant = "inline" }: InstallmentCalculatorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const lowestMonthly = price / 12;

  if (variant === "inline") {
    return (
      <div className={className}>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <CreditCard className="h-4 w-4" />
          12 taksit × {formatPrice(Math.ceil(lowestMonthly * 1.0319))}
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
            <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-foreground">Taksit Seçenekleri</h3>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Ürün fiyatı: <span className="font-semibold text-foreground">{formatPrice(price)}</span>
              </p>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground">Taksit</th>
                      <th className="text-right p-3 font-medium text-foreground">Aylık</th>
                      <th className="text-right p-3 font-medium text-foreground">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="p-3 text-foreground font-medium">Peşin</td>
                      <td className="p-3 text-right text-foreground">{formatPrice(price)}</td>
                      <td className="p-3 text-right text-foreground font-semibold">{formatPrice(price)}</td>
                    </tr>
                    {INSTALLMENT_OPTIONS.map(({ months, rate }) => {
                      const total = price * (1 + rate / 100);
                      const monthly = total / months;
                      return (
                        <tr key={months} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-foreground">
                            {months} Taksit
                            {rate === 0 && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                Faizsiz
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right text-foreground">{formatPrice(monthly)}</td>
                          <td className="p-3 text-right text-foreground font-semibold">{formatPrice(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                * Taksit seçenekleri bankanıza göre farklılık gösterebilir.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default InstallmentCalculator;
