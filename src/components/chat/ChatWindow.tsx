import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Loader2,
  FileText,
  Download,
  CheckCheck,
  Check,
  Shield,
  Store,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages, useSendMessage, Message } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ParticipantProfile } from "@/hooks/useParticipantProfiles";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatWindowProps {
  conversationId: string;
  title: string;
  onClose?: () => void;
  participantProfiles?: Record<string, ParticipantProfile & { is_admin?: boolean }>;
}

const EMOJI_LIST = ["👍", "❤️", "😊", "😂", "🙏", "👏", "🎉", "✅", "👌", "💯", "🔥", "⭐"];

const ChatWindow = ({ conversationId, title, onClose, participantProfiles = {} }: ChatWindowProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();

  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<
    { file: File; type: "image" | "document" | "other" }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!messages?.length || !user) return;
    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== user.id)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      supabase
        .from("messages" as any)
        .update({ is_read: true })
        .in("id", unreadIds)
        .then(() => {});
    }
  }, [messages, user]);

  const getSenderProfile = (senderId: string) => {
    if (senderId === user?.id) return null; // current user
    return participantProfiles[senderId];
  };

  // Group consecutive messages from same sender
  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    const groups: { senderId: string; messages: Message[]; isMe: boolean }[] = [];
    
    messages.forEach((msg) => {
      const isMe = msg.sender_id === user?.id;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.senderId === msg.sender_id) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ senderId: msg.sender_id, messages: [msg], isMe });
      }
    });
    
    return groups;
  }, [messages, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: content.trim(),
        attachments,
      });
      setContent("");
      setAttachments([]);
    } catch (error: any) {
      console.error("Message send error:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments = Array.from(files).map((file) => {
      let type: "image" | "document" | "other" = "other";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.includes("pdf") || file.type.includes("doc")) type = "document";
      return { file, type };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-card rounded-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {title[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-[11px] text-muted-foreground">
              {messages?.length || 0} mesaj
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-1">
          {/* Date separator for first message */}
          {messages?.[0] && (
            <div className="flex items-center justify-center my-3">
              <span className="text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground">
                {new Date(messages[0].created_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {groupedMessages.map((group, gi) => {
            const profile = getSenderProfile(group.senderId);
            const isMe = group.isMe;

            return (
              <div key={gi} className={cn("flex gap-2 mb-3", isMe ? "justify-end" : "justify-start")}>
                {/* Avatar for other user (only first in group) */}
                {!isMe && (
                  <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-bold",
                          (profile as any)?.is_admin
                            ? "bg-destructive/10 text-destructive"
                            : profile?.is_seller
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {(profile?.full_name?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                  {/* Sender name for other user */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <span className="text-[11px] font-semibold text-foreground/80">
                        {profile?.full_name || "Bilinmeyen"}
                      </span>
                      {(profile as any)?.is_admin && (
                        <Badge icon={<Shield className="h-2.5 w-2.5" />} label="Admin" variant="destructive" />
                      )}
                      {profile?.is_seller && !(profile as any)?.is_admin && (
                        <Badge icon={<Store className="h-2.5 w-2.5" />} label="Satıcı" variant="default" />
                      )}
                    </div>
                  )}

                  {group.messages.map((msg, mi) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "px-3 py-2 text-sm leading-relaxed",
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                        // Rounded corners based on position in group
                        mi === 0 && isMe && "rounded-2xl rounded-tr-md",
                        mi === 0 && !isMe && "rounded-2xl rounded-tl-md",
                        mi > 0 && mi < group.messages.length - 1 && isMe && "rounded-xl rounded-r-md",
                        mi > 0 && mi < group.messages.length - 1 && !isMe && "rounded-xl rounded-l-md",
                        mi === group.messages.length - 1 && mi > 0 && isMe && "rounded-2xl rounded-br-md",
                        mi === group.messages.length - 1 && mi > 0 && !isMe && "rounded-2xl rounded-bl-md",
                        group.messages.length === 1 && isMe && "rounded-2xl rounded-tr-md",
                        group.messages.length === 1 && !isMe && "rounded-2xl rounded-tl-md",
                        mi > 0 && "mt-0.5"
                      )}
                    >
                      {msg.content}

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.attachments.map((att) => (
                            <AttachmentPreview key={att.id} attachment={att} isMe={isMe} />
                          ))}
                        </div>
                      )}

                      {/* Time + read status */}
                      <div className={cn("flex items-center gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[9px]", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && (
                          msg.is_read ? (
                            <CheckCheck className={cn("h-3 w-3", "text-primary-foreground/70")} />
                          ) : (
                            <Check className={cn("h-3 w-3", "text-primary-foreground/50")} />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 flex flex-wrap gap-2">
          {attachments.map((item, i) => (
            <div
              key={i}
              className="relative bg-card p-2 rounded-lg border flex items-center gap-2 pr-8"
            >
              {item.type === "image" ? (
                <ImageIcon className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs truncate max-w-[100px]">{item.file.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 py-3 border-t flex items-center gap-2 bg-card">
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top" align="start">
            <div className="grid grid-cols-6 gap-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          placeholder="Mesajınızı yazın..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 h-9"
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={sendMessage.isPending || (!content.trim() && attachments.length === 0)}
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

// Small inline badge component
const Badge = ({
  icon,
  label,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  variant: "destructive" | "default";
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
      variant === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary"
    )}
  >
    {icon}
    {label}
  </span>
);

const AttachmentPreview = ({ attachment, isMe }: { attachment: any; isMe: boolean }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      const { data } = await supabase.storage
        .from("chat_attachments")
        .createSignedUrl(attachment.file_path, 3600);
      if (data) setUrl(data.signedUrl);
    };
    fetchUrl();
  }, [attachment.file_path]);

  if (attachment.file_type === "image") {
    return (
      <a
        href={url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg overflow-hidden border border-white/10"
      >
        {url ? (
          <img
            src={url}
            alt={attachment.file_name}
            className="max-h-48 object-cover hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="h-24 w-full bg-muted flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </a>
    );
  }

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border hover:opacity-80 transition-opacity",
        isMe ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-background/50 border-border"
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <div className="flex-1 overflow-hidden">
        <p className="text-xs font-medium truncate">{attachment.file_name}</p>
        <p className="text-[10px] opacity-70">{(attachment.file_size / 1024).toFixed(1)} KB</p>
      </div>
      <Download className="h-3 w-3 shrink-0" />
    </a>
  );
};

export default ChatWindow;
