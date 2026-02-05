import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, CartItem, Cart, ProductVariantInfo } from "@/types/product";
import { toast } from "sonner";

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariantInfo | null, priceAdjustment?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const calculateCart = (items: CartItem[]): Cart => {
  const total = items.reduce((sum, item) => {
    const basePrice = item.product.salePrice || item.product.price;
    const priceAdjustment = item.priceAdjustment || 0;
    return sum + (basePrice + priceAdjustment) * item.quantity;
  }, 0);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return { items, total, itemCount };
};

const getCartItemKey = (productId: string, variantId?: string) => {
  return variantId ? `${productId}-${variantId}` : productId;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medea-cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("medea-cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (
    product: Product,
    quantity = 1,
    variant?: ProductVariantInfo | null,
    priceAdjustment = 0
  ) => {
    setItems((prev) => {
      const itemKey = getCartItemKey(product.id, variant?.id);
      const existing = prev.find(
        (item) => getCartItemKey(item.product.id, item.variant?.id) === itemKey
      );
      
      if (existing) {
        return prev.map((item) =>
          getCartItemKey(item.product.id, item.variant?.id) === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, variant, priceAdjustment }];
    });
    
    const variantName = variant ? ` (${variant.name})` : "";
    toast.success(`${product.name}${variantName} sepete eklendi`);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    const itemKey = getCartItemKey(productId, variantId);
    setItems((prev) =>
      prev.filter((item) => getCartItemKey(item.product.id, item.variant?.id) !== itemKey)
    );
    toast.info("Ürün sepetten çıkarıldı");
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    const itemKey = getCartItemKey(productId, variantId);
    setItems((prev) =>
      prev.map((item) =>
        getCartItemKey(item.product.id, item.variant?.id) === itemKey
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.info("Sepet temizlendi");
  };

  const cart = calculateCart(items);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
