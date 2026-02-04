export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: string;
  categorySlug: string;
  stock: number;
  featured: boolean;
  ingredients?: string;
  usage?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface ProductVariantInfo {
  id: string;
  name: string;
  variant_type: string;
  color_code?: string;
  price_adjustment: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariantInfo | null;
  priceAdjustment?: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}
