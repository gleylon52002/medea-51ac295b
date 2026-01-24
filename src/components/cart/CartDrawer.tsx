import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 font-serif text-xl">
            <ShoppingBag className="h-5 w-5" />
            Sepetim ({cart.itemCount})
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Sepetiniz boş</p>
            <p className="text-sm text-muted-foreground mb-6">
              Ürünlerimize göz atmaya ne dersiniz?
            </p>
            <Button onClick={() => setIsCartOpen(false)} asChild>
              <Link to="/urunler">Ürünlere Git</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <div className="w-20 h-20 bg-card rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatPrice(item.product.salePrice || item.product.price)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 rounded bg-background border border-border hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 rounded bg-background border border-border hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kargo</span>
                  <span>{cart.total >= 300 ? "Ücretsiz" : formatPrice(29.90)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-2 border-t border-border">
                  <span>Toplam</span>
                  <span>{formatPrice(cart.total >= 300 ? cart.total : cart.total + 29.90)}</span>
                </div>
              </div>
              
              {cart.total < 300 && (
                <p className="text-xs text-center text-muted-foreground">
                  Ücretsiz kargo için {formatPrice(300 - cart.total)} daha ekleyin
                </p>
              )}

              <Button className="w-full" size="lg" asChild>
                <Link to="/odeme" onClick={() => setIsCartOpen(false)}>
                  Ödemeye Geç
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
