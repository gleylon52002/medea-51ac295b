import { useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, Users, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useSellerApplications,
  useApproveSellerApplication,
  useRejectSellerApplication,
} from "@/hooks/useAdminSellers";

const AdminSellerApplications = () => {
  const { data: applications, isLoading } = useSellerApplications();
  const approveApplication = useApproveSellerApplication();
  const rejectApplication = useRejectSellerApplication();

  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [commissionRate, setCommissionRate] = useState("15");
  const [searchTerm, setSearchTerm] = useState("");

  const pendingApplications = applications?.filter(a => a.status === "pending") || [];
  const approvedApplications = applications?.filter(a => a.status === "approved") || [];
  const rejectedApplications = applications?.filter(a => a.status === "rejected") || [];

  const handleApprove = () => {
    if (!selectedApplication) return;
    approveApplication.mutate(
      { 
        applicationId: selectedApplication.id,
        commissionRate: parseFloat(commissionRate)
      },
      {
        onSuccess: () => {
          setViewDialogOpen(false);
          setSelectedApplication(null);
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedApplication) return;
    rejectApplication.mutate(
      { 
        applicationId: selectedApplication.id,
        reason: rejectReason
      },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setViewDialogOpen(false);
          setSelectedApplication(null);
          setRejectReason("");
        },
      }
    );
  };

  const filterApplications = (apps: typeof applications) => {
    if (!searchTerm) return apps;
    return apps?.filter(a => 
      a.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tax_number.includes(searchTerm)
    );
  };

  const ApplicationTable = ({ apps, showActions = false }: { apps: typeof applications; showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Firma</TableHead>
          <TableHead>Vergi No</TableHead>
          <TableHead>Şehir</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filterApplications(apps)?.map((app) => (
          <TableRow key={app.id}>
            <TableCell className="font-medium">{app.company_name}</TableCell>
            <TableCell>{app.tax_number}</TableCell>
            <TableCell>{app.city}</TableCell>
            <TableCell>{new Date(app.created_at).toLocaleDateString("tr-TR")}</TableCell>
            <TableCell>
              {app.status === "pending" && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  <Clock className="h-3 w-3 mr-1" />
                  Bekliyor
                </Badge>
              )}
              {app.status === "approved" && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Onaylandı
                </Badge>
              )}
              {app.status === "rejected" && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Reddedildi
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedApplication(app);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Detay
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {filterApplications(apps)?.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              Başvuru bulunamadı
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

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
        <h1 className="text-2xl font-bold">Satıcı Başvuruları</h1>
        <p className="text-muted-foreground">Satıcı başvurularını inceleyin ve yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApplications.length}</p>
                <p className="text-sm text-muted-foreground">Bekleyen Başvuru</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedApplications.length}</p>
                <p className="text-sm text-muted-foreground">Onaylanan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedApplications.length}</p>
                <p className="text-sm text-muted-foreground">Reddedilen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Firma adı veya vergi no ile ara..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            <Clock className="h-4 w-4" />
            Bekleyen ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1">
            <CheckCircle className="h-4 w-4" />
            Onaylanan ({approvedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1">
            <XCircle className="h-4 w-4" />
            Reddedilen ({rejectedApplications.length})
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-0">
            <TabsContent value="pending" className="m-0">
              <ApplicationTable apps={pendingApplications} showActions />
            </TabsContent>
            <TabsContent value="approved" className="m-0">
              <ApplicationTable apps={approvedApplications} />
            </TabsContent>
            <TabsContent value="rejected" className="m-0">
              <ApplicationTable apps={rejectedApplications} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Başvuru Detayı</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Firma Adı</p>
                  <p className="font-medium">{selectedApplication.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vergi No</p>
                  <p className="font-medium">{selectedApplication.tax_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TC Kimlik No</p>
                  <p className="font-medium">{selectedApplication.identity_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selectedApplication.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Adres</p>
                  <p className="font-medium">
                    {selectedApplication.address}, {selectedApplication.district}/{selectedApplication.city}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Banka</p>
                  <p className="font-medium">{selectedApplication.bank_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IBAN</p>
                  <p className="font-medium font-mono text-xs">{selectedApplication.iban}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Hesap Sahibi</p>
                  <p className="font-medium">{selectedApplication.account_holder}</p>
                </div>
                {selectedApplication.category_focus && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">İlgi Alanı</p>
                    <p className="font-medium">{selectedApplication.category_focus}</p>
                  </div>
                )}
                {selectedApplication.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Açıklama</p>
                    <p className="font-medium">{selectedApplication.description}</p>
                  </div>
                )}
              </div>

              {selectedApplication.status === "rejected" && selectedApplication.rejection_reason && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-600">Red Nedeni:</p>
                  <p className="text-sm text-red-700">{selectedApplication.rejection_reason}</p>
                </div>
              )}

              {selectedApplication.status === "pending" && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium">Komisyon Oranı (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="mt-1 max-w-32"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleApprove}
                      disabled={approveApplication.isPending}
                    >
                      {approveApplication.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Onayla
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reddet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başvuruyu Reddet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Red Nedeni</label>
              <Textarea
                placeholder="Başvurunun neden reddedildiğini açıklayın..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectApplication.isPending}
            >
              {rejectApplication.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSellerApplications;
