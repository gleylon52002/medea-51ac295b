import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CreditCard, Truck, MapPin, Check, Loader2, ShoppingBag, Wallet, Banknote, Building2, Plus } from "lucide-react";
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
import { useAddresses } from "@/hooks/useAddresses";
import { useProfile } from "@/hooks/useProfile";
import CouponInput from "@/components/checkout/CouponInput";
import CheckoutSecurityBadges from "@/components/checkout/CheckoutSecurityBadges";
import { trackCheckoutStep, resetCheckoutSession } from "@/hooks/useCheckoutEvents";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useAffiliate";
import { usePersonalDiscounts } from "@/hooks/useUserCart";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBulkDiscounts, calculateBulkDiscount } from "@/hooks/useBulkDiscounts";

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
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const incrementCouponUsage = useIncrementCouponUsage();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("credit-card");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon: Coupon; discount: number } | null>(null);
  const { data: userAddresses } = useAddresses();
  const { data: profile } = useProfile();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const { data: wallet } = useWallet();
  const { data: siteSettings } = useSiteSettings();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { data: personalDiscounts } = usePersonalDiscounts();

  // Load referral code from session
  useEffect(() => {
    const code = sessionStorage.getItem("referral_code");
    if (code) setReferralCode(code);
  }, []);

  const shippingSettings = siteSettings?.shipping as { free_shipping_threshold?: number; default_shipping_cost?: number } | undefined;
  const freeShippingThreshold = shippingSettings?.free_shipping_threshold ?? 300;
  const defaultShippingCost = shippingSettings?.default_shipping_cost ?? 29.90;
  const computedShipping = total >= freeShippingThreshold ? 0 : defaultShippingCost;
  const { data: bulkRules } = useBulkDiscounts();
  const bulkResult = bulkRules ? calculateBulkDiscount(items, bulkRules) : { discount: 0, appliedRule: null };

  // Calculate personal discounts total
  const personalDiscountTotal = personalDiscounts?.reduce((sum, pd) => {
    const matchingItem = items.find(i => i.product.id === pd.product_id);
    if (matchingItem) return sum + pd.personal_discount;
    return sum;
  }, 0) || 0;

  const walletAmount = useWalletBalance && wallet ? Math.min(wallet.balance, total - (appliedCoupon?.discount || 0) - bulkResult.discount - personalDiscountTotal) : 0;
  const finalTotal = Math.max(0, total - (appliedCoupon?.discount || 0) - bulkResult.discount - personalDiscountTotal - walletAmount + computedShipping);

  const [identityNumber, setIdentityNumber] = useState("");
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

  // Pre-fill form from profile
  useEffect(() => {
    if (profile && !formData.firstName && !formData.lastName) {
      const names = (profile.full_name || "").split(" ");
      setFormData(prev => ({
        ...prev,
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [profile]);

  // Handle address selection
  useEffect(() => {
    if (selectedAddressId && userAddresses) {
      const addr = userAddresses.find(a => a.id === selectedAddressId);
      if (addr) {
        const names = (addr.full_name || "").split(" ");
        setFormData({
          firstName: names[0] || "",
          lastName: names.slice(1).join(" ") || "",
          email: formData.email, // Keep email from profile/initial
          phone: addr.phone || "",
          address: addr.address || "",
          city: addr.city || "",
          district: addr.district || "",
          postalCode: addr.postal_code || "",
        });
      }
    }
  }, [selectedAddressId, userAddresses]);

  // Fetch active payment methods
  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings_public")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Check if cart has seller products (require credit card only)
  const hasSellerProducts = items.some(item => item.product.sellerId);

  // Filter available payment methods (memoized to prevent infinite loops)
  const availablePaymentMethods = React.useMemo(() => {
    return allPaymentMethods.filter(method => {
      const isActive = paymentSettings?.some(ps => ps.method === method.dbKey && ps.is_active);
      if (!isActive) return false;
      if (hasSellerProducts && !["credit-card", "shopier", "shopinext", "payizone"].includes(method.key)) {
        return false;
      }
      return true;
    });
  }, [paymentSettings, hasSellerProducts]);

  // Set first available payment method as default
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.find(m => m.key === paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0].key);
    }
  }, [availablePaymentMethods, paymentMethod]);

  // Get bank transfer config
  // Bank transfer config is fetched separately only for admin display
  // For checkout, we just show a generic message
  const hasBankTransfer = paymentSettings?.some(ps => ps.method === "bank_transfer");

  const shippingCost = total >= freeShippingThreshold ? 0 : defaultShippingCost;
  const discountAmount = appliedCoupon?.discount || 0;

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
      trackCheckoutStep("order_confirmed");
      const result = await createOrder.mutateAsync({
        items,
        shippingAddress: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          postal_code: formData.postalCode,
        },
        paymentMethod: paymentMethodMap[paymentMethod],
        subtotal: total,
        shippingCost: shippingCost,
        total: finalTotal,
        notes: "",
        couponCode: appliedCoupon?.coupon.code,
        discountAmount: (appliedCoupon?.discount || 0) + walletAmount,
        referralCode,
        walletAmount,
        guestEmail: isGuestCheckout ? formData.email : undefined,
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
      if (["credit-card", "shopier", "shopinext", "payizone"].includes(paymentMethod)) {
        try {
          const { data, error } = await supabase.functions.invoke("create-payment", {
            body: {
              orderId: result.order.id,
              orderNumber: result.orderNumber,
              amount: finalTotal,
              provider: paymentMethod === "credit-card" ? "credit_card" : paymentMethod,
              customerName: `${formData.firstName} ${formData.lastName}`,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              returnUrl: `${window.location.origin}/siparis-basarili`,
            },
          });

          if (error) throw error;

          if (data?.redirect && data?.paymentUrl) {
            // Direct redirect to payment page
            toast({
              title: "Ödeme Sayfasına Yönlendiriliyorsunuz",
              description: "Lütfen bekleyin...",
            });
            clearCart();
            setAppliedCoupon(null);
            window.location.href = data.paymentUrl;
            return;
          } else if (data?.formPost && data?.paymentUrl && data?.paymentData) {
            // Form-based POST redirect (e.g., Shopier)
            const form = document.createElement("form");
            form.method = "POST";
            form.action = data.paymentUrl;
            form.style.display = "none";
            
            Object.entries(data.paymentData).forEach(([key, value]) => {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = key;
              input.value = String(value);
              form.appendChild(input);
            });
            
            document.body.appendChild(form);
            clearCart();
            setAppliedCoupon(null);
            form.submit();
            return;
          } else {
            // Fallback: no redirect URL available from provider
            toast({
              title: "Ödeme Başlatılamadı",
              description: "Ödeme sağlayıcısından yanıt alınamadı. Lütfen farklı bir yöntem deneyin.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
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

      // Send order confirmation email
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "order_confirmation",
            to: formData.email,
            orderId: result.order.id,
          },
        });
      } catch (emailErr) {
        console.error("Order confirmation email failed:", emailErr);
      }

      // Auto-generate invoice
      try {
        const invoiceNumber = `FTR-${result.orderNumber.replace('MDA-', '')}`;
        await supabase.from("invoices").insert({
          order_id: result.order.id,
          invoice_number: invoiceNumber,
          billing_info: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            district: formData.district,
            postal_code: formData.postalCode,
          },
          items: items.map(item => ({
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: (item.product.salePrice || item.product.price) + (item.priceAdjustment || 0),
            total_price: ((item.product.salePrice || item.product.price) + (item.priceAdjustment || 0)) * item.quantity,
          })),
          subtotal: total,
          tax_amount: total * 0.20,
          shipping_cost: shippingCost,
          discount_amount: discountAmount + walletAmount + bulkResult.discount,
          total: finalTotal,
        });
      } catch (invoiceErr) {
        console.error("Auto invoice creation failed:", invoiceErr);
      }

      // Earn loyalty points (10 points per 100₺)
      if (user) {
        try {
          const pointsToEarn = Math.floor(total / 100) * 10;
          if (pointsToEarn > 0) {
            const { data: existingLoyalty } = await supabase
              .from("loyalty_points")
              .select("id, points, total_earned")
              .eq("user_id", user.id)
              .maybeSingle();

            if (existingLoyalty) {
              const newTotal = existingLoyalty.total_earned + pointsToEarn;
              const tier = newTotal >= 10000 ? "platinum" : newTotal >= 5000 ? "gold" : newTotal >= 2000 ? "silver" : "bronze";
              await supabase.from("loyalty_points").update({
                points: existingLoyalty.points + pointsToEarn,
                total_earned: newTotal,
                tier,
                updated_at: new Date().toISOString(),
              }).eq("id", existingLoyalty.id);
            } else {
              const tier = pointsToEarn >= 10000 ? "platinum" : pointsToEarn >= 5000 ? "gold" : pointsToEarn >= 2000 ? "silver" : "bronze";
              await supabase.from("loyalty_points").insert({
                user_id: user.id,
                points: pointsToEarn,
                total_earned: pointsToEarn,
                tier,
              });
            }

            await supabase.from("loyalty_transactions").insert({
              user_id: user.id,
              points: pointsToEarn,
              transaction_type: "earn",
              description: `Sipariş: ${result.orderNumber} — ${pointsToEarn} puan kazanıldı`,
              order_id: result.order.id,
            });
          }
        } catch (loyaltyErr) {
          console.error("Loyalty points error:", loyaltyErr);
        }
      }

      toast({
        title: "Siparişiniz Alındı!",
        description: `Sipariş numaranız: ${result.orderNumber}`,
      });

      trackCheckoutStep("order_completed");
      resetCheckoutSession();
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

        {/* Guest Checkout Banner */}
        {!user && !isGuestCheckout && (
          <div className="mb-6 p-4 bg-muted/50 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium">Hesabınız var mı?</p>
              <p className="text-sm text-muted-foreground">Giriş yaparak siparişlerinizi takip edebilirsiniz veya misafir olarak devam edin.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/giris">Giriş Yap</Link>
              </Button>
              <Button size="sm" onClick={() => { setIsGuestCheckout(true); trackCheckoutStep("begin_checkout", { guest: true }); }}>
                Misafir Olarak Devam Et
              </Button>
            </div>
          </div>
        )}

        {!user && !isGuestCheckout && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Devam etmek için giriş yapın veya misafir ödeme seçeneğini kullanın.</p>
          </div>
        )}

        {(user || isGuestCheckout) && <>
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
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${step >= s.num
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

                {user && !isGuestCheckout && userAddresses && userAddresses.length > 0 && (
                  <div className="mb-8">
                    <Label className="text-sm font-medium mb-3 block">Kayıtlı Adresleriniz</Label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {userAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm">{addr.title}</p>
                            {addr.is_default && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Varsayılan</span>}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{addr.full_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{addr.address}</p>
                        </div>
                      ))}
                      <div
                        onClick={() => setSelectedAddressId(null)}
                        className={`p-3 border border-dashed rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:bg-muted/50 transition-all ${selectedAddressId === null ? "border-primary bg-primary/5" : "border-border"
                          }`}
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Yeni Adres Kullan</span>
                      </div>
                    </div>
                  </div>
                )}

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

                <Button onClick={() => {
                  // Validate shipping form
                  if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() || !formData.district.trim()) {
                    toast({
                      title: "Eksik Bilgi",
                      description: "Lütfen tüm teslimat bilgilerini doldurun.",
                      variant: "destructive",
                    });
                    return;
                  }
                  // Basic email validation
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    toast({
                      title: "Geçersiz E-posta",
                      description: "Lütfen geçerli bir e-posta adresi girin.",
                      variant: "destructive",
                    });
                    return;
                  }
                  trackCheckoutStep("shipping_info");
                  setStep(2);
                }} className="w-full sm:w-auto">
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

                {hasSellerProducts && (
                  <div className="p-3 bg-muted/50 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Sepetinizde satıcı ürünleri bulunduğu için yalnızca kredi kartı ile ödeme yapabilirsiniz.
                    </p>
                  </div>
                )}

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
                          className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === method.key ? "border-primary bg-primary/5" : "border-border"
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

                {paymentMethod === "cash-on-delivery" && (
                  <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800 font-medium">
                      <Truck className="h-5 w-5" />
                      <span>Kapıda Ödeme - Kimlik Doğrulama Gerekli</span>
                    </div>
                    <p className="text-sm text-amber-700">
                      Kapıda ödeme seçeneğini kullanabilmek için T.C. kimlik numaranızı girmeniz gerekmektedir. Bu bilgi güvenliğiniz için doğrulama amacıyla kullanılır.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="identityNumber">T.C. Kimlik Numarası <span className="text-destructive">*</span></Label>
                      <Input
                        id="identityNumber"
                        value={identityNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                          setIdentityNumber(val);
                        }}
                        placeholder="11 haneli T.C. kimlik numaranız"
                        maxLength={11}
                      />
                      {identityNumber && identityNumber.length !== 11 && (
                        <p className="text-xs text-destructive">T.C. kimlik numarası 11 haneli olmalıdır</p>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === "credit-card" && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Siparişi tamamladıktan sonra güvenli ödeme sayfasına yönlendirileceksiniz. 
                      Kart bilgileriniz ödeme sağlayıcısı üzerinden güvenle işlenecektir.
                    </p>
                  </div>
                )}

                {paymentMethod === "bank-transfer" && hasBankTransfer && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="font-medium">Banka Hesap Bilgileri</p>
                    <p className="text-sm text-muted-foreground">
                      Siparişinizi tamamladıktan sonra banka hesap bilgileri e-posta ile gönderilecektir.
                      Ödemenizi yaptıktan sonra dekontunuzu iletişim formundan bize ulaştırabilirsiniz.
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
                  <Button onClick={() => {
                    if (availablePaymentMethods.length === 0) {
                      toast({
                        title: "Ödeme Yöntemi Yok",
                        description: "Aktif bir ödeme yöntemi bulunmuyor.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (paymentMethod === "cash-on-delivery" && identityNumber.length !== 11) {
                      toast({
                        title: "Kimlik Doğrulama Gerekli",
                        description: "Kapıda ödeme için geçerli bir T.C. kimlik numarası girmelisiniz.",
                        variant: "destructive",
                      });
                      return;
                    }
                    trackCheckoutStep("payment_method", { method: paymentMethod });
                    setStep(3);
                  }} className="order-1 sm:order-2">
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
                {items.map((item) => {
                  const itemKey = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                  const itemPrice = (item.product.salePrice || item.product.price) + (item.priceAdjustment || 0);
                  return (
                    <div key={itemKey} className="flex gap-3">
                      <img
                        src={item.variant?.images?.[0] || item.product.images?.[0] || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product.name}
                          {item.variant && <span className="text-muted-foreground font-normal"> - {item.variant.name}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">Adet: {item.quantity}</p>
                        <p className="text-sm font-semibold">
                          {formatPrice(itemPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <CouponInput
                orderTotal={total}
                onApplyCoupon={setAppliedCoupon}
                appliedCoupon={appliedCoupon}
              />

              <Separator className="my-4" />

              {/* Wallet Usage */}
              {user && wallet && wallet.balance > 0 && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Cüzdan Bakiyesi</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{formatPrice(wallet.balance)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="use-wallet" className="text-xs cursor-pointer">Bakiyeyi bu siparişte kullan</Label>
                    <input
                      type="checkbox"
                      id="use-wallet"
                      className="accent-primary"
                      checked={useWalletBalance}
                      onChange={(e) => setUseWalletBalance(e.target.checked)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Kupon İndirimi ({appliedCoupon.coupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discount)}</span>
                  </div>
                )}
                {bulkResult.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Toplu Alım İndirimi{bulkResult.appliedRule ? ` (${bulkResult.appliedRule})` : ""}</span>
                    <span>-{formatPrice(bulkResult.discount)}</span>
                  </div>
                )}
                {personalDiscountTotal > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Kişiye Özel İndirim</span>
                    <span>-{formatPrice(personalDiscountTotal)}</span>
                  </div>
                {useWalletBalance && walletAmount > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Cüzdan Kullanımı</span>
                    <span>-{formatPrice(walletAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kargo</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Ücretsiz</span>
                  ) : (
                    <span>{formatPrice(shippingCost)}</span>
                  )}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {shippingCost > 0 && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {formatPrice(freeShippingThreshold - total)} daha ekleyin, ücretsiz kargo kazanın!
                </p>
              )}

              <CheckoutSecurityBadges />
            </div>
          </div>
        </div>
        </>}
      </div>
    </Layout>
  );
};

export default Checkout;