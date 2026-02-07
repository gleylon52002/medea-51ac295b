import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSellerTransactions } from "@/hooks/useSeller";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SellerAnalytics = () => {
    const { data: transactions, isLoading } = useSellerTransactions();
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    // Filter transactions by date
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        if (!date?.from) return transactions;

        return transactions.filter((t) => {
            const tDate = new Date(t.created_at);
            return isWithinInterval(tDate, {
                start: date.from!,
                end: date.to || date.from!,
            });
        });
    }, [transactions, date]);

    // Calculations
    const stats = useMemo(() => {
        const totalEarnings = filteredTransactions.reduce((acc, t) => acc + (Number(t.net_amount) || 0), 0);
        const totalSales = filteredTransactions.reduce((acc, t) => acc + (Number(t.sale_amount) || 0), 0);
        const totalOrders = new Set(filteredTransactions.map(t => t.order_id)).size;

        // Average Order Value
        const aov = totalOrders > 0 ? totalSales / totalOrders : 0;

        return { totalEarnings, totalSales, totalOrders, aov };
    }, [filteredTransactions]);

    // Chart Data: Earnings Over Time
    const earningsData = useMemo(() => {
        const grouped = filteredTransactions.reduce((acc: any, t) => {
            const dateStr = format(new Date(t.created_at), 'dd MMM', { locale: tr });
            if (!acc[dateStr]) acc[dateStr] = { date: dateStr, amount: 0 };
            acc[dateStr].amount += (Number(t.net_amount) || 0);
            return acc;
        }, {});
        return Object.values(grouped);
    }, [filteredTransactions]);

    // Chart Data: Sales by Product
    const productData = useMemo(() => {
        const grouped = filteredTransactions.reduce((acc: any, t) => {
            const name = t.product?.name || "Bilinmeyen Ürün";
            if (!acc[name]) acc[name] = { name, value: 0 };
            acc[name].value += (Number(t.sale_amount) || 0);
            return acc;
        }, {});

        // Top 5 products
        return Object.values(grouped)
            // @ts-ignore
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 5);
    }, [filteredTransactions]);

    const handleExportReport = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Satış Analiz Raporu", 14, 22);

        doc.setFontSize(11);
        doc.text(`Tarih Aralığı: ${date?.from ? format(date.from, "dd.MM.yyyy") : ''} - ${date?.to ? format(date.to, "dd.MM.yyyy") : ''}`, 14, 32);

        doc.text(`Toplam Satış: ${formatPrice(stats.totalSales)}`, 14, 45);
        doc.text(`Net Kazanç: ${formatPrice(stats.totalEarnings)}`, 14, 52);
        doc.text(`Toplam Sipariş: ${stats.totalOrders}`, 14, 59);

        const tableColumn = ["Tarih", "Ürün", "Satış Tutarı", "Net Kazanç"];
        const tableRows: any[] = [];

        filteredTransactions.forEach((t) => {
            const transactionData = [
                format(new Date(t.created_at), "dd.MM.yyyy HH:mm"),
                t.product?.name || "-",
                formatPrice(t.sale_amount),
                formatPrice(t.net_amount)
            ];
            tableRows.push(transactionData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
        });

        doc.save("satis-raporu.pdf");
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Analiz ve Raporlar</h1>
                    <p className="text-muted-foreground">Satış performansınızı detaylı inceleyin</p>
                </div>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y", { locale: tr })} -{" "}
                                            {format(date.to, "LLL dd, y", { locale: tr })}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y", { locale: tr })
                                    )
                                ) : (
                                    <span>Tarih Seç</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={tr}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleExportReport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Rapor İndir
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(stats.totalSales)}</div>
                        <p className="text-xs text-muted-foreground">Seçili dönemde</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Kazanç</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalEarnings)}</div>
                        <p className="text-xs text-muted-foreground">Komisyonlar düşüldükten sonra</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ort. Sepet Tutarı</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(stats.aov)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kazanç Grafiği</CardTitle>
                        <CardDescription>Günlük net kazanç tablosu</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={earningsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Kazanç" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Sales Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>En Çok Satan Ürünler</CardTitle>
                        <CardDescription>Gelire göre ilk 5 ürün</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={productData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {productData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SellerAnalytics;
