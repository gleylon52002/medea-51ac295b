import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/utils";

const BarcodeScanner = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: alternatives, isLoading } = useQuery({
    queryKey: ["barcode-alternatives", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, sale_price, images")
        .eq("is_active", true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!searchTerm,
  });

  const handleSearch = () => {
    if (query.trim()) setSearchTerm(query.trim());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ScanLine className="h-4 w-4" />
          Alternatif Bul
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" />Ürün Alternatifi Bul</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Rakip ürünün adını veya barkod numarasını girin, bizdeki alternatiflerini bulalım.</p>
        <div className="flex gap-2 mt-3">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ürün adı veya barkod numarası..."
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {alternatives && alternatives.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-primary">Bizdeki Alternatifler:</p>
            {alternatives.map(p => (
              <Link key={p.id} to={`/urun/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-sm text-primary font-semibold">{formatPrice(p.sale_price || p.price)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}

        {searchTerm && alternatives?.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">Bu ürün için alternatif bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
