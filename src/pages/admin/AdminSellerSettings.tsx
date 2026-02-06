import { useState } from "react";
import { Save, Loader2, Settings, Percent, Star, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSellerSettings } from "@/hooks/useSeller";
import { useUpdateSellerSettings } from "@/hooks/useAdminSellers";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSellerSettings = () => {
  const { data: settings, isLoading } = useSellerSettings();
  const updateSettings = useUpdateSellerSettings();

  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getValue = (key: string) => {
    return formData[key] ?? String(settings?.[key] || "");
  };

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Satıcı Ayarları</h1>
          <p className="text-muted-foreground">Komisyon oranları ve puan sistemini yapılandırın</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Kaydet
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Komisyon Ayarları
            </CardTitle>
            <CardDescription>
              Satıcılardan kesilecek varsayılan komisyon oranı
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Varsayılan Komisyon Oranı (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={getValue("default_commission_rate")}
                  onChange={(e) => handleChange("default_commission_rate", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Yeni satıcılara otomatik uygulanan oran
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reputation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Takdir Puanı Ayarları
            </CardTitle>
            <CardDescription>
              Satıcıların takdir puanı kazanma kuralları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Başarılı Satış Başına</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("reputation_per_sale")}
                  onChange={(e) => handleChange("reputation_per_sale", e.target.value)}
                />
              </div>
              <div>
                <Label>5 Yıldız Değerlendirme</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("reputation_per_5star")}
                  onChange={(e) => handleChange("reputation_per_5star", e.target.value)}
                />
              </div>
              <div>
                <Label>4 Yıldız Değerlendirme</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("reputation_per_4star")}
                  onChange={(e) => handleChange("reputation_per_4star", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Öne Çıkarma İçin Minimum Puan</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("min_reputation_for_feature")}
                  onChange={(e) => handleChange("min_reputation_for_feature", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ürün öne çıkarma özelliği için gereken minimum takdir puanı
                </p>
              </div>
              <div>
                <Label>Öne Çıkarma Maliyeti (Puan/Gün)</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("feature_cost_per_day")}
                  onChange={(e) => handleChange("feature_cost_per_day", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1 gün öne çıkarma için harcanacak puan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Penalty Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Ceza Puanı Ayarları
            </CardTitle>
            <CardDescription>
              Satıcılara uygulanacak ceza puanı kuralları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Sipariş İptali</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("penalty_per_cancel")}
                  onChange={(e) => handleChange("penalty_per_cancel", e.target.value)}
                />
              </div>
              <div>
                <Label>Onaylı Şikayet</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("penalty_per_complaint")}
                  onChange={(e) => handleChange("penalty_per_complaint", e.target.value)}
                />
              </div>
              <div>
                <Label>1 Yıldız Değerlendirme</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("penalty_per_1star")}
                  onChange={(e) => handleChange("penalty_per_1star", e.target.value)}
                />
              </div>
              <div>
                <Label>2 Yıldız Değerlendirme</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("penalty_per_2star")}
                  onChange={(e) => handleChange("penalty_per_2star", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Askıya Alma Eşiği</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("suspension_threshold")}
                  onChange={(e) => handleChange("suspension_threshold", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu puana ulaşıldığında hesap 7 gün askıya alınır
                </p>
              </div>
              <div>
                <Label>Kalıcı Yasaklama Eşiği</Label>
                <Input
                  type="number"
                  min="0"
                  value={getValue("ban_threshold")}
                  onChange={(e) => handleChange("ban_threshold", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu puana ulaşıldığında hesap kalıcı olarak kapatılır
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Point Purchase Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Puan Satın Alma
            </CardTitle>
            <CardDescription>
              Satıcıların takdir puanı satın alma ayarları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <Label>1 Takdir Puanı Fiyatı (₺)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={getValue("reputation_point_price")}
                onChange={(e) => handleChange("reputation_point_price", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Satıcıların admin üzerinden puan satın alma fiyatı
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSellerSettings;
