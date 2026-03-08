import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  Trash2,
  Pencil,
  Reply,
  MoreVertical,
  Search,
  Copy,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useRealtimeMessages,
  Message,
} from "@/hooks/useMessages";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ChatWindowProps {
  conversationId: string;
  title: string;
  onClose?: () => void;
  participantProfiles?: Record<string, ParticipantProfile & { is_admin?: boolean }>;
}

const EMOJI_LIST = [
  "👍", "❤️", "😊", "😂", "🙏", "👏", "🎉", "✅", "👌", "💯", "🔥", "⭐",
  "😍", "🤔", "😢", "😮", "🙌", "💪", "🤝", "💐", "🎁", "📦", "✨", "🌟",
];

const ChatWindow = ({ conversationId, title, onClose, participantProfiles = {} }: ChatWindowProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();

  // Realtime
  useRealtimeMessages(conversationId);

  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<{ file: File; type: "image" | "document" | "other" }[]>([]);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollEl = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, []);

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages, scrollToBottom]);

  // Track scroll position for "scroll to bottom" button
  useEffect(() => {
    const scrollEl = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!scrollEl) return;
    const handleScroll = () => {
      const distFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      setShowScrollDown(distFromBottom > 200);
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

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
    if (senderId === user?.id) return null;
    return participantProfiles[senderId];
  };

  // Search filtered messages
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || !messages) return [];
    const term = searchTerm.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(term));
  }, [searchTerm, messages]);

  // Group consecutive messages from same sender, with date separators
  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    const groups: {
      type: "date" | "messages";
      date?: string;
      senderId?: string;
      messages?: Message[];
      isMe?: boolean;
    }[] = [];

    let lastDate = "";

    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (msgDate !== lastDate) {
        groups.push({ type: "date", date: msgDate });
        lastDate = msgDate;
      }

      const isMe = msg.sender_id === user?.id;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.type === "messages" && lastGroup.senderId === msg.sender_id) {
        lastGroup.messages!.push(msg);
      } else {
        groups.push({ type: "messages", senderId: msg.sender_id, messages: [msg], isMe });
      }
    });

    return groups;
  }, [messages, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;

    try {
      if (editingMsg) {
        await editMessage.mutateAsync({
          messageId: editingMsg.id,
          content: content.trim(),
          conversationId,
        });
        setEditingMsg(null);
      } else {
        await sendMessage.mutateAsync({
          conversationId,
          content: content.trim(),
          replyToId: replyToMsg?.id,
          attachments,
        });
        setReplyToMsg(null);
      }
      setContent("");
      setAttachments([]);
    } catch (error: any) {
      console.error("Message error:", error);
      toast.error("Mesaj gönderilemedi");
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
    inputRef.current?.focus();
  };

  const startEdit = (msg: Message) => {
    setEditingMsg(msg);
    setReplyToMsg(null);
    setContent(msg.content);
    inputRef.current?.focus();
  };

  const startReply = (msg: Message) => {
    setReplyToMsg(msg);
    setEditingMsg(null);
    inputRef.current?.focus();
  };

  const cancelEditReply = () => {
    setEditingMsg(null);
    setReplyToMsg(null);
    setContent("");
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Mesaj kopyalandı");
  };

  const scrollToMessage = (msgId: string) => {
    setHighlightedMsgId(msgId);
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
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
            <p className="text-[11px] text-muted-foreground">{messages?.length || 0} mesaj</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setSearchOpen(!searchOpen); setSearchTerm(""); }}
          >
            <Search className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-3 py-2 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Mesajlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm"
              autoFocus
            />
            {searchTerm && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {searchResults.length} sonuç
              </span>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1">
              {searchResults.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => { scrollToMessage(msg.id); setSearchOpen(false); setSearchTerm(""); }}
                  className="w-full text-left p-1.5 rounded text-xs hover:bg-muted truncate text-muted-foreground"
                >
                  <span className="text-foreground font-medium">
                    {participantProfiles[msg.sender_id]?.full_name || (msg.sender_id === user?.id ? "Sen" : "?")}
                  </span>
                  : {msg.content}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-1">
          {groupedMessages.map((group, gi) => {
            if (group.type === "date") {
              return (
                <div key={`date-${gi}`} className="flex items-center justify-center my-3">
                  <span className="text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground">
                    {group.date}
                  </span>
                </div>
              );
            }

            const profile = getSenderProfile(group.senderId!);
            const isMe = group.isMe!;

            return (
              <div key={gi} className={cn("flex gap-2 mb-3", isMe ? "justify-end" : "justify-start")}>
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
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <span className="text-[11px] font-semibold text-foreground/80">
                        {profile?.full_name || "Bilinmeyen"}
                      </span>
                      {(profile as any)?.is_admin && (
                        <RoleBadge icon={<Shield className="h-2.5 w-2.5" />} label="Admin" variant="destructive" />
                      )}
                      {profile?.is_seller && !(profile as any)?.is_admin && (
                        <RoleBadge icon={<Store className="h-2.5 w-2.5" />} label="Satıcı" variant="default" />
                      )}
                    </div>
                  )}

                  {group.messages!.map((msg, mi) => {
                    const isHighlighted = highlightedMsgId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={cn(
                          "group relative px-3 py-2 text-sm leading-relaxed transition-colors duration-500",
                          isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                          getBubbleRadius(mi, group.messages!.length, isMe),
                          mi > 0 && "mt-0.5",
                          isHighlighted && "ring-2 ring-primary/50 bg-primary/20"
                        )}
                      >
                        {/* Context menu trigger */}
                        <div className={cn(
                          "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                          isMe ? "-left-8" : "-right-8"
                        )}>
                          <MessageActions
                            msg={msg}
                            isMe={isMe}
                            onEdit={() => startEdit(msg)}
                            onReply={() => startReply(msg)}
                            onDelete={() => setDeleteConfirm(msg.id)}
                            onCopy={() => handleCopyMessage(msg.content)}
                          />
                        </div>

                        {/* Reply preview */}
                        {msg.reply_to_id && (
                          <ReplyPreview
                            replyToId={msg.reply_to_id}
                            messages={messages || []}
                            profiles={participantProfiles}
                            userId={user?.id}
                            isMe={isMe}
                            onScrollTo={scrollToMessage}
                          />
                        )}

                        {msg.content}

                        {msg.is_edited && (
                          <span className={cn("text-[9px] ml-1", isMe ? "text-primary-foreground/50" : "text-muted-foreground/70")}>
                            (düzenlendi)
                          </span>
                        )}

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
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMe &&
                            (msg.is_read ? (
                              <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                            ) : (
                              <Check className="h-3 w-3 text-primary-foreground/50" />
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!messages?.length && (
            <div className="text-center text-muted-foreground text-sm py-12">
              <p>Henüz mesaj yok. İlk mesajı gönderin! 👋</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to bottom */}
      {showScrollDown && (
        <div className="absolute bottom-28 right-8 z-20">
          <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-9 w-9" onClick={scrollToBottom}>
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit / Reply bar */}
      {(editingMsg || replyToMsg) && (
        <div className="px-3 py-2 border-t bg-muted/40 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            {editingMsg && (
              <div className="flex items-center gap-2 text-xs">
                <Pencil className="h-3 w-3 text-primary shrink-0" />
                <span className="text-muted-foreground">Düzenleniyor:</span>
                <span className="truncate text-foreground">{editingMsg.content}</span>
              </div>
            )}
            {replyToMsg && (
              <div className="flex items-center gap-2 text-xs">
                <Reply className="h-3 w-3 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  {replyToMsg.sender_id === user?.id
                    ? "Kendinize"
                    : participantProfiles[replyToMsg.sender_id]?.full_name || "Bilinmeyen"}
                  'e yanıt:
                </span>
                <span className="truncate text-foreground">{replyToMsg.content}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={cancelEditReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 flex flex-wrap gap-2">
          {attachments.map((item, i) => (
            <div key={i} className="relative bg-card p-2 rounded-lg border flex items-center gap-2 pr-8">
              {item.type === "image" ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs truncate max-w-[100px]">{item.file.name}</span>
              <button onClick={() => removeAttachment(i)} className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-muted">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 py-3 border-t flex items-center gap-2 bg-card">
        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => fileInputRef.current?.click()}>
          <Paperclip className="h-4 w-4" />
        </Button>

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
          ref={inputRef}
          placeholder={editingMsg ? "Mesajı düzenle..." : "Mesajınızı yazın..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 h-9"
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelEditReply();
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={sendMessage.isPending || editMessage.isPending || (!content.trim() && attachments.length === 0)}
        >
          {sendMessage.isPending || editMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mesajı sil</AlertDialogTitle>
            <AlertDialogDescription>Bu mesajı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm) {
                  deleteMessage.mutate({ messageId: deleteConfirm, conversationId });
                  setDeleteConfirm(null);
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- Helper components ---

function getBubbleRadius(index: number, total: number, isMe: boolean) {
  if (total === 1) return isMe ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md";
  if (index === 0) return isMe ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md";
  if (index === total - 1) return isMe ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md";
  return isMe ? "rounded-xl rounded-r-md" : "rounded-xl rounded-l-md";
}

const MessageActions = ({
  msg,
  isMe,
  onEdit,
  onReply,
  onDelete,
  onCopy,
}: {
  msg: Message;
  isMe: boolean;
  onEdit: () => void;
  onReply: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-6 w-6 bg-card/80 shadow-sm border">
        <MoreVertical className="h-3 w-3" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={isMe ? "end" : "start"} className="w-36">
      <DropdownMenuItem onClick={onReply}>
        <Reply className="h-3.5 w-3.5 mr-2" />
        Yanıtla
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onCopy}>
        <Copy className="h-3.5 w-3.5 mr-2" />
        Kopyala
      </DropdownMenuItem>
      {isMe && (
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-2" />
          Düzenle
        </DropdownMenuItem>
      )}
      {isMe && (
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Sil
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const ReplyPreview = ({
  replyToId,
  messages,
  profiles,
  userId,
  isMe,
  onScrollTo,
}: {
  replyToId: string;
  messages: Message[];
  profiles: Record<string, any>;
  userId?: string;
  isMe: boolean;
  onScrollTo: (id: string) => void;
}) => {
  const replyMsg = messages.find((m) => m.id === replyToId);
  if (!replyMsg) return null;

  const senderName =
    replyMsg.sender_id === userId ? "Sen" : profiles[replyMsg.sender_id]?.full_name || "Bilinmeyen";

  return (
    <button
      onClick={() => onScrollTo(replyToId)}
      className={cn(
        "block w-full text-left mb-1.5 pl-2 border-l-2 text-[11px] rounded-sm",
        isMe ? "border-primary-foreground/40 text-primary-foreground/70" : "border-primary/40 text-muted-foreground"
      )}
    >
      <span className="font-semibold">{senderName}</span>
      <p className="truncate">{replyMsg.content}</p>
    </button>
  );
};

const RoleBadge = ({ icon, label, variant }: { icon: React.ReactNode; label: string; variant: "destructive" | "default" }) => (
  <span
    className={cn(
      "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
      variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
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
      const { data } = await supabase.storage.from("chat_attachments").createSignedUrl(attachment.file_path, 3600);
      if (data) setUrl(data.signedUrl);
    };
    fetchUrl();
  }, [attachment.file_path]);

  if (attachment.file_type === "image") {
    return (
      <a href={url || "#"} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-white/10">
        {url ? (
          <img src={url} alt={attachment.file_name} className="max-h-48 object-cover hover:opacity-90 transition-opacity" />
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
