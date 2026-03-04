import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const AdminBlog = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", meta_title: "", meta_description: "", cover_image: "", tags: "", is_published: false });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [] };
      if (editing) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success(editing ? "Güncellendi" : "Oluşturuldu");
      setIsOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); toast.success("Silindi"); },
  });

  const resetForm = () => { setForm({ title: "", slug: "", content: "", excerpt: "", meta_title: "", meta_description: "", cover_image: "", tags: "", is_published: false }); setEditing(null); };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: p.content, excerpt: p.excerpt || "", meta_title: p.meta_title || "", meta_description: p.meta_description || "", cover_image: p.cover_image || "", tags: (p.tags || []).join(", "), is_published: p.is_published });
    setIsOpen(true);
  };

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold">Blog Yönetimi</h1>
          <p className="text-muted-foreground mt-1">İçeriklerinizi yönetin</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Yeni Yazı</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Yazı Düzenle" : "Yeni Blog Yazısı"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Başlık</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, "-").replace(/-+/g, "-") })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Kapak Görseli URL</Label><Input value={form.cover_image} onChange={e => setForm({ ...form, cover_image: e.target.value })} /></div>
              <div><Label>Özet</Label><Textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} /></div>
              <div><Label>İçerik (Markdown)</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} /></div>
              <div><Label>Etiketler (virgülle ayırın)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
              <div><Label>Meta Başlık</Label><Input value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} /></div>
              <div><Label>Meta Açıklama</Label><Textarea value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} rows={2} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={c => setForm({ ...form, is_published: c })} /><Label>Yayında</Label></div>
              <Button onClick={() => save.mutate(form)} className="w-full" disabled={save.isPending}>{save.isPending ? "Kaydediliyor..." : "Kaydet"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Görüntülenme</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts?.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.is_published ? <span className="flex items-center gap-1 text-green-600 text-xs"><Eye className="h-3 w-3" />Yayında</span> : <span className="flex items-center gap-1 text-muted-foreground text-xs"><EyeOff className="h-3 w-3" />Taslak</span>}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "dd MMM yyyy", { locale: tr })}</TableCell>
                <TableCell>{p.views_count}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!posts?.length && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Henüz blog yazısı yok</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminBlog;
