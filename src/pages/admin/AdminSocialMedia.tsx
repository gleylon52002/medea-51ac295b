import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Instagram, Facebook, Twitter, Youtube, Music2, Image } from "lucide-react";

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
}

const platformOptions = [
  { value: "Instagram", icon: "Instagram" },
  { value: "Facebook", icon: "Facebook" },
  { value: "Twitter", icon: "Twitter" },
  { value: "YouTube", icon: "Youtube" },
  { value: "TikTok", icon: "Music2" },
  { value: "Pinterest", icon: "Image" },
  { value: "LinkedIn", icon: "Linkedin" },
  { value: "WhatsApp", icon: "MessageCircle" },
  { value: "Telegram", icon: "Send" },
];

const getIconComponent = (iconName: string | null) => {
  switch (iconName) {
    case "Instagram": return Instagram;
    case "Facebook": return Facebook;
    case "Twitter": return Twitter;
    case "Youtube": return Youtube;
    case "Music2": return Music2;
    default: return Image;
  }
};

const AdminSocialMedia = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null);
  const [form, setForm] = useState({
    platform: "Instagram",
    url: "",
    icon_name: "Instagram",
    sort_order: 0,
    is_active: true,
  });

  const { data: socialLinks, isLoading } = useQuery({
    queryKey: ["admin", "social-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_media_links")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SocialMediaLink[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SocialMediaLink>) => {
      if (editingLink) {
        const { error } = await supabase
          .from("social_media_links")
          .update(data as any)
          .eq("id", editingLink.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("social_media_links").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "social-media"] });
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success(editingLink ? "Link güncellendi" : "Link eklendi");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_media_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "social-media"] });
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Link silindi");
    },
  });

  const resetForm = () => {
    setForm({
      platform: "Instagram",
      url: "",
      icon_name: "Instagram",
      sort_order: (socialLinks?.length || 0) + 1,
      is_active: true,
    });
    setEditingLink(null);
  };

  const handleEdit = (link: SocialMediaLink) => {
    setEditingLink(link);
    setForm({
      platform: link.platform,
      url: link.url,
      icon_name: link.icon_name || "Instagram",
      sort_order: link.sort_order,
      is_active: link.is_active,
    });
    setIsDialogOpen(true);
  };

  const handlePlatformChange = (value: string) => {
    const option = platformOptions.find(p => p.value === value);
    setForm({ 
      ...form, 
      platform: value, 
      icon_name: option?.icon || "Image" 
    });
  };

  const handleSubmit = () => {
    if (!form.platform || !form.url) {
      toast.error("Platform ve URL gerekli");
      return;
    }

    saveMutation.mutate({
      platform: form.platform,
      url: form.url,
      icon_name: form.icon_name,
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
          <h1 className="font-serif text-3xl font-bold text-foreground">Sosyal Medya</h1>
          <p className="text-muted-foreground mt-1">Sosyal medya hesaplarınızı yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Hesap
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLink ? "Hesap Düzenle" : "Yeni Hesap Ekle"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={handlePlatformChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://instagram.com/medeakozmetik"
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
                <Label>Aktif (footer'da göster)</Label>
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
              <TableHead>Platform</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {socialLinks?.map((link) => {
              const IconComponent = getIconComponent(link.icon_name);
              return (
                <TableRow key={link.id}>
                  <TableCell>{link.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {link.platform}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {link.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${link.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {link.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(link)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!socialLinks?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Henüz sosyal medya hesabı yok
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminSocialMedia;
