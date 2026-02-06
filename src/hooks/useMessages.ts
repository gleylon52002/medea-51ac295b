import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    is_edited: boolean;
    created_at: string;
    attachments?: MessageAttachment[];
}

export interface MessageAttachment {
    id: string;
    message_id: string;
    file_path: string;
    file_type: 'image' | 'document' | 'other';
    file_name: string;
    file_size: number;
}

export interface Conversation {
    id: string;
    participants: string[];
    context_type: 'direct' | 'order' | 'product_qa' | 'complaint';
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
                .select(`
          *,
          messages:messages(content, created_at, is_read, sender_id)
        `)
                .contains("participants", [user.id])
                .order("last_message_at", { ascending: false });

            if (error) throw error;

            return (data as any[]).map(conv => {
                const lastMsg = conv.messages?.[0];
                const unreadCount = conv.messages?.filter((m: any) => !m.is_read && m.sender_id !== user.id).length || 0;

                return {
                    ...conv,
                    last_message: lastMsg?.content,
                    unread_count: unreadCount
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
                .select(`
          *,
          attachments:message_attachments(*)
        `)
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return (data as any) as Message[];
        },
        enabled: !!conversationId,
    });
};

// Hook to send a message
export const useSendMessage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            conversationId,
            content,
            attachments = []
        }: {
            conversationId: string;
            content: string;
            attachments?: { file: File; type: 'image' | 'document' | 'other' }[]
        }) => {
            if (!user) throw new Error("Giriş yapmanız gerekiyor");

            // 1. Insert message
            const { data: messageData, error: messageError } = await supabase
                .from("messages" as any)
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content,
                })
                .select()
                .single();

            if (messageError) throw messageError;
            const message = messageData as any;

            // 2. Upload and insert attachments if any
            if (attachments.length > 0) {
                for (const item of attachments) {
                    const fileExt = item.file.name.split('.').pop();
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
                        file_size: item.file.size
                    });
                }
            }

            // 3. Update conversation last_message_at
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

// Hook to start or get a conversation
export const useGetOrCreateConversation = () => {
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            participantId,
            contextType = 'direct',
            contextId = null
        }: {
            participantId: string;
            contextType?: Conversation['context_type'];
            contextId?: string | null;
        }) => {
            if (!user) throw new Error("Giriş yapmanız gerekiyor");

            // Check for existing conversation with these participants and context
            const { data: existing } = await supabase
                .from("conversations" as any)
                .select("id")
                .contains("participants", [user.id, participantId])
                .eq("context_type", contextType)
                .eq("context_id", contextId || null)
                .single();

            if (existing) return existing.id;

            // Create new
            const { data: newConv, error } = await supabase
                .from("conversations" as any)
                .insert({
                    participants: [user.id, participantId],
                    context_type: contextType,
                    context_id: contextId
                })
                .select("id")
                .single();

            if (error) throw error;
            return newConv.id;
        }
    });
};
