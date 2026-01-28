import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export const useNewsletterSubscribers = () => {
  return useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      return data as NewsletterSubscriber[];
    },
  });
};

export const useSubscribeNewsletter = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("id, is_active")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existing) {
        if (existing.is_active) {
          throw new Error("Bu e-posta adresi zaten kayıtlı");
        }
        // Reactivate subscription
        const { error } = await supabase
          .from("newsletter_subscribers")
          .update({ is_active: true, unsubscribed_at: null })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.toLowerCase() });

      if (error) throw error;
    },
  });
};

export const useUnsubscribeNewsletter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
    },
  });
};

export const useDeleteNewsletterSubscriber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
    },
  });
};
