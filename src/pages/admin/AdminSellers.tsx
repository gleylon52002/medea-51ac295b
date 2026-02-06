import { useState } from "react";
import { Users, Star, AlertTriangle, Ban, Pause, Play, Loader2, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAllSellers,
  useUpdateSeller,
  useAddSellerPoints,
} from "@/hooks/useAdminSellers";
import { formatPrice } from "@/lib/utils";
import type { Seller } from "@/hooks/useSeller";

const AdminSellers = () => {
  const { data: sellers, isLoading } = useAllSellers();
  const updateSeller = useUpdateSeller();
  const addPoints = useAddSellerPoints();

  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [editForm, setEditForm] = useState({
    commission_rate: "",
    status: "",
    suspended_reason: "",
  });

  const [pointsForm, setPointsForm] = useState({
    points: "",
    pointType: "reputation" as "reputation" | "penalty" | "purchased",
    reason: "",
  });

  const openEditDialog = (seller: Seller) => {
    setSelectedSeller(seller);
    setEditForm({
      commission_rate: String(seller.commission_rate),
      status: seller.status,
      suspended_reason: seller.suspended_reason || "",
    });
    setEditDialogOpen(true);
  };

  const openPointsDialog = (seller: Seller) => {
    setSelectedSeller(seller);
    setPointsForm({
      points: "",
      pointType: "reputation",
      reason: "",
    });
    setPointsDialogOpen(true);
  };

  const handleUpdateSeller = () => {
    if (!selectedSeller) return;
    updateSeller.mutate({
      sellerId: selectedSeller.id,
      data: {
        commission_rate: parseFloat(editForm.commission_rate),
        status: editForm.status as "active" | "suspended" | "banned",
        suspended_reason: editForm.status !== "active" ? editForm.suspended_reason : null,
        suspended_until: editForm.status === "suspended" 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      },
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedSeller(null);
      },
    });
  };

  const handleAddPoints = () => {
    if (!selectedSeller) return;
    addPoints.mutate({
      sellerId: selectedSeller.id,
      points: parseInt(pointsForm.points),
      pointType: pointsForm.pointType,
      reason: pointsForm.reason,
    }, {
      onSuccess: () => {
        setPointsDialogOpen(false);
        setSelectedSeller(null);
      },
    });
  };

  const filteredSellers = sellers?.filter(s => {
    const matchesSearch = s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tax_number.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSellers = sellers?.filter(s => s.status === "active").length || 0;
  const suspendedSellers = sellers?.filter(s => s.status === "suspended").length || 0;
  const bannedSellers = sellers?.filter(s => s.status === "banned").length || 0;

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Satıcı Yönetimi</h1>
        <p className="text-muted-foreground">Tüm satıcıları yönetin, puan ekleyin veya çıkarın</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sellers?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Toplam Satıcı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSellers}</p>
                <p className="text-sm text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Pause className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suspendedSellers}</p>
                <p className="text-sm text-muted-foreground">Askıda</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bannedSellers}</p>
                <p className="text-sm text-muted-foreground">Yasaklı</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Firma adı veya vergi no ile ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="suspended">Askıda</SelectItem>
            <SelectItem value="banned">Yasaklı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sellers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Satış</TableHead>
                <TableHead>Komisyon</TableHead>
                <TableHead>Takdir</TableHead>
                <TableHead>Ceza</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers?.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{seller.company_name}</p>
                      <p className="text-xs text-muted-foreground">{seller.city}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatPrice(seller.total_sales)}</p>
                      <p className="text-xs text-muted-foreground">{seller.total_orders} sipariş</p>
                    </div>
                  </TableCell>
                  <TableCell>%{seller.commission_rate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Star className="h-3 w-3 mr-1" />
                      {seller.reputation_points}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={seller.penalty_points > 30 ? "destructive" : "secondary"}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {seller.penalty_points}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {seller.status === "active" && (
                      <Badge className="bg-green-500">Aktif</Badge>
                    )}
                    {seller.status === "suspended" && (
                      <Badge className="bg-yellow-500">Askıda</Badge>
                    )}
                    {seller.status === "banned" && (
                      <Badge variant="destructive">Yasaklı</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPointsDialog(seller)}
                        title="Puan Ekle/Çıkar"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(seller)}
                        title="Düzenle"
                      >
                        Düzenle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSellers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Satıcı bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Satıcı Düzenle - {selectedSeller?.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Komisyon Oranı (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={editForm.commission_rate}
                onChange={(e) => setEditForm({ ...editForm, commission_rate: e.target.value })}
              />
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="suspended">Askıya Al</SelectItem>
                  <SelectItem value="banned">Yasakla</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.status !== "active" && (
              <div>
                <Label>Neden</Label>
                <Textarea
                  value={editForm.suspended_reason}
                  onChange={(e) => setEditForm({ ...editForm, suspended_reason: e.target.value })}
                  placeholder="Askıya alma / yasaklama nedeni..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateSeller} disabled={updateSeller.isPending}>
              {updateSeller.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Puan Ekle - {selectedSeller?.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="p-4 bg-green-50 rounded-lg flex-1 text-center">
                <p className="text-sm text-muted-foreground">Takdir</p>
                <p className="text-2xl font-bold text-green-600">{selectedSeller?.reputation_points}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg flex-1 text-center">
                <p className="text-sm text-muted-foreground">Ceza</p>
                <p className="text-2xl font-bold text-red-600">{selectedSeller?.penalty_points}</p>
              </div>
            </div>
            <div>
              <Label>Puan Tipi</Label>
              <Select
                value={pointsForm.pointType}
                onValueChange={(value: "reputation" | "penalty" | "purchased") => 
                  setPointsForm({ ...pointsForm, pointType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reputation">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Takdir Puanı
                    </span>
                  </SelectItem>
                  <SelectItem value="penalty">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Ceza Puanı
                    </span>
                  </SelectItem>
                  <SelectItem value="purchased">
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Satın Alınan Puan
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Puan Miktarı</Label>
              <Input
                type="number"
                min="1"
                value={pointsForm.points}
                onChange={(e) => setPointsForm({ ...pointsForm, points: e.target.value })}
                placeholder="Puan miktarı"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={pointsForm.reason}
                onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })}
                placeholder="Puan ekleme nedeni..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleAddPoints} 
              disabled={!pointsForm.points || !pointsForm.reason || addPoints.isPending}
            >
              {addPoints.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Puan Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSellers;
