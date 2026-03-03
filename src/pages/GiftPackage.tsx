import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Package, Send, Heart, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/utils";

const GiftPackage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: products } = useProducts();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [boxStyle, setBoxStyle] = useState("classic");
  const [searchTerm, setSearchTerm] = useState("");

  const createGift = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Giriş yapmalısınız");
      if (selectedProducts.length === 0) throw new Error("En az bir ürün seçin");
      if (!recipientName) throw new Error("Alıcı adı gerekli");

      const selectedItems = products?.filter(p => selectedProducts.includes(p.id)) || [];
      const total = selectedItems.reduce((sum, p) => sum + Number(p.sale_price || p.price), 0);

      const { data, error } = await supabase.from("gift_packages").insert({
        sender_id: user.id,
        recipient_name: recipientName,
        recipient_email: recipientEmail || null,
        gift_note: giftNote || null,
        box_style: boxStyle,
        product_ids: selectedProducts,
        total,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/hediye/${data.gift_link_token}`;
      navigator.clipboard.writeText(link);
      toast.success("Hediye paketi oluşturuldu! Link kopyalandı.");
      queryClient.invalidateQueries({ queryKey: ["gift-packages"] });
      setSelectedProducts([]);
      setRecipientName("");
      setRecipientEmail("");
      setGiftNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 12);

  const selectedItems = products?.filter(p => selectedProducts.includes(p.id)) || [];
  const total = selectedItems.reduce((sum, p) => sum + Number(p.sale_price || p.price), 0);

  const boxStyles = [
    { id: "classic", name: "Klasik", emoji: "🎁" },
    { id: "premium", name: "Premium", emoji: "✨" },
    { id: "romantic", name: "Romantik", emoji: "💝" },
    { id: "nature", name: "Doğal", emoji: "🌿" },
  ];

  if (!user) {
    return (
      <Layout>
        <div className="container-main py-12 text-center">
          <Gift className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Hediye Paketi Oluştur</h1>
          <p className="text-muted-foreground mb-4">Hediye paketi oluşturmak için giriş yapmalısınız.</p>
          <Button asChild><a href="/giris">Giriş Yap</a></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Hediye Paketi Oluştur - Medea" description="Sevdiklerinize özel hediye paketi oluşturun" />
      <div className="container-main py-8">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-serif font-bold">Hediye Paketi Oluştur</h1>
            <p className="text-muted-foreground text-sm">Ürünleri seçin, kutu stili belirleyin, özel not ekleyin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Ürünleri Seçin</h3>
              <Input
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="mb-3"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts?.map(p => {
                  const isSelected = selectedProducts.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProducts(prev =>
                          isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                        isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/50"
                      }`}
                    >
                      <img src={p.images?.[0] || "/placeholder.svg"} alt={p.name} className="w-10 h-10 rounded object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                        <p className="text-xs text-primary">{formatPrice(Number(p.sale_price || p.price))}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Box Style */}
            <div>
              <h3 className="font-semibold mb-2">Kutu Stili</h3>
              <div className="grid grid-cols-4 gap-3">
                {boxStyles.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setBoxStyle(style.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      boxStyle === style.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-2xl">{style.emoji}</span>
                    <p className="text-xs font-medium mt-1">{style.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold">Alıcı Bilgileri</h3>
              <Input placeholder="Alıcının adı *" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              <Input placeholder="Alıcının e-postası (opsiyonel)" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
              <Textarea placeholder="Hediye notu (opsiyonel) ✍️" value={giftNote} onChange={e => setGiftNote(e.target.value)} rows={3} />
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Paket Özeti</h3>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz ürün seçilmedi</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 ml-2">{formatPrice(Number(p.sale_price || p.price))}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Toplam</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              )}
              <Button className="w-full mt-3 gap-2" disabled={selectedProducts.length === 0 || !recipientName || createGift.isPending} onClick={() => createGift.mutate()}>
                <Send className="h-4 w-4" />
                {createGift.isPending ? "Oluşturuluyor..." : "Hediye Linki Oluştur"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Alıcı linke tıklayıp kendi adresini girecek.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GiftPackage;
