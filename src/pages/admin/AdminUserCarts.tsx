import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShoppingCart, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  variant_id: string | null;
  variant_info: any;
  personal_discount: number;
  discount_note: string | null;
  created_at: string;
  product?: { name: string; price: number; sale_price: number | null; images: string[] | null; seller_id: string | null };
  profile?: { full_name: string | null; email: string };
}

const AdminUserCarts = () => {
  const [search, setSearch] = useState("");
  const [discountDialog, setDiscountDialog] = useState<CartItemRow | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountNote, setDiscountNote] = useState("");
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["admin-user-carts"],
    queryFn: async () => {
      // Get all cart items with product and user info
      const { data, error } = await supabase
        .from("user_carts" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const items = data as unknown as CartItemRow[];

      // Get unique product IDs and user IDs
      const productIds = [...new Set(items.map(i => i.product_id))];
      const userIds = [...new Set(items.map(i => i.user_id))];

      const [productsRes, profilesRes] = await Promise.all([
        productIds.length > 0
          ? supabase.from("products").select("id, name, price, sale_price, images, seller_id").in("id", productIds)
          : { data: [] },
        userIds.length > 0
          ? supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds)
          : { data: [] },
      ]);

      const productsMap = new Map((productsRes.data || []).map(p => [p.id, p]));
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));

      return items.map(item => ({
        ...item,
        product: productsMap.get(item.product_id),
        profile: profilesMap.get(item.user_id),
      }));
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: async ({ cartId, discount, note }: { cartId: string; discount: number; note: string }) => {
      const { error } = await supabase
        .from("user_carts" as any)
        .update({ personal_discount: discount, discount_note: note } as any)
        .eq("id", cartId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-carts"] });
      toast.success("İndirim uygulandı");
      setDiscountDialog(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Group cart items by user
  const groupedByUser = cartItems?.reduce((acc, item) => {
    const key = item.user_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, CartItemRow[]>) || {};

  const filteredUsers = Object.entries(groupedByUser).filter(([_, items]) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return items.some(item =>
      item.profile?.email?.toLowerCase().includes(s) ||
      item.profile?.full_name?.toLowerCase().includes(s) ||
      item.product?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-7 w-7" />
          Kullanıcı Sepetleri
        </h1>
        <p className="text-muted-foreground mt-1">Kullanıcıların sepetlerini görüntüleyin ve kişiye özel indirim uygulayın</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kullanıcı veya ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Yükleniyor...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Sepette ürün bulunan kullanıcı yok</p>
      ) : (
        <div className="space-y-6">
          {filteredUsers.map(([userId, items]) => {
            const profile = items[0]?.profile;
            const userTotal = items.reduce((sum, item) => {
              const price = item.product?.sale_price || item.product?.price || 0;
              return sum + price * item.quantity;
            }, 0);

            return (
              <Card key={userId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {profile?.full_name || "İsimsiz"} — <span className="text-muted-foreground font-normal text-sm">{profile?.email}</span>
                    </CardTitle>
                    <Badge variant="secondary">{items.length} ürün · {formatPrice(userTotal)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {item.product?.images?.[0] && (
                            <img src={item.product.images[0]} alt="" className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{item.product?.name || "Silinmiş ürün"}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} adet · {formatPrice((item.product?.sale_price || item.product?.price || 0) * item.quantity)}
                            </p>
                            {item.personal_discount > 0 && (
                              <Badge variant="default" className="mt-1 text-xs bg-green-500">
                                <Tag className="h-3 w-3 mr-1" />
                                {formatPrice(item.personal_discount)} indirim
                                {item.discount_note && ` — ${item.discount_note}`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDiscountDialog(item);
                            setDiscountAmount(String(item.personal_discount || ""));
                            setDiscountNote(item.discount_note || "");
                          }}
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          İndirim
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Discount Dialog */}
      <Dialog open={!!discountDialog} onOpenChange={() => setDiscountDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kişiye Özel İndirim Uygula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{discountDialog?.product?.name}</strong> ürünü için{" "}
              <strong>{discountDialog?.profile?.full_name || discountDialog?.profile?.email}</strong> kullanıcısına indirim uygulayın.
            </p>
            <div className="space-y-2">
              <Label>İndirim Tutarı (₺)</Label>
              <Input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0.00"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Not (kullanıcıya gösterilir)</Label>
              <Textarea
                value={discountNote}
                onChange={(e) => setDiscountNote(e.target.value)}
                placeholder="Özel kampanya indirimi..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialog(null)}>İptal</Button>
            <Button
              onClick={() => {
                if (discountDialog) {
                  applyDiscountMutation.mutate({
                    cartId: discountDialog.id,
                    discount: Number(discountAmount) || 0,
                    note: discountNote,
                  });
                }
              }}
              disabled={applyDiscountMutation.isPending}
            >
              {applyDiscountMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserCarts;
