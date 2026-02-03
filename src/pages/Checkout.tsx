import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CreditCard, Truck, MapPin, Check, Loader2, ShoppingBag, Wallet, Banknote, Building2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { useIncrementCouponUsage, Coupon } from "@/hooks/useCoupons";
import { useAuth } from "@/contexts/AuthContext";
import CouponInput from "@/components/checkout/CouponInput";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type PaymentMethodType = "credit-card" | "bank-transfer" | "cash-on-delivery" | "shopier" | "shopinext" | "payizone";
type DbPaymentMethod = Database["public"]["Enums"]["payment_method"];

const paymentMethodMap: Record<PaymentMethodType, DbPaymentMethod> = {
  "credit-card": "credit_card",
  "bank-transfer": "bank_transfer",
  "cash-on-delivery": "cash_on_delivery",
  "shopier": "shopier",
  "shopinext": "shopinext",
  "payizone": "payizone",
};

interface PaymentMethodConfig {
  key: PaymentMethodType;
  dbKey: DbPaymentMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const allPaymentMethods: PaymentMethodConfig[] = [
  { key: "credit-card", dbKey: "credit_card", title: "Kredi / Banka Kartı", description: "Güvenli ödeme ile anında onay", icon: <CreditCard className="h-5 w-5 text-muted-foreground" /> },
  { key: "bank-transfer", dbKey: "bank_transfer", title: "Havale / EFT", description: "Banka havalesi ile ödeme", icon: <Building2 className="h-5 w-5 text-muted-foreground" /> },
  { key: "cash-on-delivery", dbKey: "cash_on_delivery", title: "Kapıda Ödeme", description: "Teslimat sırasında nakit veya kart ile ödeme", icon: <Truck className="h-5 w-5 text-muted-foreground" /> },
  { key: "shopier", dbKey: "shopier", title: "Shopier", description: "Shopier ile güvenli ödeme", icon: <ShoppingBag className="h-5 w-5 text-muted-foreground" /> },
  { key: "shopinext", dbKey: "shopinext", title: "ShopiNext", description: "ShopiNext ile hızlı ödeme", icon: <Wallet className="h-5 w-5 text-muted-foreground" /> },
  { key: "payizone", dbKey: "payizone", title: "Payizone", description: "Payizone ile güvenli ödeme", icon: <Banknote className="h-5 w-5 text-muted-foreground" /> },
];

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { items, total } = cart;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const incrementCouponUsage = useIncrementCouponUsage();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("credit-card");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon: Coupon; discount: number } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
  });

  // Fetch active payment methods
  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Filter available payment methods
  const availablePaymentMethods = allPaymentMethods.filter(method => 
    paymentSettings?.some(ps => ps.method === method.dbKey && ps.is_active)
  );

  // Set first available payment method as default
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.find(m => m.key === paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0].key);
    }
  }, [availablePaymentMethods, paymentMethod]);

  // Get bank transfer config
  const bankTransferConfig = paymentSettings?.find(ps => ps.method === "bank_transfer")?.config as { iban?: string; bank_name?: string; account_holder?: string } | null;

  const shippingCost = total >= 300 ? 0 : 29.90;
  const discountAmount = appliedCoupon?.discount || 0;
  const grandTotal = total - discountAmount + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async () => {
    if (!termsAccepted) {
      toast({
        title: "Hata",
        description: "Lütfen sözleşmeleri kabul edin.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createOrder.mutateAsync({
        items,
        shippingAddress: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          postal_code: formData.postalCode,
        },
        paymentMethod: paymentMethodMap[paymentMethod],
        subtotal: total,
        shippingCost,
        total: grandTotal,
        couponCode: appliedCoupon?.coupon.code,
        discountAmount: discountAmount,
      });

      // If coupon was used, record it
      if (appliedCoupon) {
        await incrementCouponUsage.mutateAsync({
          couponId: appliedCoupon.coupon.id,
          orderId: result.order.id,
          userId: user?.id,
        });
      }

      // Handle external payment providers
      if (["shopier", "shopinext", "payizone"].includes(paymentMethod)) {
        // Call create-payment edge function to get payment URL
        try {
          const { data, error } = await supabase.functions.invoke("create-payment", {
            body: {
              orderId: result.order.id,
              orderNumber: result.orderNumber,
              amount: grandTotal,
              provider: paymentMethod,
              customerName: `${formData.firstName} ${formData.lastName}`,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              returnUrl: `${window.location.origin}/siparis-basarili`,
            },
          });

          if (error) throw error;

          // For demo purposes, show success message
          // In production, this would redirect to payment provider
          toast({
            title: "Ödeme Sayfasına Yönlendiriliyorsunuz",
            description: "Lütfen bekleyin...",
          });

          // Simulate payment redirect (in production, use actual URL)
          clearCart();
          setAppliedCoupon(null);
          navigate(`/siparis-basarili?order=${result.orderNumber}&payment=pending`);
          return;
        } catch (paymentError) {
          console.error("Payment creation error:", paymentError);
          toast({
            title: "Ödeme Başlatılamadı",
            description: "Lütfen farklı bir ödeme yöntemi deneyin.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      toast({
        title: "Siparişiniz Alındı!",
        description: `Sipariş numaranız: ${result.orderNumber}`,
      });
      
      clearCart();
      setAppliedCoupon(null);
      navigate(`/siparis-basarili?order=${result.orderNumber}`);
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast({
        title: "Hata",
        description: error.message || "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="font-serif text-2xl font-medium mb-4">Sepetiniz Boş</h1>
          <p className="text-muted-foreground mb-6">
            Ödeme yapabilmek için sepetinize ürün eklemelisiniz.
          </p>
          <Button asChild>
            <Link to="/urunler">Alışverişe Başla</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-6 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 lg:mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Ödeme</span>
        </nav>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 lg:mb-12">
          {[
            { num: 1, label: "Teslimat" },
            { num: 2, label: "Ödeme" },
            { num: 3, label: "Onay" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : s.num}
                </div>
                <span className={`text-xs sm:text-sm ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className="w-6 sm:w-12 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-lg sm:text-xl font-medium">Teslimat Bilgileri</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Adınız"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0532 123 45 67"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Mahalle, Sokak, Bina No, Daire No"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">İl</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="İstanbul"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe</Label>
                    <Input
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Kadıköy"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="postalCode">Posta Kodu</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="34000"
                    />
                  </div>
                </div>

                <Button onClick={() => setStep(2)} className="w-full sm:w-auto">
                  Ödemeye Geç
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-lg sm:text-xl font-medium">Ödeme Yöntemi</h2>
                </div>

                {availablePaymentMethods.length === 0 ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-muted-foreground">Aktif ödeme yöntemi bulunmuyor.</p>
                  </div>
                ) : (
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethodType)}>
                    <div className="space-y-3">
                      {availablePaymentMethods.map((method) => (
                        <label
                          key={method.key}
                          className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                            paymentMethod === method.key ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={method.key} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base">{method.title}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{method.description}</p>
                          </div>
                          {method.icon}
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {paymentMethod === "credit-card" && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Kart Numarası</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Son Kullanma</Label>
                        <Input id="expiry" placeholder="AA/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "bank-transfer" && bankTransferConfig && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="font-medium">Banka Hesap Bilgileri</p>
                    <p className="text-sm text-muted-foreground">
                      {bankTransferConfig.bank_name && <>Banka: {bankTransferConfig.bank_name}<br /></>}
                      {bankTransferConfig.iban && <>IBAN: {bankTransferConfig.iban}<br /></>}
                      {bankTransferConfig.account_holder && <>Hesap Sahibi: {bankTransferConfig.account_holder}</>}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      * Açıklama kısmına sipariş numaranızı yazmayı unutmayın.
                    </p>
                  </div>
                )}

                {["shopier", "shopinext", "payizone"].includes(paymentMethod) && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Siparişi tamamladıktan sonra güvenli ödeme sayfasına yönlendirileceksiniz.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="order-2 sm:order-1">
                    Geri
                  </Button>
                  <Button onClick={() => setStep(3)} className="order-1 sm:order-2">
                    Siparişi Onayla
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Check className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-lg sm:text-xl font-medium">Sipariş Özeti</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">Teslimat Adresi</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.firstName} {formData.lastName}<br />
                      {formData.address}<br />
                      {formData.district}, {formData.city} {formData.postalCode}<br />
                      {formData.phone}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">Ödeme Yöntemi</p>
                    <p className="text-sm text-muted-foreground">
                      {availablePaymentMethods.find(m => m.key === paymentMethod)?.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    className="rounded mt-1" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms" className="text-muted-foreground leading-relaxed">
                    <Link to="/mesafeli-satis-sozlesmesi" className="text-primary hover:underline">
                      Mesafeli Satış Sözleşmesi
                    </Link>
                    'ni ve{" "}
                    <Link to="/gizlilik-politikasi" className="text-primary hover:underline">
                      Gizlilik Politikası
                    </Link>
                    'nı okudum, kabul ediyorum.
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting} className="order-2 sm:order-1">
                    Geri
                  </Button>
                  <Button onClick={handleSubmitOrder} disabled={isSubmitting || !termsAccepted} className="order-1 sm:order-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      "Siparişi Tamamla"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-muted/30 rounded-xl p-4 sm:p-6 border border-border">
              <h3 className="font-serif text-lg font-medium mb-4">Sepet Özeti</h3>
              
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images?.[0] || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Adet: {item.quantity}</p>
                      <p className="text-sm font-semibold">
                        {formatPrice((item.product.salePrice || item.product.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <CouponInput 
                orderTotal={total} 
                onApplyCoupon={setAppliedCoupon}
                appliedCoupon={appliedCoupon}
              />

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kargo</span>
                  <span>{shippingCost === 0 ? <span className="text-green-600">Ücretsiz</span> : formatPrice(shippingCost)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base sm:text-lg font-semibold">
                  <span>Toplam</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {shippingCost > 0 && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {formatPrice(300 - total)} daha ekleyin, ücretsiz kargo kazanın!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;