import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gift, MapPin, Check } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

const GiftReceive = () => {
  const { token } = useParams();
  const [address, setAddress] = useState({ full_name: "", phone: "", address: "", city: "", district: "", postal_code: "" });
  const [submitted, setSubmitted] = useState(false);

  const { data: gift, isLoading } = useQuery({
    queryKey: ["gift-receive", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_packages")
        .select("*")
        .eq("gift_link_token", token)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const { data: giftProducts } = useQuery({
    queryKey: ["gift-products", gift?.product_ids],
    queryFn: async () => {
      if (!gift?.product_ids?.length) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, images, price, sale_price")
        .in("id", gift.product_ids);
      if (error) throw error;
      return data;
    },
    enabled: !!gift?.product_ids?.length,
  });

  const submitAddress = useMutation({
    mutationFn: async () => {
      if (!address.full_name || !address.phone || !address.address || !address.city) {
        throw new Error("Lütfen tüm zorunlu alanları doldurun");
      }
      const { error } = await supabase
        .from("gift_packages")
        .update({ recipient_address: address, status: "address_received" })
        .eq("gift_link_token", token);
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Adresiniz kaydedildi! Hediyeniz yolda olacak 🎁");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <Layout><div className="container-main py-12 text-center">Yükleniyor...</div></Layout>;
  if (!gift) return <Layout><div className="container-main py-12 text-center"><h1 className="text-xl font-bold">Hediye bulunamadı</h1></div></Layout>;

  if (submitted || gift.recipient_address) {
    return (
      <Layout>
        <div className="container-main py-12 text-center max-w-md mx-auto">
          <div className="bg-primary/10 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Adres Kaydedildi! 🎉</h1>
          <p className="text-muted-foreground">Hediyeniz en kısa sürede adresinize gönderilecek.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Gift className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold">Size bir hediye var! 🎁</h1>
          <p className="text-muted-foreground mt-1">{gift.recipient_name}, birileri size düşünmüş</p>
        </div>

        {gift.gift_note && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center italic border">
            "{gift.gift_note}"
          </div>
        )}

        {giftProducts && giftProducts.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="font-semibold">Hediye İçeriği</h3>
            {giftProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border">
                <img src={p.images?.[0] || "/placeholder.svg"} alt={p.name} className="w-12 h-12 rounded object-cover" />
                <span className="text-sm font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Teslimat Adresiniz</h3>
          <Input placeholder="Ad Soyad *" value={address.full_name} onChange={e => setAddress(a => ({ ...a, full_name: e.target.value }))} />
          <Input placeholder="Telefon *" value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} />
          <Input placeholder="İl *" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} />
          <Input placeholder="İlçe" value={address.district} onChange={e => setAddress(a => ({ ...a, district: e.target.value }))} />
          <Input placeholder="Adres *" value={address.address} onChange={e => setAddress(a => ({ ...a, address: e.target.value }))} />
          <Input placeholder="Posta Kodu" value={address.postal_code} onChange={e => setAddress(a => ({ ...a, postal_code: e.target.value }))} />
          <Button className="w-full" onClick={() => submitAddress.mutate()} disabled={submitAddress.isPending}>
            {submitAddress.isPending ? "Gönderiliyor..." : "Adresimi Kaydet"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default GiftReceive;
