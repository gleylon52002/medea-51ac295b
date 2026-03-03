import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";

interface RoutineFormProps {
  onClose: () => void;
}

const RoutineForm = ({ onClose }: RoutineFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: products } = useProducts();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const createRoutine = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Giriş yapmalısınız");
      const { error } = await supabase.from("user_routines").insert({
        user_id: user.id,
        title,
        content,
        product_ids: selectedProducts,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rutininiz paylaşıldı! Admin onayından sonra yayınlanacak.");
      queryClient.invalidateQueries({ queryKey: ["user-routines"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = products?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Bakım Rutinini Paylaş</h3>
        <button onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <Input placeholder="Başlık (ör: Sabah Bakım Rutinim)" value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea placeholder="Rutininizi anlatın..." value={content} onChange={e => setContent(e.target.value)} rows={4} />
      
      <div>
        <p className="text-xs text-muted-foreground mb-1">Kullandığınız ürünleri etiketleyin:</p>
        <Input placeholder="Ürün ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-2" />
        <div className="flex flex-wrap gap-1">
          {filtered?.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProducts(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
              className={`text-xs px-2 py-1 rounded-full border transition-all ${selectedProducts.includes(p.id) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full gap-2" onClick={() => createRoutine.mutate()} disabled={!title || !content || createRoutine.isPending}>
        <Send className="h-4 w-4" />
        {createRoutine.isPending ? "Paylaşılıyor..." : "Paylaş"}
      </Button>
    </div>
  );
};

export default RoutineForm;
