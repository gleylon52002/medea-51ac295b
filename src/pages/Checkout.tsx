import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CreditCard, Truck, MapPin, Check } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { items, total } = cart;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  
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

  const shippingCost = total >= 300 ? 0 : 29.90;
  const grandTotal = total + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = () => {
    toast({
      title: "Siparişiniz Alındı!",
      description: "Siparişiniz başarıyla oluşturuldu. E-posta adresinize onay gönderildi.",
    });
    clearCart();
    navigate("/siparis-basarili");
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
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Ödeme</span>
        </nav>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: "Teslimat" },
            { num: 2, label: "Ödeme" },
            { num: 3, label: "Onay" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className={step >= s.num ? "text-foreground" : "text-muted-foreground"}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className="w-12 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-xl font-medium">Teslimat Bilgileri</h2>
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

                <div className="grid sm:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
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
                  <h2 className="font-serif text-xl font-medium">Ödeme Yöntemi</h2>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">
                    <label
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "credit-card" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value="credit-card" />
                      <div className="flex-1">
                        <p className="font-medium">Kredi / Banka Kartı</p>
                        <p className="text-sm text-muted-foreground">Güvenli ödeme ile anında onay</p>
                      </div>
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </label>

                    <label
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "bank-transfer" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value="bank-transfer" />
                      <div className="flex-1">
                        <p className="font-medium">Havale / EFT</p>
                        <p className="text-sm text-muted-foreground">Banka havalesi ile ödeme</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "cash-on-delivery" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value="cash-on-delivery" />
                      <div className="flex-1">
                        <p className="font-medium">Kapıda Ödeme</p>
                        <p className="text-sm text-muted-foreground">Teslimat sırasında nakit veya kart ile ödeme</p>
                      </div>
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    </label>
                  </div>
                </RadioGroup>

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

                {paymentMethod === "bank-transfer" && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="font-medium">Banka Hesap Bilgileri</p>
                    <p className="text-sm text-muted-foreground">
                      Banka: Ziraat Bankası<br />
                      IBAN: TR00 0000 0000 0000 0000 0000 00<br />
                      Hesap Sahibi: MEDEA Kozmetik Ltd. Şti.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      * Açıklama kısmına sipariş numaranızı yazmayı unutmayın.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Geri
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Siparişi Onayla
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Check className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-xl font-medium">Sipariş Özeti</h2>
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
                      {paymentMethod === "credit-card" && "Kredi / Banka Kartı"}
                      {paymentMethod === "bank-transfer" && "Havale / EFT"}
                      {paymentMethod === "cash-on-delivery" && "Kapıda Ödeme"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" id="terms" className="rounded" />
                  <label htmlFor="terms">
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

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Geri
                  </Button>
                  <Button onClick={handleSubmitOrder}>
                    Siparişi Tamamla
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-xl p-6 sticky top-24">
              <h3 className="font-serif text-lg font-medium mb-4">Sipariş Özeti</h3>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Adet: {item.quantity}</p>
                      <p className="text-sm font-medium">
                        {formatPrice((item.product.salePrice || item.product.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kargo</span>
                  <span>{shippingCost === 0 ? "Ücretsiz" : formatPrice(shippingCost)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold">
                <span>Toplam</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>

              {total < 300 && (
                <p className="text-xs text-muted-foreground mt-4">
                  {formatPrice(300 - total)} daha ekleyin, kargo bedava!
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
