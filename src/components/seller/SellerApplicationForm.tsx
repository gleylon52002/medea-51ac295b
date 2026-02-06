import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Store, Building2, CreditCard, FileText, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSubmitSellerApplication, useSellerStatus } from "@/hooks/useSeller";
import { useAuth } from "@/contexts/AuthContext";

const applicationSchema = z.object({
  company_name: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
  tax_number: z.string().min(10, "Vergi numarası 10 haneli olmalıdır").max(11, "Vergi numarası 11 haneden fazla olamaz"),
  identity_number: z.string().length(11, "TC Kimlik No 11 haneli olmalıdır"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  address: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
  city: z.string().min(2, "Şehir seçiniz"),
  district: z.string().min(2, "İlçe giriniz"),
  bank_name: z.string().min(2, "Banka adı giriniz"),
  iban: z.string().min(26, "Geçerli bir IBAN giriniz").max(26, "IBAN 26 karakter olmalıdır"),
  account_holder: z.string().min(2, "Hesap sahibi adı giriniz"),
  description: z.string().optional(),
  category_focus: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export const SellerApplicationForm = () => {
  const { user } = useAuth();
  const { data: sellerStatus, isLoading: statusLoading } = useSellerStatus();
  const submitApplication = useSubmitSellerApplication();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      company_name: "",
      tax_number: "",
      identity_number: "",
      phone: "",
      address: "",
      city: "",
      district: "",
      bank_name: "",
      iban: "",
      account_holder: "",
      description: "",
      category_focus: "",
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    submitApplication.mutate({
      company_name: data.company_name,
      tax_number: data.tax_number,
      identity_number: data.identity_number,
      phone: data.phone,
      address: data.address,
      city: data.city,
      district: data.district,
      bank_name: data.bank_name,
      iban: data.iban,
      account_holder: data.account_holder,
      description: data.description || null,
      category_focus: data.category_focus || null,
    });
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Satıcı olmak için önce giriş yapmanız gerekmektedir.
        </p>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already a seller
  if (sellerStatus?.type === "seller") {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
        <h3 className="font-medium text-lg mb-2">Zaten Satıcısınız!</h3>
        <p className="text-muted-foreground mb-4">
          Satıcı panelinize giderek ürünlerinizi yönetebilirsiniz.
        </p>
        <Button asChild>
          <a href="/satici">Satıcı Paneline Git</a>
        </Button>
      </div>
    );
  }

  // Has pending application
  if (sellerStatus?.type === "application") {
    const application = sellerStatus.data;
    
    if (application.status === "pending") {
      return (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto text-warning mb-4" />
          <h3 className="font-medium text-lg mb-2">Başvurunuz İnceleniyor</h3>
          <p className="text-muted-foreground mb-2">
            Başvuru tarihi: {new Date(application.created_at).toLocaleDateString("tr-TR")}
          </p>
          <p className="text-sm text-muted-foreground">
            Başvurunuz en kısa sürede değerlendirilecektir.
          </p>
        </div>
      );
    }

    if (application.status === "rejected") {
      return (
        <div className="text-center py-8">
          <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="font-medium text-lg mb-2">Başvurunuz Reddedildi</h3>
          <p className="text-muted-foreground mb-2">
            Red nedeni: {application.rejection_reason || "Belirtilmedi"}
          </p>
          <p className="text-sm text-muted-foreground">
            Daha fazla bilgi için bizimle iletişime geçebilirsiniz.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Store className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="font-medium text-lg mb-2">Satıcı Ol</h3>
        <p className="text-muted-foreground text-sm">
          MEDEA'da ürünlerinizi satmak için başvuru formunu doldurun.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Firma Bilgileri
            </div>

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma / Marka Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: ABC Kozmetik" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tax_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi No *</FormLabel>
                    <FormControl>
                      <Input placeholder="10 haneli" maxLength={11} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="identity_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TC Kimlik No *</FormLabel>
                    <FormControl>
                      <Input placeholder="11 haneli" maxLength={11} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon *</FormLabel>
                  <FormControl>
                    <Input placeholder="05XX XXX XX XX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adres *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tam adres..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şehir *</FormLabel>
                    <FormControl>
                      <Input placeholder="İstanbul" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlçe *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kadıköy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Bank Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Banka Bilgileri
            </div>

            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banka Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Garanti BBVA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN *</FormLabel>
                  <FormControl>
                    <Input placeholder="TR..." maxLength={26} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_holder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hesap Sahibi *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ad Soyad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Ek Bilgiler
            </div>

            <FormField
              control={form.control}
              name="category_focus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satmayı Düşündüğünüz Kategoriler</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Cilt Bakımı, Makyaj" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma Hakkında</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Kendinizi ve ürünlerinizi kısaca tanıtın..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitApplication.isPending}
          >
            {submitApplication.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Başvuru Yap"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SellerApplicationForm;
