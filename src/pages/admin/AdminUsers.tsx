import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Shield, ShieldOff, Ban, CheckCircle, Eye, ShoppingBag, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const rolesMap: Record<string, string[]> = {};
      roles?.forEach(r => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      // Get order counts per user
      const { data: orderStats } = await supabase
        .from("orders")
        .select("user_id, total");

      const orderMap: Record<string, { count: number; total: number }> = {};
      orderStats?.forEach(o => {
        if (!o.user_id) return;
        if (!orderMap[o.user_id]) orderMap[o.user_id] = { count: 0, total: 0 };
        orderMap[o.user_id].count++;
        orderMap[o.user_id].total += Number(o.total);
      });

      return profiles.map(p => ({
        ...p,
        roles: rolesMap[p.user_id] || ["user"],
        orderCount: orderMap[p.user_id]?.count || 0,
        orderTotal: orderMap[p.user_id]?.total || 0,
      }));
    },
  });

  // Get user orders for detail view
  const { data: userOrders } = useQuery({
    queryKey: ["admin", "user-orders", selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", selectedUser.user_id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!selectedUser,
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isCurrentlyAdmin }: { userId: string; isCurrentlyAdmin: boolean }) => {
      if (isCurrentlyAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isCurrentlyAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(isCurrentlyAdmin ? "Admin yetkisi kaldırıldı" : "Admin yetkisi verildi");
    },
    onError: () => toast.error("İşlem başarısız"),
  });

  const filteredUsers = users?.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const viewUserDetail = (user: any) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">Kullanıcılar</h1>
        <p className="text-muted-foreground mt-1">
          Toplam {users?.length || 0} kayıtlı kullanıcı
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
          <p className="text-2xl font-bold">{users?.length || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Admin Sayısı</p>
          <p className="text-2xl font-bold">{users?.filter(u => u.roles.includes("admin")).length || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Sipariş Veren</p>
          <p className="text-2xl font-bold">{users?.filter(u => u.orderCount > 0).length || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Toplam Satış</p>
          <p className="text-2xl font-bold">{formatPrice(users?.reduce((s, u) => s + u.orderTotal, 0) || 0)}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Kullanıcı ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Siparişler</TableHead>
              <TableHead>Toplam Harcama</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="w-16">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Yükleniyor...</TableCell></TableRow>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || "İsimsiz"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.orderCount}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(user.orderTotal)}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role: string) => (
                        <Badge key={role} variant={role === "admin" ? "default" : "secondary"} className="text-xs">
                          {role === "admin" ? "Admin" : role === "seller" ? "Satıcı" : "Kullanıcı"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewUserDetail(user)}>
                          <Eye className="h-4 w-4 mr-2" /> Detay Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => toggleAdminMutation.mutate({
                            userId: user.user_id,
                            isCurrentlyAdmin: user.roles.includes("admin"),
                          })}
                        >
                          {user.roles.includes("admin") ? (
                            <><ShieldOff className="h-4 w-4 mr-2 text-destructive" /> Admin Yetkisi Kaldır</>
                          ) : (
                            <><Shield className="h-4 w-4 mr-2" /> Admin Yetkisi Ver</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Kullanıcı bulunamadı</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kullanıcı Detayı</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Ad Soyad</p>
                  <p className="font-medium">{selectedUser.full_name || "Belirtilmemiş"}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selectedUser.phone || "Belirtilmemiş"}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">TC Kimlik</p>
                  <p className="font-medium">{selectedUser.identity_number || "Belirtilmemiş"}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Kayıt Tarihi</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString("tr-TR")}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Sipariş Sayısı</p>
                  <p className="font-medium">{selectedUser.orderCount}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p className="text-muted-foreground">Toplam Harcama</p>
                  <p className="font-medium">{formatPrice(selectedUser.orderTotal)}</p>
                </div>
              </div>

              {/* Recent Orders */}
              {userOrders && userOrders.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Son Siparişler</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userOrders.map((order: any) => (
                      <div key={order.id} className="flex justify-between items-center p-2 border rounded text-sm">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("tr-TR")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(order.total)}</p>
                          <Badge variant="secondary" className="text-xs">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
