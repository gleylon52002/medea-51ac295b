import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Play, Trash2, Plus, Clock, CheckCircle, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  // Ürün
  { value: "check_stock", label: "Stok Kontrolü", description: "Düşük stoklu ürünleri tespit et", group: "Ürün" },
  { value: "deactivate_out_of_stock", label: "Stoksuz Ürünleri Pasifle", description: "Stoku 0 olan ürünleri pasife al", group: "Ürün" },
  { value: "activate_in_stock", label: "Stoklu Ürünleri Aktifle", description: "Stoku olan pasif ürünleri aktife al", group: "Ürün" },
  { value: "generate_product_descriptions", label: "Ürün Açıklamaları Oluştur", description: "Eksik açıklamaları AI ile tamamla", group: "Ürün" },
  { value: "update_product_tags", label: "Ürün Etiketlerini Güncelle", description: "AI ile ürün etiketlerini güncelle", group: "Ürün" },
  // SEO & İçerik
  { value: "generate_seo_report", label: "SEO Raporu", description: "Site SEO durumunu analiz et", group: "SEO" },
  { value: "update_seo_meta", label: "SEO Meta Güncelle", description: "Eksik meta başlık/açıklamaları tamamla", group: "SEO" },
  { value: "create_blog_posts", label: "Blog Yazıları Oluştur", description: "AI ile SEO uyumlu blog yazıları oluştur", group: "İçerik" },
  { value: "generate_faqs", label: "SSS Oluştur", description: "Sık sorulan soruları AI ile oluştur", group: "İçerik" },
  // Sipariş & Müşteri
  { value: "bulk_confirm_orders", label: "Siparişleri Toplu Onayla", description: "Bekleyen siparişleri toplu onayla", group: "Sipariş" },
  { value: "send_daily_report", label: "Günlük Rapor", description: "Günlük satış ve aktivite raporu", group: "Rapor" },
  { value: "cleanup_old_carts", label: "Eski Sepetleri Temizle", description: "30 günden eski terk edilmiş sepetleri sil", group: "Bakım" },
  // Mesaj & Yorum
  { value: "mark_messages_read", label: "Mesajları Okundu İşaretle", description: "Okunmamış mesajları okundu yap", group: "Mesaj" },
  { value: "approve_reviews", label: "Yorumları Onayla", description: "Bekleyen tüm yorumları onayla", group: "Yorum" },
];

const schedulePresets = [
  { label: "Her Saat", value: "0 * * * *", group: "saat" },
  { label: "Her 2 Saat", value: "0 */2 * * *", group: "saat" },
  { label: "Her 6 Saat", value: "0 */6 * * *", group: "saat" },
  { label: "Her 12 Saat", value: "0 */12 * * *", group: "saat" },
  { label: "Her Gün 09:00", value: "0 9 * * *", group: "gün" },
  { label: "Her Gün 18:00", value: "0 18 * * *", group: "gün" },
  { label: "Her Gün Gece 00:00", value: "0 0 * * *", group: "gün" },
  { label: "Hafta İçi 09:00", value: "0 9 * * 1-5", group: "hafta" },
  { label: "Her Pazartesi 09:00", value: "0 9 * * 1", group: "hafta" },
  { label: "Her Cuma 17:00", value: "0 17 * * 5", group: "hafta" },
  { label: "Ayın 1'i 09:00", value: "0 9 1 * *", group: "ay" },
  { label: "Ayın 15'i 09:00", value: "0 9 15 * *", group: "ay" },
];

const scheduleGroups = [
  { key: "saat", label: "Saatlik" },
  { key: "gün", label: "Günlük" },
  { key: "hafta", label: "Haftalık" },
  { key: "ay", label: "Aylık" },
];

const ScheduledTasks = ({ onRunTask }: { onRunTask: (task: Task) => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
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

  const runTask = async (task: Task) => {
    setRunningId(task.id);
    toast.info(`"${task.title}" çalıştırılıyor...`);
    
    try {
      const { data, error } = await supabase.functions.invoke("maintenance-ai", {
        body: {
          executeAction: true,
          actionType: task.action_type,
          actionParams: task.action_params || {},
        },
      });

      if (error) throw error;

      await supabase.from("maintenance_tasks")
        .update({ 
          last_run_at: new Date().toISOString(), 
          run_count: (task.run_count || 0) + 1,
          last_result: data || {},
        })
        .eq("id", task.id);

      await supabase.from("ai_action_logs").insert([{
        action_type: task.action_type,
        action_params: (task.action_params || {}) as Json,
        result: (data || {}) as Json,
        status: "success",
      }]);

      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, last_run_at: new Date().toISOString(), run_count: (t.run_count || 0) + 1 } 
          : t
      ));

      toast.success(`"${task.title}" başarıyla tamamlandı`);
      onRunTask(task);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
      toast.error(`Görev başarısız: ${errorMessage}`);
      
      await supabase.from("ai_action_logs").insert([{
        action_type: task.action_type,
        action_params: (task.action_params || {}) as Json,
        status: "failed",
        error_message: errorMessage,
      }]);
    } finally {
      setRunningId(null);
    }
  };

  const getScheduleLabel = (cron: string | null) => {
    if (!cron) return null;
    const preset = schedulePresets.find(p => p.value === cron);
    return preset?.label || cron;
  };

  // Group action types for better UX in select
  const groupedActions = actionTypes.reduce((acc, at) => {
    if (!acc[at.group]) acc[at.group] = [];
    acc[at.group].push(at);
    return acc;
  }, {} as Record<string, typeof actionTypes>);

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
          <DialogContent className="max-w-lg">
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
                    {Object.entries(groupedActions).map(([group, items]) => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                        {items.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
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
                    <SelectItem value="scheduled">Zamanlanmış (Otomatik)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newTask.task_type === "scheduled" && (
                <div className="space-y-3">
                  <Label>Çalışma Zamanı</Label>
                  <div className="space-y-3">
                    {scheduleGroups.map((group) => (
                      <div key={group.key}>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {schedulePresets
                            .filter(p => p.group === group.key)
                            .map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setNewTask({ ...newTask, schedule: preset.value })}
                                className={cn(
                                  "px-3 py-1.5 text-xs rounded-lg border transition-colors",
                                  newTask.schedule === preset.value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card border-border hover:bg-accent/50 text-foreground"
                                )}
                              >
                                {preset.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {newTask.schedule && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Seçilen: <span className="font-medium text-foreground">{getScheduleLabel(newTask.schedule)}</span>
                      <span className="text-muted-foreground/60">({newTask.schedule})</span>
                    </p>
                  )}
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
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {tasks.map((task) => {
            const isRunning = runningId === task.id;
            return (
              <div 
                key={task.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-all",
                  isRunning && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Switch 
                    checked={task.is_active}
                    onCheckedChange={(checked) => toggleTask(task.id, checked)}
                    disabled={isRunning}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {actionTypes.find(t => t.value === task.action_type)?.label || task.action_type}
                      </Badge>
                      {task.schedule && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getScheduleLabel(task.schedule)}
                        </span>
                      )}
                      {task.last_run_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          {task.run_count}x çalıştı
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant={isRunning ? "default" : "ghost"}
                    onClick={() => runTask(task)}
                    disabled={isRunning}
                    className={cn("h-8 w-8 p-0", isRunning && "animate-pulse")}
                  >
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => deleteTask(task.id)}
                    disabled={isRunning}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ScheduledTasks;
