import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Droplets, Leaf } from "lucide-react";
import { toast } from "sonner";

const SKIN_TYPES = ["Kuru", "Yağlı", "Karma", "Normal", "Hassas"];
const SCENTS = ["Lavanta", "Gül", "Papatya", "Kokusuz", "Nane", "Vanilya", "Zeytinyağı", "Keçi Sütü"];

const CustomProductOrder = () => {
  const { user } = useAuth();
  const [skinType, setSkinType] = useState("");
  const [scent, setScent] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Giriş yapmalısınız");
      if (!skinType) throw new Error("Cilt tipini seçin");

      const { error } = await supabase.from("custom_product_orders").insert({
        user_id: user.id,
        skin_type: skinType,
        scent_preference: scent || null,
        ingredient_allergies: allergies || null,
        additional_notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Özel ürün talebiniz alındı! Satıcılarımız en kısa sürede sizinle iletişime geçecek.");
      setSkinType("");
      setScent("");
      setAllergies("");
      setNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Layout>
        <div className="container-main py-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Benim Sabunumu Yap</h1>
          <p className="text-muted-foreground mb-4">Giriş yaparak kişiye özel sabun siparişi verin.</p>
          <Button asChild><a href="/giris">Giriş Yap</a></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Benim Sabunumu Yap - Medea" description="Kişiye özel doğal sabun siparişi verin" />
      <div className="container-main py-8 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold">Benim Sabunumu Yap</h1>
          <p className="text-muted-foreground text-sm">Cilt tipinize ve tercihlerinize göre size özel sabun üretelim</p>
        </div>

        <div className="space-y-4 rounded-xl border p-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Cilt Tipiniz *</label>
            <div className="grid grid-cols-5 gap-2">
              {SKIN_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSkinType(type)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    skinType === type ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Koku Tercihi</label>
            <div className="grid grid-cols-4 gap-2">
              {SCENTS.map(s => (
                <button
                  key={s}
                  onClick={() => setScent(s)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    scent === s ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5" /> İçerik Hassasiyetleri
            </label>
            <Input
              placeholder="Alerji veya hassasiyetiniz var mı? (opsiyonel)"
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Ek Notlarınız</label>
            <Textarea
              placeholder="Özel istekleriniz, beklentileriniz..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button className="w-full gap-2" onClick={() => createOrder.mutate()} disabled={createOrder.isPending || !skinType}>
            <Droplets className="h-4 w-4" />
            {createOrder.isPending ? "Gönderiliyor..." : "Özel Sabun Talebi Oluştur"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Uzman satıcılarımız talebinizi değerlendirip size özel fiyat teklifi sunacak.</p>
        </div>
      </div>
    </Layout>
  );
};

export default CustomProductOrder;
