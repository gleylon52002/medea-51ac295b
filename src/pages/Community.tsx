import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Users, Plus, Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import RoutineForm from "@/components/community/RoutineForm";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const Community = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: routines, isLoading } = useQuery({
    queryKey: ["user-routines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_routines")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["routine-profiles"],
    queryFn: async () => {
      if (!routines?.length) return [];
      const userIds = [...new Set(routines.map(r => r.user_id))];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      return data || [];
    },
    enabled: !!routines?.length,
  });

  const { data: products } = useQuery({
    queryKey: ["routine-products"],
    queryFn: async () => {
      if (!routines?.length) return [];
      const allIds = [...new Set(routines.flatMap(r => r.product_ids || []))];
      if (!allIds.length) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, images, price, sale_price")
        .in("id", allIds);
      return data || [];
    },
    enabled: !!routines?.length,
  });

  return (
    <Layout>
      <SEOHead title="Topluluk - Medea" description="Bakım rutinlerini paylaş, ilham al" />
      <div className="container-main py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Topluluk</h1>
            <p className="text-sm text-muted-foreground">Bakım rutinlerinizi paylaşın, diğerlerinden ilham alın</p>
          </div>
          {user && (
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Paylaş
            </Button>
          )}
        </div>

        {showForm && <div className="mb-6"><RoutineForm onClose={() => setShowForm(false)} /></div>}

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : routines?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Henüz paylaşım yok. İlk siz paylaşın!</div>
        ) : (
          <div className="space-y-4">
            {routines?.map(routine => {
              const profile = profiles?.find(p => p.user_id === routine.user_id);
              const routineProducts = (routine.product_ids || []).map((id: string) => products?.find(p => p.id === id)).filter(Boolean);

              return (
                <div key={routine.id} className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {profile?.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile?.full_name || "Anonim"}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(routine.created_at), { locale: tr, addSuffix: true })}</p>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">{routine.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{routine.content}</p>

                  {routineProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {routineProducts.map((p: any) => (
                        <Link key={p.id} to={`/urun/${p.slug}`} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/5 text-xs hover:bg-primary/10 transition-colors">
                          <ShoppingBag className="h-3 w-3 text-primary" />
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Heart className="h-3.5 w-3.5" /> {routine.likes_count}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Community;
