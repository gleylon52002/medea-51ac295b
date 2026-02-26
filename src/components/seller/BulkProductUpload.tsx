import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CSVProduct {
  name: string;
  slug: string;
  price: string;
  sale_price?: string;
  stock: string;
  description?: string;
  short_description?: string;
  category_slug?: string;
  images?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const BulkProductUpload = ({ sellerId }: { sellerId?: string }) => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const parseCSV = (text: string): CSVProduct[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const products: CSVProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const product: any = {};
      headers.forEach((header, index) => {
        product[header] = values[index] || "";
      });
      if (product.name && product.price) {
        products.push(product);
      }
    }

    return products;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Lütfen CSV dosyası yükleyin");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const products = parseCSV(text);

      if (products.length === 0) {
        toast.error("CSV dosyasında ürün bulunamadı");
        setImporting(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Fetch categories for matching
      const { data: categories } = await supabase.from("categories").select("id, slug");
      const categoryMap = new Map(categories?.map((c) => [c.slug, c.id]) || []);

      for (const product of products) {
        try {
          const slug = product.slug || product.name.toLowerCase()
            .replace(/[çÇ]/g, "c").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
            .replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[ıİ]/g, "i")
            .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

          const insertData: any = {
            name: product.name,
            slug: slug + "-" + Date.now().toString(36),
            price: parseFloat(product.price) || 0,
            stock: parseInt(product.stock) || 0,
            description: product.description || null,
            short_description: product.short_description || null,
            is_active: true,
          };

          if (product.sale_price && parseFloat(product.sale_price) > 0) {
            insertData.sale_price = parseFloat(product.sale_price);
          }

          if (product.category_slug && categoryMap.has(product.category_slug)) {
            insertData.category_id = categoryMap.get(product.category_slug);
          }

          if (product.images) {
            insertData.images = product.images.split("|").map((s: string) => s.trim());
          }

          if (sellerId) {
            insertData.seller_id = sellerId;
          }

          const { error } = await supabase.from("products").insert(insertData);
          if (error) throw error;
          success++;
        } catch (err: any) {
          failed++;
          errors.push(`${product.name}: ${err.message}`);
        }
      }

      setResult({ success, failed, errors });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });

      if (success > 0) {
        toast.success(`${success} ürün başarıyla eklendi`);
      }
      if (failed > 0) {
        toast.error(`${failed} ürün eklenemedi`);
      }
    } catch (err) {
      toast.error("Dosya işlenirken hata oluştu");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const headers = "name,price,sale_price,stock,description,short_description,category_slug,images";
    const example = '"Örnek Ürün",199.90,149.90,50,"Detaylı açıklama","Kısa açıklama","kategori-slug","url1|url2"';
    const csv = headers + "\n" + example;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "urun-sablonu.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Toplu Ürün Yükleme
        </CardTitle>
        <CardDescription>CSV dosyasından toplu ürün ekleyin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            CSV Şablonu İndir
          </Button>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer space-y-3 block">
            {importing ? (
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
            )}
            <p className="text-sm font-medium text-foreground">
              {importing ? "İçe aktarılıyor..." : "CSV dosyasını yüklemek için tıklayın"}
            </p>
            <p className="text-xs text-muted-foreground">
              Zorunlu sütunlar: name, price, stock
            </p>
          </label>
        </div>

        {result && (
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              {result.success > 0 && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {result.success} başarılı
                </span>
              )}
              {result.failed > 0 && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {result.failed} başarısız
                </span>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="text-xs text-destructive space-y-1 max-h-32 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkProductUpload;
