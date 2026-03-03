import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Trash, Bell, Gift } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const BirthdayReminders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const { data: reminders } = useQuery({
    queryKey: ["birthday-reminders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("birthday_reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("birthday");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addReminder = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Giriş yapmalısınız");
      const { error } = await supabase.from("birthday_reminders").insert({
        user_id: user.id,
        person_name: name,
        birthday: date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hatırlatıcı eklendi!");
      queryClient.invalidateQueries({ queryKey: ["birthday-reminders"] });
      setName("");
      setDate("");
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("birthday_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday-reminders"] });
      toast.success("Hatırlatıcı silindi");
    },
  });

  const getDaysUntil = (birthday: string) => {
    const today = new Date();
    const bday = new Date(birthday);
    bday.setFullYear(today.getFullYear());
    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
    return Math.ceil((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return <Layout><div className="container-main py-12 text-center"><p>Giriş yapmalısınız</p></div></Layout>;
  }

  return (
    <Layout>
      <SEOHead title="Doğum Günü Hatırlatıcıları - Medea" description="Sevdiklerinizin doğum günlerini kaçırmayın" />
      <div className="container-main py-8 max-w-lg mx-auto">
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6 text-primary" /> Doğum Günü Hatırlatıcıları
        </h1>

        <div className="rounded-xl border p-4 mb-6 space-y-3">
          <h3 className="font-semibold text-sm">Yeni Hatırlatıcı Ekle</h3>
          <Input placeholder="Kişi adı (ör: Annem)" value={name} onChange={e => setName(e.target.value)} />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Button className="w-full gap-1" onClick={() => addReminder.mutate()} disabled={!name || !date || addReminder.isPending}>
            <Plus className="h-4 w-4" /> Ekle
          </Button>
        </div>

        <div className="space-y-3">
          {reminders?.map(r => {
            const daysUntil = getDaysUntil(r.birthday);
            const isClose = daysUntil <= 14;
            return (
              <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${isClose ? "border-primary/30 bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isClose ? "bg-primary/20" : "bg-muted"}`}>
                    {isClose ? <Gift className="h-5 w-5 text-primary" /> : <Calendar className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.person_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.birthday).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      {isClose && <span className="text-primary font-medium ml-1">({daysUntil} gün kaldı!)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {isClose && (
                    <Button variant="outline" size="sm" asChild>
                      <a href="/hediye-paketi">Hediye Al</a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteReminder.mutate(r.id)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
          {reminders?.length === 0 && (
            <p className="text-center text-muted-foreground py-6">Henüz hatırlatıcı eklemediniz.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BirthdayReminders;
