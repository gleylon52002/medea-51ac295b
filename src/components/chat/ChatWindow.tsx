import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Send, Paperclip, Image as ImageIcon, X, Loader2, FileText, Download,
  CheckCheck, Check, Shield, Store, Smile, Trash2, Pencil, Reply,
  MoreVertical, Search, Copy, ArrowDown, ShoppingBag, AlertTriangle,
  Forward, Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMessages, useSendMessage, useEditMessage, useDeleteMessage,
  useRealtimeMessages, Message,
} from "@/hooks/useMessages";
import { useTypingStatus } from "@/hooks/useTypingStatus";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ParticipantProfile } from "@/hooks/useParticipantProfiles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ChatWindowProps {
  conversationId: string;
  title: string;
  onClose?: () => void;
  participantProfiles?: Record<string, ParticipantProfile & { is_admin?: boolean }>;
  contextType?: string;
  contextId?: string | null;
}

const EMOJI_CATEGORIES = {
  "Sık Kullanılan": ["👍", "❤️", "😊", "😂", "🙏", "👏", "🎉", "✅", "👌", "💯", "🔥", "⭐"],
  "Ticaret": ["📦", "🛒", "💰", "🧾", "🚚", "✨", "🎁", "💳", "📋", "🏷️", "📞", "📧"],
  "Duygular": ["😍", "🤔", "😢", "😮", "🙌", "💪", "🤝", "💐", "🥳", "😅", "🫡", "👋"],
};

