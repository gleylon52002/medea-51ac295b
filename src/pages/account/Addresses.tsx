import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/hooks/useAddresses";

const Addresses = () => {
  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [isOpen, setIsOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    full_name: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postal_code: "",
    is_default: false,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      full_name: "",
      phone: "",
      address: "",
      city: "",
      district: "",
      postal_code: "",
      is_default: false,
    });
    setEditingAddress(null);
  };

  const handleOpenDialog = (address?: any) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        title: address.title,
        full_name: address.full_name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        district: address.district,
        postal_code: address.postal_code || "",
        is_default: address.is_default,
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      updateAddress.mutate({ id: editingAddress.id, ...formData }, {
        onSuccess: () => setIsOpen(false)
      });
    } else {
      createAddress.mutate(formData, {
        onSuccess: () => setIsOpen(false)
      });
    }
  };

  const handleSetDefault = (address: any) => {
    updateAddress.mutate({ id: address.id, is_default: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-medium">Adreslerim</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Adres
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Adres Başlığı</Label>
                <Input
                  id="title"
                  placeholder="Ev, İş, vb."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">İl</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">İlçe</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Posta Kodu</Label>
                  <Input
                    id="postalCode"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={createAddress.isPending || updateAddress.isPending}>
                  {(createAddress.isPending || updateAddress.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Kaydet
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!addresses || addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Henüz kayıtlı adresiniz bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-xl p-4 relative ${address.is_default ? "border-primary bg-primary/5" : "border-border"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">{address.title}</p>
                {address.is_default && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Varsayılan
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{address.full_name}</p>
              <p className="text-sm text-muted-foreground mb-1">{address.phone}</p>
              <p className="text-sm text-muted-foreground mb-1">{address.address}</p>
              <p className="text-sm text-muted-foreground">
                {address.district}, {address.city} {address.postal_code}
              </p>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => handleSetDefault(address)}
                    disabled={updateAddress.isPending}
                  >
                    Varsayılan Yap
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(address)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Bu adresi silmek istediğinize emin misiniz?")) {
                      deleteAddress.mutate(address.id);
                    }
                  }}
                  disabled={deleteAddress.isPending}
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
