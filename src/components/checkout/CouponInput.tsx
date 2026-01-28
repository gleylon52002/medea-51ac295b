import { useState } from "react";
import { Tag, X, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useValidateCoupon, Coupon } from "@/hooks/useCoupons";
import { formatPrice } from "@/lib/utils";

interface CouponInputProps {
  orderTotal: number;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  onApplyCoupon: (result: { coupon: Coupon; discount: number } | null) => void;
}

const CouponInput = ({ orderTotal, appliedCoupon, onApplyCoupon }: CouponInputProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const validateCoupon = useValidateCoupon();

  const handleApply = async () => {
    if (!code.trim()) return;
    setError("");

    try {
      const result = await validateCoupon.mutateAsync({
        code: code.trim(),
        orderTotal,
      });
      onApplyCoupon(result);
      setCode("");
    } catch (err: any) {
      setError(err.message || "Kupon uygulanamadı");
    }
  };

  const handleRemove = () => {
    onApplyCoupon(null);
    setError("");
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Kupon uygulandı: {appliedCoupon.coupon.code}
              </p>
              <p className="text-sm text-green-600">
                {appliedCoupon.coupon.discount_type === "percentage"
                  ? `%${appliedCoupon.coupon.discount_value} indirim`
                  : `${formatPrice(appliedCoupon.coupon.discount_value)} indirim`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-sm font-medium text-green-700">
          Toplam indirim: -{formatPrice(appliedCoupon.discount)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kupon kodu"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || validateCoupon.isPending}
        >
          {validateCoupon.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Uygula"
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default CouponInput;
