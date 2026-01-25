import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const AccountSettings = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    orderUpdates: true,
    promotions: true,
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Şifre Güncellendi",
      description: "Şifreniz başarıyla değiştirildi.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-xl font-medium mb-6">Şifre Değiştir</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button type="submit">Şifreyi Güncelle</Button>
        </form>
      </div>

      <Separator />

      <div>
        <h2 className="font-serif text-xl font-medium mb-6">Bildirim Tercihleri</h2>
        <div className="space-y-4 max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">E-posta Bildirimleri</p>
              <p className="text-sm text-muted-foreground">
                Sipariş güncellemeleri ve kampanyalar
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Bildirimleri</p>
              <p className="text-sm text-muted-foreground">
                Kargo ve teslimat güncellemeleri
              </p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, sms: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sipariş Güncellemeleri</p>
              <p className="text-sm text-muted-foreground">
                Sipariş durumu değişikliklerinde haber ver
              </p>
            </div>
            <Switch
              checked={notifications.orderUpdates}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, orderUpdates: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Kampanya ve İndirimler</p>
              <p className="text-sm text-muted-foreground">
                Özel fırsatlardan haberdar ol
              </p>
            </div>
            <Switch
              checked={notifications.promotions}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, promotions: checked })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="font-serif text-xl font-medium mb-6 text-destructive">
          Hesabı Sil
        </h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri
          alınamaz.
        </p>
        <Button variant="destructive">Hesabımı Sil</Button>
      </div>
    </div>
  );
};

export default AccountSettings;
