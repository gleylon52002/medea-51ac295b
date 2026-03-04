import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface InstagramShareButtonProps {
  productName: string;
  productPrice: number;
  productImage?: string;
  productSlug: string;
}

const InstagramShareButton = ({ productName, productPrice, productImage, productSlug }: InstagramShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const siteUrl = window.location.origin;
  const productUrl = `${siteUrl}/urun/${productSlug}`;
  
  const defaultCaption = `✨ ${productName}\n\n💰 ${productPrice.toFixed(2)} ₺\n\n🛒 Sipariş için linke tıklayın!\n\n${productUrl}\n\n#doğal #sabun #elişi #organik #ciltbakımı #medea`;

  const [caption, setCaption] = useState(defaultCaption);

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast.success("Açıklama kopyalandı!");
  };

  const handleCopyImage = async () => {
    if (productImage) {
      try {
        const response = await fetch(productImage);
        const blob = await response.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        toast.success("Görsel kopyalandı!");
      } catch {
        // Fallback: open image in new tab
        window.open(productImage, "_blank");
        toast.info("Görseli sağ tıklayıp kaydedin");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Instagram className="h-4 w-4" />
          Paylaş
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Instagram className="h-5 w-5" />Instagram'da Paylaş</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {productImage && (
            <div className="relative">
              <img src={productImage} alt={productName} className="w-full h-48 object-cover rounded-lg" />
              <Button size="sm" variant="secondary" className="absolute bottom-2 right-2 gap-1" onClick={handleCopyImage}>
                <Copy className="h-3 w-3" />Görseli Kopyala
              </Button>
            </div>
          )}

          <div>
            <Label>Paylaşım Açıklaması</Label>
            <Textarea value={caption} onChange={e => setCaption(e.target.value)} rows={6} className="mt-1" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCopyCaption} className="flex-1 gap-2">
              <Copy className="h-4 w-4" />Açıklamayı Kopyala
            </Button>
            <Button variant="outline" onClick={() => window.open("https://www.instagram.com/", "_blank")} className="gap-2">
              <ExternalLink className="h-4 w-4" />Instagram'ı Aç
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            1. Görseli kopyalayın/indirin → 2. Açıklamayı kopyalayın → 3. Instagram'da yeni gönderi oluşturun ve yapıştırın
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramShareButton;
