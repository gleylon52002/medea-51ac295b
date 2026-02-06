import { useState } from "react";
import { Save, Loader2, User, Building2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSellerProfile } from "@/hooks/useSeller";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const SellerSettings = () => {
  const { data: seller, isLoading } = useSellerProfile();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    city: "",
    district: "",
    bank_name: "",
    iban: "",
    account_holder: "",
  });

  // Initialize form when seller data loads
  useState(() => {
    if (seller) {
      setFormData({
        phone: seller.phone || "",
        address: seller.address || "",
        city: seller.city || "",
        district: seller.district || "",
        bank_name: seller.bank_name || "",
        iban: seller.iban || "",
        account_holder: seller.account_holder || "",
      });
    }
  });

  const handleSave = async () => {
    if (!seller) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("sellers")
        .update({
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          bank_name: formData.bank_name,
          iban: formData.iban,
          account_holder: formData.account_holder,
        })
        .eq("id", seller.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      toast.success("Bilgileriniz güncellendi");
    } catch (error) {
      toast.error("Güncelleme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!seller) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ayarlar</h1>
          <p className="text-muted-foreground">Satıcı bilgilerinizi güncelleyin</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Kaydet
        </Button>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Firma Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Firma Adı</Label>
              <Input value={seller.company_name} disabled />
              <p className="text-xs text-muted-foreground mt-1">
                Firma adı değiştirilemez
              </p>
            </div>
            <div>
              <Label>Vergi No</Label>
              <Input value={seller.tax_number} disabled />
            </div>
          </div>
          <div>
            <Label>Telefon</Label>
            <Input
              value={formData.phone || seller.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Adres</Label>
            <Input
              value={formData.address || seller.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Şehir</Label>
              <Input
                value={formData.city || seller.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>İlçe</Label>
              <Input
                value={formData.district || seller.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Banka Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Banka Adı</Label>
            <Input
              value={formData.bank_name || seller.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            />
          </div>
          <div>
            <Label>IBAN</Label>
            <Input
              value={formData.iban || seller.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              maxLength={26}
            />
          </div>
          <div>
            <Label>Hesap Sahibi</Label>
            <Input
              value={formData.account_holder || seller.account_holder}
              onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Hesap Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Komisyon Oranı</p>
              <p className="text-xl font-bold">%{seller.commission_rate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hesap Durumu</p>
              <p className="text-xl font-bold capitalize">
                {seller.status === "active" ? "Aktif" : 
                 seller.status === "suspended" ? "Askıda" : "Yasaklı"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Üyelik Tarihi</p>
              <p className="text-xl font-bold">
                {new Date(seller.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerSettings;
