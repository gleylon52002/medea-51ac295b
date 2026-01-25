import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  {
    id: "1",
    title: "Ev",
    fullName: "Ayşe Yılmaz",
    phone: "0532 123 45 67",
    address: "Caferağa Mah. Moda Cad. No: 123 D: 5",
    city: "İstanbul",
    district: "Kadıköy",
    postalCode: "34710",
    isDefault: true,
  },
  {
    id: "2",
    title: "İş",
    fullName: "Ayşe Yılmaz",
    phone: "0532 123 45 67",
    address: "Levent Mah. Büyükdere Cad. No: 456 K: 12",
    city: "İstanbul",
    district: "Beşiktaş",
    postalCode: "34394",
    isDefault: false,
  },
];

const Addresses = () => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
    toast({
      title: "Adres Silindi",
      description: "Adres başarıyla silindi.",
    });
  };

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    toast({
      title: "Varsayılan Adres Güncellendi",
      description: "Varsayılan teslimat adresiniz değiştirildi.",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-medium">Adreslerim</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Adres
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Adres Ekle</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Adres Başlığı</Label>
                <Input id="title" placeholder="Ev, İş, vb." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input id="fullName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">İl</Label>
                  <Input id="city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">İlçe</Label>
                  <Input id="district" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Posta Kodu</Label>
                  <Input id="postalCode" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">Kaydet</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Henüz kayıtlı adresiniz bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-xl p-4 relative ${
                address.isDefault ? "border-primary" : "border-border"
              }`}
            >
              {address.isDefault && (
                <span className="absolute top-4 right-4 text-xs font-medium text-primary">
                  Varsayılan
                </span>
              )}
              <p className="font-medium mb-2">{address.title}</p>
              <p className="text-sm text-muted-foreground mb-1">{address.fullName}</p>
              <p className="text-sm text-muted-foreground mb-1">{address.phone}</p>
              <p className="text-sm text-muted-foreground mb-1">{address.address}</p>
              <p className="text-sm text-muted-foreground">
                {address.district}, {address.city} {address.postalCode}
              </p>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                {!address.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Varsayılan Yap
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Addresses;
