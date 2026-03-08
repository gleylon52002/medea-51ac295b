import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Play, Trash2, Plus, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  title: string;
  description: string | null;
  schedule: string | null;
  task_type: string;
  action_type: string;
  action_params: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
}

const actionTypes = [
  { value: "check_stock", label: "Stok Kontrolü", description: "Düşük stoklu ürünleri tespit et" },
  { value: "deactivate_out_of_stock", label: "Stoksuz Ürünleri Pasifle", description: "Stoku 0 olan ürünleri pasife al" },
  { value: "generate_seo_report", label: "SEO Raporu", description: "Site SEO durumunu analiz et" },
  { value: "send_daily_report", label: "Günlük Rapor", description: "Günlük satış ve aktivite raporu" },
  { value: "cleanup_old_carts", label: "Eski Sepetleri Temizle", description: "30 günden eski terk edilmiş sepetleri sil" },
  { value: "update_product_tags", label: "Ürün Etiketlerini Güncelle", description: "AI ile ürün etiketlerini güncelle" },
];

const ScheduledTasks = ({ onRunTask }: { onRunTask: (task: Task) => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    action_type: "",
    task_type: "manual",
    schedule: "",
  });

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (id: string, isActive: boolean) => {
    await supabase.from("maintenance_tasks").update({ is_active: isActive }).eq("id", id);
    setTasks(tasks.map(t => t.id === id ? { ...t, is_active: isActive } : t));
  };

  const deleteTask = async (id: string) => {
    await supabase.from("maintenance_tasks").delete().eq("id", id);
    setTasks(tasks.filter(t => t.id !== id));
    toast.success("Görev silindi");
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.action_type) {
      toast.error("Başlık ve aksiyon tipi gerekli");
      return;
    }

    const { data, error } = await supabase.from("maintenance_tasks").insert({
      title: newTask.title,
      description: newTask.description || null,
      action_type: newTask.action_type,
      task_type: newTask.task_type,
      schedule: newTask.schedule || null,
    }).select().single();

    if (error) {
      toast.error("Görev oluşturulamadı");
      return;
    }

    setTasks([data as Task, ...tasks]);
    setDialogOpen(false);
    setNewTask({ title: "", description: "", action_type: "", task_type: "manual", schedule: "" });
    toast.success("Görev oluşturuldu");
  };

  const runTask = (task: Task) => {
    onRunTask(task);
    // Update last_run_at
    supabase.from("maintenance_tasks")
      .update({ last_run_at: new Date().toISOString(), run_count: task.run_count + 1 })
      .eq("id", task.id)
      .then(() => fetchTasks());
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Görevler yükleniyor...</div>;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Zamanlanmış Görevler</h3>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Yeni Görev
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Bakım Görevi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Görev Adı</Label>
                <Input 
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Günlük stok kontrolü"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Aksiyon Tipi</Label>
                <Select value={newTask.action_type} onValueChange={(v) => setNewTask({ ...newTask, action_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aksiyon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Görev Tipi</Label>
                <Select value={newTask.task_type} onValueChange={(v) => setNewTask({ ...newTask, task_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel (Elle çalıştır)</SelectItem>
                    <SelectItem value="scheduled">Zamanlanmış (Cron)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newTask.task_type === "scheduled" && (
                <div className="space-y-2">
                  <Label>Cron İfadesi</Label>
                  <Input 
                    value={newTask.schedule}
                    onChange={(e) => setNewTask({ ...newTask, schedule: e.target.value })}
                    placeholder="0 9 * * * (her gün 09:00)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Örnek: "0 9 * * *" = Her gün 09:00, "0 */6 * * *" = Her 6 saatte
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Açıklama (opsiyonel)</Label>
                <Textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Görev açıklaması..."
                />
              </div>

              <Button onClick={createTask} className="w-full">
                Görev Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Henüz zamanlanmış görev yok</p>
          <p className="text-xs">AI'a görev planlamasını söyleyebilirsiniz</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Switch 
                  checked={task.is_active}
                  onCheckedChange={(checked) => toggleTask(task.id, checked)}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {actionTypes.find(t => t.value === task.action_type)?.label || task.action_type}
                    </Badge>
                    {task.schedule && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.schedule}
                      </span>
                    )}
                    {task.last_run_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        {task.run_count}x
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => runTask(task)}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => deleteTask(task.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ScheduledTasks;
