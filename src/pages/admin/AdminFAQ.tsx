import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const AdminFAQ = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    sort_order: 0,
    is_active: true,
  });

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FAQ>) => {
      if (editingFaq) {
        const { error } = await supabase
          .from("faqs")
          .update(data as any)
          .eq("id", editingFaq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("faqs").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
      toast.success(editingFaq ? "Soru güncellendi" : "Soru eklendi");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
      toast.success("Soru silindi");
    },
  });

  const resetForm = () => {
    setForm({
      question: "",
      answer: "",
      sort_order: (faqs?.length || 0) + 1,
      is_active: true,
    });
    setEditingFaq(null);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.question || !form.answer) {
      toast.error("Soru ve cevap gerekli");
      return;
    }

    saveMutation.mutate({
      question: form.question,
      answer: form.answer,
      sort_order: form.sort_order,
      is_active: form.is_active,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Sık Sorulan Sorular</h1>
          <p className="text-muted-foreground mt-1">SSS bölümünü yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Soru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFaq ? "Soru Düzenle" : "Yeni Soru Ekle"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Soru</Label>
                <Input
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Kargo ne zaman gelir?"
                />
              </div>
              <div>
                <Label>Cevap</Label>
                <Textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Siparişiniz 2-5 iş günü içinde kargoya verilir..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>Aktif</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Sıra</TableHead>
              <TableHead>Soru</TableHead>
              <TableHead>Cevap</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs?.map((faq) => (
              <TableRow key={faq.id}>
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">{faq.question}</TableCell>
                <TableCell className="max-w-xs truncate">{faq.answer}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${faq.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {faq.is_active ? "Aktif" : "Pasif"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(faq)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!faqs?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Henüz soru yok
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminFAQ;
