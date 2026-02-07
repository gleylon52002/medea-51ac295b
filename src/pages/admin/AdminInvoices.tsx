import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllTransactions } from "@/hooks/useAdminSellers";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText, Search, TrendingUp, Filter } from "lucide-react";
import { generateProfessionalInvoice } from "@/lib/professionalInvoiceGenerator";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AdminInvoices = () => {
    const { data: transactions, isLoading } = useAllTransactions();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    // Flatten transactions to be invoice-centric (grouped by order)
    const invoices = transactions?.reduce((acc: any[], transaction: any) => {
        const existingOrder = acc.find(o => o.order_id === transaction.order_id);
        if (!existingOrder) {
            if (transaction.order) {
                acc.push({
                    ...transaction.order,
                    transactions: [transaction],
                    order_id: transaction.order_id,
                    seller_name: transaction.seller?.company_name || "Bilinmiyor",
                    seller_id: transaction.seller_id
                });
            }
        } else {
            existingOrder.transactions.push(transaction);
        }
        return acc;
    }, []) || [];

    // Filter logic
    const filteredInvoices = invoices.filter((inv: any) => {
        const matchesSearch =
            inv.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.seller_name.toLowerCase().includes(searchTerm.toLowerCase());

        // Simplistic status check based on order status or transaction status
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalCommission = transactions?.reduce((sum: number, t: any) => sum + (t.commission_amount || 0), 0) || 0;

    const handleDownloadInvoice = (order: any) => {
        generateProfessionalInvoice(order); // Admin sees full invoice
    };

    return (
        <div className="p-4 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">Fatura ve Komisyonlar</h1>
                    <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                        Tüm satış faturalarını ve komisyon gelirlerini yönetin
                    </p>
                </div>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Toplam Komisyon</p>
                            <p className="text-xl font-bold text-primary">{formatPrice(totalCommission)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <CardTitle>Fatura Listesi</CardTitle>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Sipariş No veya Satıcı Ara..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Durum" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tümü</SelectItem>
                                    <SelectItem value="completed">Tamamlanan</SelectItem>
                                    <SelectItem value="pending">Bekleyen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sipariş No</TableHead>
                                <TableHead>Satıcı</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Satış Tutarı</TableHead>
                                <TableHead>Komisyon Geliri</TableHead>
                                <TableHead>İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((inv: any) => {
                                const totalSale = inv.transactions.reduce((sum: number, t: any) => sum + t.sale_amount, 0);
                                const totalComm = inv.transactions.reduce((sum: number, t: any) => sum + t.commission_amount, 0);

                                return (
                                    <TableRow key={inv.order_id}>
                                        <TableCell className="font-medium">
                                            #{inv.order_number}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal">
                                                {inv.seller_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(inv.created_at).toLocaleDateString('tr-TR')}
                                        </TableCell>
                                        <TableCell>{formatPrice(totalSale)}</TableCell>
                                        <TableCell className="text-green-600 font-bold">
                                            +{formatPrice(totalComm)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleDownloadInvoice(inv)}
                                            >
                                                <FileText className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredInvoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        Kayıt bulunamadı
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminInvoices;
