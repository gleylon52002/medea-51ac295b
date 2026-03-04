import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

const AdminCertificates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_certificates")
        .select("*, sellers(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("seller_certificates").update({
        status,
        approved_by: status === "approved" ? user?.id : null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      toast.success("Sertifika durumu güncellendi");
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = { pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi" };

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" />Sertifika Yönetimi</h1>
        <p className="text-muted-foreground mt-1">Satıcı sertifikalarını inceleyin ve onaylayın</p>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Satıcı</TableHead>
              <TableHead>Sertifika Adı</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Dosya</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates?.map(cert => (
              <TableRow key={cert.id}>
                <TableCell className="font-medium">{(cert.sellers as any)?.company_name || "-"}</TableCell>
                <TableCell>{cert.name}</TableCell>
                <TableCell><Badge variant="outline">{cert.certificate_type}</Badge></TableCell>
                <TableCell><span className={`px-2 py-1 rounded text-xs ${statusColors[cert.status]}`}>{statusLabels[cert.status]}</span></TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(cert.created_at), "dd MMM yyyy", { locale: tr })}</TableCell>
                <TableCell><a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm"><ExternalLink className="h-3 w-3" />Görüntüle</a></TableCell>
                <TableCell className="text-right space-x-1">
                  {cert.status === "pending" && <>
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateStatus.mutate({ id: cert.id, status: "approved" })}><CheckCircle className="h-4 w-4 mr-1" />Onayla</Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus.mutate({ id: cert.id, status: "rejected" })}><XCircle className="h-4 w-4 mr-1" />Reddet</Button>
                  </>}
                  {cert.status !== "pending" && <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: cert.id, status: "pending" })}>Sıfırla</Button>}
                </TableCell>
              </TableRow>
            ))}
            {!certificates?.length && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Henüz sertifika başvurusu yok</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminCertificates;