const ChatWindow = ({ conversationId, title, onClose, participantProfiles = {}, contextType, contextId }: ChatWindowProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const { typingUsers, handleTyping, setTyping } = useTypingStatus(conversationId);

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
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollEl = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, []);

  useEffect(() => { setTimeout(scrollToBottom, 100); }, [messages, scrollToBottom]);

  useEffect(() => {
    const scrollEl = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!scrollEl) return;
    const handleScroll = () => {
      const dist = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      setShowScrollDown(dist > 200);
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  // Mark messages as read
  useEffect(() => {
    if (!messages?.length || !user) return;
    const unreadIds = messages.filter((m) => !m.is_read && m.sender_id !== user.id).map((m) => m.id);
    if (unreadIds.length > 0) {
      supabase.from("messages" as any).update({ is_read: true }).in("id", unreadIds).then(() => {});
    }
  }, [messages, user]);

  const getSenderProfile = (senderId: string) => {
    if (senderId === user?.id) return null;
    return participantProfiles[senderId];
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || !messages) return [];
    const term = searchTerm.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(term));
  }, [searchTerm, messages]);

  // Typing users names
  const typingNames = useMemo(() => {
    return typingUsers
      .map((t: any) => participantProfiles[t.user_id]?.full_name || "Birisi")
      .join(", ");
  }, [typingUsers, participantProfiles]);

  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    const groups: { type: "date" | "messages"; date?: string; senderId?: string; messages?: Message[]; isMe?: boolean }[] = [];
    let lastDate = "";
    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
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
      setTyping(false);
      if (editingMsg) {
        await editMessage.mutateAsync({ messageId: editingMsg.id, content: content.trim(), conversationId });
        setEditingMsg(null);
      } else {
        // If only attachments, generate a descriptive content
        let messageContent = content.trim();
        if (!messageContent && attachments.length > 0) {
          const imageCount = attachments.filter(a => a.type === "image").length;
          const docCount = attachments.filter(a => a.type === "document").length;
          const otherCount = attachments.filter(a => a.type === "other").length;
          const parts: string[] = [];
          if (imageCount) parts.push(`📷 ${imageCount} fotoğraf`);
          if (docCount) parts.push(`📄 ${docCount} dosya`);
          if (otherCount) parts.push(`📎 ${otherCount} ek`);
          messageContent = parts.join(", ");
        }
        await sendMessage.mutateAsync({ conversationId, content: messageContent, replyToId: replyToMsg?.id, attachments });
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
    const maxSize = 10 * 1024 * 1024; // 10MB
    const newAttachments = Array.from(files).filter((file) => {
      if (file.size > maxSize) { toast.error(`${file.name} çok büyük (max 10MB)`); return false; }
      return true;
    }).map((file) => {
      let type: "image" | "document" | "other" = "other";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.includes("pdf") || file.type.includes("doc") || file.type.includes("xls")) type = "document";
      return { file, type };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const startEdit = (msg: Message) => { setEditingMsg(msg); setReplyToMsg(null); setContent(msg.content); inputRef.current?.focus(); };
  const startReply = (msg: Message) => { setReplyToMsg(msg); setEditingMsg(null); inputRef.current?.focus(); };
  const cancelEditReply = () => { setEditingMsg(null); setReplyToMsg(null); setContent(""); };

  const handleCopyMessage = (text: string) => { navigator.clipboard.writeText(text); toast.success("Mesaj kopyalandı"); };

  const handleBulkDelete = () => {
    selectedMessages.forEach((msgId) => {
      deleteMessage.mutate({ messageId: msgId, conversationId });
    });
    setSelectedMessages(new Set());
    setIsMultiSelect(false);
    toast.success(`${selectedMessages.size} mesaj silindi`);
  };

  const scrollToMessage = (msgId: string) => {
    setHighlightedMsgId(msgId);
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") cancelEditReply();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
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
    <TooltipProvider>
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
              {typingNames ? (
                <p className="text-[11px] text-primary animate-pulse">{typingNames} yazıyor...</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">{messages?.length || 0} mesaj</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isMultiSelect && selectedMessages.size > 0 && (
              <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={handleBulkDelete}>
                <Trash2 className="h-3 w-3" />
                {selectedMessages.size} Sil
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSearchOpen(!searchOpen); setSearchTerm(""); }}>
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mesajlarda Ara</TooltipContent>
            </Tooltip>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Context banner for orders/complaints */}
        {contextType && contextType !== "direct" && (
          <div className={cn(
            "px-4 py-2 border-b flex items-center gap-2 text-xs",
            contextType === "complaint" ? "bg-destructive/5 text-destructive" : "bg-primary/5 text-primary"
          )}>
            {contextType === "order" && <ShoppingBag className="h-3.5 w-3.5" />}
            {contextType === "complaint" && <AlertTriangle className="h-3.5 w-3.5" />}
            <span className="font-medium">
              {contextType === "order" ? `Sipariş #${contextId?.substring(0, 8)}` :
               contextType === "product_qa" ? "Ürün Sorusu" :
               contextType === "complaint" ? "Şikayet" : contextType}
            </span>
          </div>
        )}

        {/* Search bar */}
        {searchOpen && (
          <div className="px-3 py-2 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Mesajlarda ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-8 text-sm" autoFocus />
              {searchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{searchResults.length} sonuç</span>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1">
                {searchResults.map((msg) => (
                  <button key={msg.id} onClick={() => { scrollToMessage(msg.id); setSearchOpen(false); setSearchTerm(""); }}
                    className="w-full text-left p-1.5 rounded text-xs hover:bg-muted truncate text-muted-foreground">
                    <span className="text-foreground font-medium">
                      {participantProfiles[msg.sender_id]?.full_name || (msg.sender_id === user?.id ? "Sen" : "?")}
                    </span>: {msg.content}
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
                    <span className="text-[10px] bg-muted px-3 py-1 rounded-full text-muted-foreground">{group.date}</span>
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
                        <AvatarFallback className={cn(
                          "text-[10px] font-bold",
                          (profile as any)?.is_admin ? "bg-destructive/10 text-destructive" :
                          profile?.is_seller ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {(profile?.full_name?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className="text-[11px] font-semibold text-foreground/80">{profile?.full_name || "Bilinmeyen"}</span>
                        {(profile as any)?.is_admin && <RoleBadge icon={<Shield className="h-2.5 w-2.5" />} label="Admin" variant="destructive" />}
                        {profile?.is_seller && !(profile as any)?.is_admin && <RoleBadge icon={<Store className="h-2.5 w-2.5" />} label="Satıcı" variant="default" />}
                      </div>
                    )}

                    {group.messages!.map((msg, mi) => {
                      const isHighlighted = highlightedMsgId === msg.id;
                      const isSelected = selectedMessages.has(msg.id);

                      return (
                        <div
                          key={msg.id}
                          id={`msg-${msg.id}`}
                          onClick={isMultiSelect ? () => {
                            setSelectedMessages((prev) => {
                              const next = new Set(prev);
                              if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id);
                              return next;
                            });
                          } : undefined}
                          className={cn(
                            "group relative px-3 py-2 text-sm leading-relaxed transition-all duration-300",
                            isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                            getBubbleRadius(mi, group.messages!.length, isMe),
                            mi > 0 && "mt-0.5",
                            isHighlighted && "ring-2 ring-primary/50 scale-[1.02]",
                            isSelected && "ring-2 ring-accent",
                            isMultiSelect && "cursor-pointer"
                          )}
                        >
                          {/* Action buttons */}
                          {!isMultiSelect && (
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
                                onMultiSelect={() => {
                                  setIsMultiSelect(true);
                                  setSelectedMessages(new Set([msg.id]));
                                }}
                              />
                            </div>
                          )}

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

                          <span className="whitespace-pre-wrap break-words">{msg.content}</span>

                          {msg.is_edited && (
                            <span className={cn("text-[9px] ml-1", isMe ? "text-primary-foreground/50" : "text-muted-foreground/70")}>(düzenlendi)</span>
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
                            {isMe && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" /> : <Check className="h-3 w-3 text-primary-foreground/50" />)}
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
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Send className="h-7 w-7 opacity-30" />
                </div>
                <p className="font-medium">Henüz mesaj yok</p>
                <p className="text-xs mt-1">İlk mesajı göndererek sohbeti başlatın 👋</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Typing indicator */}
        {typingNames && (
          <div className="px-4 py-1 border-t bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-muted-foreground">{typingNames} yazıyor...</span>
            </div>
          </div>
        )}

        {/* Scroll to bottom */}
        {showScrollDown && (
          <div className="absolute bottom-28 right-8 z-20">
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-9 w-9" onClick={scrollToBottom}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Multi-select bar */}
        {isMultiSelect && (
          <div className="px-3 py-2 border-t bg-muted/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{selectedMessages.size} mesaj seçildi</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setIsMultiSelect(false); setSelectedMessages(new Set()); }}>
                İptal
              </Button>
              {selectedMessages.size > 0 && (
                <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={handleBulkDelete}>
                  <Trash2 className="h-3 w-3" /> Seçilenleri Sil
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Edit / Reply bar */}
        {(editingMsg || replyToMsg) && (
          <div className="px-3 py-2 border-t bg-muted/40 flex items-center gap-2">
            <div className="w-1 h-8 rounded-full bg-primary shrink-0" />
            <div className="flex-1 min-w-0">
              {editingMsg && (
                <div className="text-xs">
                  <span className="text-primary font-medium">Düzenleniyor</span>
                  <p className="truncate text-muted-foreground mt-0.5">{editingMsg.content}</p>
                </div>
              )}
              {replyToMsg && (
                <div className="text-xs">
                  <span className="text-primary font-medium">
                    {replyToMsg.sender_id === user?.id ? "Kendinize" : participantProfiles[replyToMsg.sender_id]?.full_name || "Bilinmeyen"}'e yanıt
                  </span>
                  <p className="truncate text-muted-foreground mt-0.5">{replyToMsg.content}</p>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={cancelEditReply}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Attachment preview before sending */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {attachments.map((item, i) => (
                <div key={i} className="relative group">
                  {item.type === "image" ? (
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted">
                      <img src={URL.createObjectURL(item.file)} alt={item.file.name} className="h-full w-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                        <span className="text-[9px] text-white truncate block">{item.file.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border bg-muted flex flex-col items-center justify-center gap-1 p-1">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">{item.file.name}</span>
                      <span className="text-[8px] text-muted-foreground/70">{(item.file.size / 1024).toFixed(0)} KB</span>
                    </div>
                  )}
                  <button onClick={() => removeAttachment(i)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">{attachments.length} dosya eklenecek</p>
          </div>
        )}

        {/* Input */}
        {!isMultiSelect && (
          <form onSubmit={handleSend} className="px-3 py-3 border-t flex items-end gap-2 bg-card">
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dosya Ekle</TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" side="top" align="start">
                  <div className="space-y-2">
                    {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                      <div key={category}>
                        <p className="text-[10px] text-muted-foreground font-medium mb-1">{category}</p>
                        <div className="grid grid-cols-6 gap-0.5">
                          {emojis.map((emoji) => (
                            <button key={emoji} type="button" onClick={() => insertEmoji(emoji)}
                              className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg transition-colors">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Textarea
              ref={inputRef}
              placeholder={editingMsg ? "Mesajı düzenle..." : "Mesajınızı yazın..."}
              value={content}
              onChange={(e) => { setContent(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[36px] max-h-[120px] resize-none py-2 text-sm"
              rows={1}
            />

            <Button
              type="submit" size="icon" className="h-9 w-9 shrink-0"
              disabled={sendMessage.isPending || editMessage.isPending || (!content.trim() && attachments.length === 0)}
            >
              {sendMessage.isPending || editMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mesajı sil</AlertDialogTitle>
              <AlertDialogDescription>Bu mesajı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { if (deleteConfirm) { deleteMessage.mutate({ messageId: deleteConfirm, conversationId }); setDeleteConfirm(null); } }}>
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
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
  msg, isMe, onEdit, onReply, onDelete, onCopy, onMultiSelect,
}: {
  msg: Message; isMe: boolean;
  onEdit: () => void; onReply: () => void; onDelete: () => void; onCopy: () => void; onMultiSelect: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-6 w-6 bg-card/80 shadow-sm border">
        <MoreVertical className="h-3 w-3" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={isMe ? "end" : "start"} className="w-40">
      <DropdownMenuItem onClick={onReply}>
        <Reply className="h-3.5 w-3.5 mr-2" /> Yanıtla
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onCopy}>
        <Copy className="h-3.5 w-3.5 mr-2" /> Kopyala
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onMultiSelect}>
        <CheckCheck className="h-3.5 w-3.5 mr-2" /> Çoklu Seç
      </DropdownMenuItem>
      {isMe && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Sil
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const ReplyPreview = ({
  replyToId, messages, profiles, userId, isMe, onScrollTo,
}: {
  replyToId: string; messages: Message[]; profiles: Record<string, any>;
  userId?: string; isMe: boolean; onScrollTo: (id: string) => void;
}) => {
  const replyMsg = messages.find((m) => m.id === replyToId);
  if (!replyMsg) return (
    <div className={cn("block w-full text-left mb-1.5 pl-2 border-l-2 text-[11px] rounded-sm italic",
      isMe ? "border-primary-foreground/30 text-primary-foreground/50" : "border-primary/30 text-muted-foreground/50"
    )}>
      Silinmiş mesaj
    </div>
  );

  const senderName = replyMsg.sender_id === userId ? "Sen" : profiles[replyMsg.sender_id]?.full_name || "Bilinmeyen";

  return (
    <button onClick={() => onScrollTo(replyToId)}
      className={cn("block w-full text-left mb-1.5 pl-2 border-l-2 text-[11px] rounded-sm hover:opacity-80 transition-opacity",
        isMe ? "border-primary-foreground/40 text-primary-foreground/70" : "border-primary/40 text-muted-foreground"
      )}>
      <span className="font-semibold">{senderName}</span>
      <p className="truncate">{replyMsg.content}</p>
    </button>
  );
};

const RoleBadge = ({ icon, label, variant }: { icon: React.ReactNode; label: string; variant: "destructive" | "default" }) => (
  <span className={cn(
    "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
    variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
  )}>
    {icon}{label}
  </span>
);

const AttachmentPreview = ({ attachment, isMe }: { attachment: any; isMe: boolean }) => {
  const url = useMemo(() => {
    const { data } = supabase.storage.from("chat_attachments").getPublicUrl(attachment.file_path);
    return data.publicUrl;
  }, [attachment.file_path]);

  const fileExt = attachment.file_name?.split(".").pop()?.toLowerCase() || "";
  const isImage = attachment.file_type === "image" || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExt);
  const isPdf = fileExt === "pdf";
  const isVideo = ["mp4", "mov", "webm", "avi"].includes(fileExt);

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-white/10 max-w-[280px]">
        <img
          src={url}
          alt={attachment.file_name}
          className="max-h-52 w-auto object-cover hover:opacity-90 transition-opacity"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className={cn("px-2 py-1 flex items-center gap-1.5", isMe ? "bg-primary-foreground/10" : "bg-muted/50")}>
          <ImageIcon className="h-3 w-3 shrink-0 opacity-60" />
          <span className="text-[10px] truncate flex-1">{attachment.file_name}</span>
          <span className="text-[9px] opacity-50">{(attachment.file_size / 1024).toFixed(0)} KB</span>
        </div>
      </a>
    );
  }

  if (isVideo) {
    return (
      <div className="rounded-lg overflow-hidden border border-white/10 max-w-[280px]">
        <video src={url} controls className="max-h-52 w-full" preload="metadata" />
        <div className={cn("px-2 py-1 flex items-center gap-1.5", isMe ? "bg-primary-foreground/10" : "bg-muted/50")}>
          <span className="text-[10px] truncate flex-1">{attachment.file_name}</span>
        </div>
      </div>
    );
  }

  // Document / other file types
  const iconColor = isPdf ? "text-red-500" : "text-blue-500";
  const bgColor = isPdf ? "bg-red-500/10" : "bg-blue-500/10";

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={cn("flex items-center gap-3 p-2.5 rounded-lg border hover:opacity-80 transition-opacity min-w-[200px]",
        isMe ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-background/50 border-border"
      )}>
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bgColor)}>
        <FileText className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-xs font-medium truncate">{attachment.file_name}</p>
        <p className="text-[10px] opacity-60">{fileExt.toUpperCase()} • {attachment.file_size >= 1024 * 1024 ? `${(attachment.file_size / (1024 * 1024)).toFixed(1)} MB` : `${(attachment.file_size / 1024).toFixed(1)} KB`}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 opacity-50" />
    </a>
  );
};

export default ChatWindow;
