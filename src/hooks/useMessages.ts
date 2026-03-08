import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_edited: boolean;
  created_at: string;
  reply_to_id?: string | null;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_path: string;
  file_type: "image" | "document" | "other";
  file_name: string;
  file_size: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  context_type: "direct" | "order" | "product_qa" | "complaint";
  context_id: string | null;
  last_message_at: string;
  created_at: string;
  unread_count?: number;
  last_message?: string;
}

// Hook to fetch user's conversations
export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("conversations" as any)
        .select(`*, messages:messages(content, created_at, is_read, sender_id)`)
        .contains("participants", [user.id])
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      return (data as any[]).map((conv) => {
        const sortedMessages = [...(conv.messages || [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMsg = sortedMessages[0];
        const unreadCount =
          conv.messages?.filter((m: any) => !m.is_read && m.sender_id !== user.id).length || 0;

        return {
          ...conv,
          last_message: lastMsg?.content,
          unread_count: unreadCount,
        };
      }) as Conversation[];
    },
    enabled: !!user,
  });
};

// Hook to fetch messages for a conversation
export const useMessages = (conversationId?: string) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages" as any)
        .select(`*, attachments:message_attachments(*)`)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as any as Message[];
    },
    enabled: !!conversationId,
  });
};

// Realtime subscription for messages
export const useRealtimeMessages = (conversationId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
};

// Hook to send a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      replyToId,
      attachments = [],
    }: {
      conversationId: string;
      content: string;
      replyToId?: string | null;
      attachments?: { file: File; type: "image" | "document" | "other" }[];
    }) => {
      if (!user) throw new Error("Giriş yapmanız gerekiyor");

      const insertData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      };

      const { data: messageData, error: messageError } = await supabase
        .from("messages" as any)
        .insert(insertData)
        .select()
        .single();

      if (messageError) throw messageError;
      const message = messageData as any;

      if (attachments.length > 0) {
        for (const item of attachments) {
          const fileExt = item.file.name.split(".").pop();
          const filePath = `chat/${conversationId}/${message.id}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("chat_attachments")
            .upload(filePath, item.file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          await supabase.from("message_attachments" as any).insert({
            message_id: message.id,
            file_path: filePath,
            file_type: item.type,
            file_name: item.file.name,
            file_size: item.file.size,
          });
        }
      }

      await supabase
        .from("conversations" as any)
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

// Hook to edit a message
export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, content, conversationId }: { messageId: string; content: string; conversationId: string }) => {
      const { error } = await supabase
        .from("messages" as any)
        .update({ content, is_edited: true })
        .eq("id", messageId);

      if (error) throw error;
      return { conversationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
    },
  });
};

// Hook to delete a single message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      // Delete attachments first
      await supabase.from("message_attachments" as any).delete().eq("message_id", messageId);
      const { error } = await supabase.from("messages" as any).delete().eq("id", messageId);
      if (error) throw error;
      return { conversationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Mesaj silindi");
    },
  });
};

// Hook to delete an entire conversation
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      // Delete all message attachments for this conversation
      const { data: msgs } = await supabase
        .from("messages" as any)
        .select("id")
        .eq("conversation_id", conversationId);

      if (msgs?.length) {
        const msgIds = (msgs as any[]).map((m) => m.id);
        await supabase.from("message_attachments" as any).delete().in("message_id", msgIds);
      }

      // Delete all messages
      await supabase.from("messages" as any).delete().eq("conversation_id", conversationId);

      // Delete conversation
      const { error } = await supabase.from("conversations" as any).delete().eq("id", conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Görüşme silindi");
    },
  });
};

// Hook to start or get a conversation
export const useGetOrCreateConversation = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      participantId,
      contextType = "direct",
      contextId = null,
    }: {
      participantId: string;
      contextType?: Conversation["context_type"];
      contextId?: string | null;
    }) => {
      if (!user) throw new Error("Giriş yapmanız gerekiyor");

      const { data: existing } = await supabase
        .from("conversations" as any)
        .select("id")
        .contains("participants", [user.id, participantId])
        .eq("context_type", contextType)
        .eq("context_id", contextId || null)
        .single();

      if (existing) return (existing as any).id;

      const { data: newConv, error } = await supabase
        .from("conversations" as any)
        .insert({
          participants: [user.id, participantId],
          context_type: contextType,
          context_id: contextId,
        })
        .select("id")
        .single();

      if (error) throw error;
      return (newConv as any).id;
    },
  });
};
