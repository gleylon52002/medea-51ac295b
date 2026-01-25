import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "Ayşe",
    lastName: "Yılmaz",
    email: "ayse@example.com",
    phone: "0532 123 45 67",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Bilgiler Güncellendi",
      description: "Hesap bilgileriniz başarıyla kaydedildi.",
    });
  };

  return (
    <div>
      <h2 className="font-serif text-xl font-medium mb-6">Hesap Bilgileri</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Ad</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Soyad</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <Button type="submit">Bilgileri Kaydet</Button>
      </form>
    </div>
  );
};

export default Profile;
