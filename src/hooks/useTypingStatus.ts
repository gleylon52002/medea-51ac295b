import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useTypingStatus = (conversationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Fetch who is typing
  const { data: typingUsers } = useQuery({
    queryKey: ["typing-status", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data } = await supabase
        .from("typing_status" as any)
        .select("user_id, is_typing, updated_at")
        .eq("conversation_id", conversationId)
        .eq("is_typing", true);
      
      // Filter out stale typing (older than 5 seconds)
      const now = Date.now();
      return ((data as any[]) || []).filter(
        (t) => t.user_id !== user?.id && now - new Date(t.updated_at).getTime() < 5000
      );
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  // Subscribe to realtime typing changes
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "typing_status", filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["typing-status", conversationId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !conversationId) return;
    await supabase
      .from("typing_status" as any)
      .upsert(
        { conversation_id: conversationId, user_id: user.id, is_typing: isTyping, updated_at: new Date().toISOString() },
        { onConflict: "conversation_id,user_id" }
      );
  }, [user, conversationId]);

  const handleTyping = useCallback(() => {
    setTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setTyping(false), 3000);
  }, [setTyping]);

  // Clean up typing status on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (user && conversationId) {
        supabase
          .from("typing_status" as any)
          .upsert(
            { conversation_id: conversationId, user_id: user.id, is_typing: false, updated_at: new Date().toISOString() },
            { onConflict: "conversation_id,user_id" }
          );
      }
    };
  }, [user, conversationId]);

  return {
    typingUsers: typingUsers || [],
    handleTyping,
    setTyping,
  };
};
