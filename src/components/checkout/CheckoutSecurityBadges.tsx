import { Shield, Lock, RotateCcw, BadgeCheck } from "lucide-react";

const CheckoutSecurityBadges = () => {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
        <Lock className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-green-700 dark:text-green-400">256-bit SSL Şifreleme</p>
          <p className="text-[10px] text-green-600 dark:text-green-500">Tüm bilgileriniz güvenle şifrelenir</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-[10px] font-medium text-foreground">100% Güvenli Ödeme</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
          <RotateCcw className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-[10px] font-medium text-foreground">30 Gün İade Garantisi</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
          <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-[10px] font-medium text-foreground">Orijinal Ürün</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
          <Lock className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-[10px] font-medium text-foreground">3D Secure</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSecurityBadges;
