import { useState } from "react";
import { Star, ShoppingCart, Loader2, Gift, Sparkles, CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSellerProfile } from "@/hooks/useSeller";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonus_points: number;
  is_active: boolean;
  sort_order: number;
}

const SellerBuyPoints = () => {
  const queryClient = useQueryClient();
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const [paymentStep, setPaymentStep] = useState<"card" | "processing" | "success">("card");

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["seller-point-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_point_packages" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as PointPackage[];
    },
  });

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const isCardValid = () => {
    const num = cardNumber.replace(/\s/g, "");
    const exp = cardExpiry.replace("/", "");
    return num.length === 16 && exp.length === 4 && cardCvc.length >= 3 && cardName.trim().length > 2;
  };

  const openPaymentDialog = (pkg: PointPackage) => {
    setSelectedPackage(pkg);
    setPaymentStep("card");
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardName("");
  };

  const handlePayment = async () => {
    if (!seller || !selectedPackage || !isCardValid()) return;
    setPurchasing(true);
    setPaymentStep("processing");

    try {
      // Simulate payment processing delay (real integration would call payment gateway)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const totalPoints = selectedPackage.points + selectedPackage.bonus_points;

      // Update seller reputation points
      const { error: updateError } = await supabase
        .from("sellers")
        .update({
          reputation_points: seller.reputation_points + totalPoints,
        })
        .eq("id", seller.id);

      if (updateError) throw updateError;

      // Record in points history
      await supabase.from("seller_points_history").insert({
        seller_id: seller.id,
        points: totalPoints,
        point_type: "purchased",
        reason: `${selectedPackage.name} paketi satın alındı (${selectedPackage.points}${selectedPackage.bonus_points > 0 ? ` + ${selectedPackage.bonus_points} bonus` : ""} puan)`,
      });

      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      queryClient.invalidateQueries({ queryKey: ["seller-points-history"] });

      setPaymentStep("success");
    } catch (error: any) {
      toast.error("Ödeme başarısız: " + error.message);
      setSelectedPackage(null);
    } finally {
      setPurchasing(false);
    }
  };

  if (sellerLoading || packagesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Puan Satın Al</h1>
        <p className="text-muted-foreground">
          İtibar puanı satın alarak ürünlerinizi öne çıkarın
        </p>
      </div>

      {/* Current Balance */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mevcut Bakiyeniz</p>
                <p className="text-3xl font-bold">{seller?.reputation_points || 0} <span className="text-base font-normal text-muted-foreground">puan</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Puan Paketleri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages?.map((pkg, index) => {
            const isPopular = index === 2;
            return (
              <Card
                key={pkg.id}
                className={`relative ${isPopular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Popüler
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>
                    {pkg.points} puan
                    {pkg.bonus_points > 0 && (
                      <span className="text-primary font-medium"> + {pkg.bonus_points} bonus</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{formatPrice(pkg.price)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(pkg.price / (pkg.points + pkg.bonus_points)).toFixed(2)} ₺ / puan
                    </p>
                  </div>

                  {pkg.bonus_points > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-primary">
                      <Gift className="h-4 w-4" />
                      <span>{pkg.bonus_points} bonus puan hediye!</span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => openPaymentDialog(pkg)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Satın Al
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Puanlar Ne İşe Yarar?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Ürünlerinizi ana sayfada ve kategori listelerinde öne çıkarabilirsiniz</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Öne çıkan ürünler daha fazla görünürlük ve satış elde eder</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Bonus puanlar sadece belirli paketlerle kazanılır</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <span>Puanlar iade edilemez, süresiz geçerlidir</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!selectedPackage} onOpenChange={(open) => !open && !purchasing && setSelectedPackage(null)}>
        <DialogContent className="sm:max-w-md">
          {paymentStep === "card" && selectedPackage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Ödeme Bilgileri
                </DialogTitle>
                <DialogDescription>
                  {selectedPackage.name} - {selectedPackage.points + selectedPackage.bonus_points} puan için {formatPrice(selectedPackage.price)} ödeme yapın
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Kart Üzerindeki İsim</Label>
                  <Input
                    placeholder="Ad Soyad"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kart Numarası</Label>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Son Kullanma</Label>
                    <Input
                      placeholder="AA/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Ödeme bilgileriniz 256-bit SSL ile şifrelenir ve güvenle işlenir.</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPackage(null)}>
                  İptal
                </Button>
                <Button onClick={handlePayment} disabled={!isCardValid()}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {formatPrice(selectedPackage.price)} Öde
                </Button>
              </DialogFooter>
            </>
          )}

          {paymentStep === "processing" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold text-lg">Ödeme İşleniyor...</p>
                <p className="text-sm text-muted-foreground mt-1">Lütfen sayfayı kapatmayın</p>
              </div>
            </div>
          )}

          {paymentStep === "success" && selectedPackage && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Ödeme Başarılı!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPackage.points + selectedPackage.bonus_points} puan hesabınıza eklendi
                </p>
              </div>
              <Button onClick={() => setSelectedPackage(null)} className="mt-2">
                Tamam
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerBuyPoints;
