import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminPayoutRequests, useUpdatePayoutRequest } from "@/hooks/useAdminSellers";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Banknote,
    Search,
    ExternalLink,
    MoreVertical,
    Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AdminPayouts = () => {
    const { data: requests, isLoading } = useAdminPayoutRequests();
    const updatePayout = useUpdatePayoutRequest();
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    const filteredRequests = requests?.filter((req: any) =>
        req.seller?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleUpdateStatus = async (requestId: string, status: string, notes?: string) => {
        try {
            await updatePayout.mutateAsync({ requestId, status, adminNotes: notes });
            setIsRejectDialogOpen(false);
            setRejectReason("");
            setSelectedRequest(null);
        } catch (error) {
            // Handled by toast
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Ödendi</Badge>;
            case 'approved':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Onaylandı</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 border-red-200">Reddedildi</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Bekliyor</Badge>;
        }
    };

    return (
        <div className="p-4 lg:p-8 space-y-6">
            <div>
                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">Ödeme Talepleri</h1>
                <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                    Satıcıların bakiye çekim taleplerini yönetin ve onaylayın
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <CardTitle>Talep Listesi</CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Satıcı Adı Ara..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Satıcı</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Banka Bilgileri</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{req.seller?.company_name}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{req.id.substring(0, 8)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {formatPrice(req.amount)}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{req.bank_info?.bank_name}</span>
                                            <span className="text-[10px] font-mono break-all">{req.bank_info?.iban}</span>
                                            <span className="text-[10px] italic">{req.bank_info?.account_holder}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(req.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <DropdownMenuItem
                                                            className="text-blue-600"
                                                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Onayla
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setIsRejectDialogOpen(true);
                                                            }}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Reddet
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {req.status === 'approved' && (
                                                    <DropdownMenuItem
                                                        className="text-green-600 font-bold"
                                                        onClick={() => handleUpdateStatus(req.id, 'paid')}
                                                    >
                                                        <Banknote className="mr-2 h-4 w-4" />
                                                        Ödeme Yapıldı İşaretle
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => {
                                                    // Copy IBAN
                                                    navigator.clipboard.writeText(req.bank_info?.iban);
                                                    // Toast would be nice but we don't have it imported here yet
                                                }}>
                                                    IBAN Kopyala
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        Ödeme talebi bulunamadı
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Reject Reason Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Talebi Reddet</DialogTitle>
                        <DialogDescription>
                            Satıcıya iletilecek reddetme sebebini yazınız.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason">Red Sebebi</Label>
                        <Textarea
                            id="reason"
                            placeholder="Örneğin: Geçersiz IBAN bilgisi, eksik bakiye..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>İptal</Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected', rejectReason)}
                            disabled={!rejectReason}
                        >
                            Talebi Reddet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPayouts;
