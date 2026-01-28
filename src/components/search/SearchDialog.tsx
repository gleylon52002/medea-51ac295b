import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProductSearch } from "@/hooks/useSearch";
import { formatPrice } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: results, isLoading } = useProductSearch(query);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleProductClick = (slug: string) => {
    navigate(`/urun/${slug}`);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length >= 2) {
      navigate(`/urunler?search=${encodeURIComponent(query)}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Ürün Ara</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ürün ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && results && results.length > 0 && (
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product.slug)}
                className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <img
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  {product.category_name && (
                    <p className="text-sm text-muted-foreground">{product.category_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatPrice(product.sale_price || product.price)}
                  </p>
                  {product.sale_price && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && query.length >= 2 && (!results || results.length === 0) && (
          <div className="py-8 text-center text-muted-foreground">
            "{query}" için sonuç bulunamadı
          </div>
        )}

        {query.length < 2 && query.length > 0 && (
          <div className="py-4 text-center text-muted-foreground text-sm">
            En az 2 karakter girin
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
