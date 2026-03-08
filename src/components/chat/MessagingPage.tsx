import { useState, useEffect, useMemo } from "react";
import { useConversations, useGetOrCreateConversation, useDeleteConversation, Conversation } from "@/hooks/useMessages";
import ChatWindow from "@/components/chat/ChatWindow";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2, Search, Plus, Shield, Store, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useAllSellers } from "@/hooks/useAdminSellers";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MessagingPage = ({ role }: { role: "admin" | "seller" }) => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id");
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const { data: sellers } = useAllSellers();
  const getOrCreateConversation = useGetOrCreateConversation();
  const deleteConversation = useDeleteConversation();

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");
  const [isNewMsgOpen, setIsNewMsgOpen] = useState(false);
  const [deleteConvId, setDeleteConvId] = useState<string | null>(null);

  useEffect(() => {
    if (initialId) setSelectedId(initialId);
  }, [initialId]);

  // When a conversation is deleted, deselect it
  useEffect(() => {
    if (selectedId && conversations && !conversations.find((c) => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [conversations, selectedId]);

  const allParticipantIds = useMemo(() => {
    if (!conversations || !user) return [];
    const ids = new Set<string>();
    conversations.forEach((c) => c.participants.forEach((p) => { if (p !== user.id) ids.add(p); }));
    return Array.from(ids);
  }, [conversations, user]);

  const { data: profileMap } = useParticipantProfiles(allParticipantIds);

  const getOtherParticipant = (conv: Conversation) => {
    const otherId = conv.participants.find((p) => p !== user?.id);
    return otherId && profileMap ? profileMap[otherId] : null;
  };

  const getConversationTitle = (conv: Conversation) => {
    const other = getOtherParticipant(conv);
    if (other) return other.full_name || "Bilinmeyen";
    if (conv.context_type === "order") return `Sipariş #${conv.context_id?.substring(0, 8)}`;
    if (conv.context_type === "product_qa") return "Ürün Sorusu";
    if (conv.context_type === "complaint") return "Şikayet";
    return "Görüşme";
  };

  const filteredConversations = conversations?.filter((c) => {
    const title = getConversationTitle(c).toLowerCase();
    const msg = c.last_message?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return title.includes(term) || msg.includes(term);
  });

  const selectedConversation = conversations?.find((c) => c.id === selectedId);

  const handleStartConversation = async (participantId: string) => {
    try {
      const convId = await getOrCreateConversation.mutateAsync({ participantId, contextType: "direct" });
      setSelectedId(convId);
      setIsNewMsgOpen(false);
      toast.success("Görüşme başlatıldı");
    } catch (error: any) {
      toast.error("Görüşme başlatılamadı: " + (error.message || "Bilinmeyen hata"));
    }
  };

  const handleStartAdminChat = async () => {
    try {
      const { data: adminRoles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1);
      if (error) throw error;
      if (adminRoles?.length) {
        await handleStartConversation(adminRoles[0].user_id);
        toast.success("Destek ekibiyle görüşme başlatıldı");
      } else {
        toast.error("Ulaşılabilecek bir yetkili bulunamadı.");
      }
    } catch {
      toast.error("Destek görüşmesi başlatılamadı");
    }
  };

  const handleDeleteConversation = () => {
    if (deleteConvId) {
      deleteConversation.mutate(deleteConvId);
      if (selectedId === deleteConvId) setSelectedId(null);
      setDeleteConvId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Mesajlar
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" ? "Satıcılarla olan görüşmelerinizi yönetin" : "Admin ve müşterilerle iletişim kurun"}
          </p>
        </div>
        <Dialog open={isNewMsgOpen} onOpenChange={setIsNewMsgOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Mesaj
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Görüşme Başlat</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {role === "admin" ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Satıcı ara..." className="pl-9" value={sellerSearch} onChange={(e) => setSellerSearch(e.target.value)} />
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-1">
                      {sellers
                        ?.filter((s) => s.company_name.toLowerCase().includes(sellerSearch.toLowerCase()))
                        .map((seller) => (
                          <button
                            key={seller.id}
                            onClick={() => handleStartConversation(seller.user_id)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors"
                          >
                            <Avatar className="h-9 w-9">
                              {(seller as any).logo_url && <AvatarImage src={(seller as any).logo_url} />}
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <Store className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium text-sm">{seller.company_name}</span>
                              <p className="text-xs text-muted-foreground">{seller.city}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Destek ekibimizle iletişime geçmek için butona tıklayın.</p>
                  <Button className="w-full" disabled={getOrCreateConversation.isPending} onClick={handleStartAdminChat}>
                    {getOrCreateConversation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Admin'e Mesaj Gönder
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100%-80px)]">
        {/* Conversation List */}
        <Card className="lg:col-span-4 flex flex-col overflow-hidden border-border/50">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Konuşma veya kişi ara..." className="pl-9 h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/50">
              {!filteredConversations?.length ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Henüz görüşme bulunmuyor.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const convTitle = getConversationTitle(conv);
                  const hasUnread = (conv.unread_count ?? 0) > 0;

                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative w-full p-3 flex gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer",
                        selectedId === conv.id && "bg-primary/5 border-l-2 border-l-primary",
                        hasUnread && "bg-primary/[0.03]"
                      )}
                      onClick={() => setSelectedId(conv.id)}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-11 w-11">
                          {other?.avatar_url && <AvatarImage src={other.avatar_url} />}
                          <AvatarFallback
                            className={cn(
                              "text-sm font-bold",
                              (other as any)?.is_admin
                                ? "bg-destructive/10 text-destructive"
                                : other?.is_seller
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {convTitle[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {(other as any)?.is_admin && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                            <Shield className="h-2.5 w-2.5 text-destructive-foreground" />
                          </div>
                        )}
                        {other?.is_seller && !(other as any)?.is_admin && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <Store className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-sm truncate", hasUnread ? "font-bold" : "font-medium")}>
                            {convTitle}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(conv.last_message_at)}
                          </span>
                        </div>
                        <p className={cn("text-xs truncate mt-0.5", hasUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                          {conv.last_message || "Henüz mesaj yok"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {conv.context_type !== "direct" && (
                            <Badge variant="outline" className="text-[9px] px-1 h-4 font-normal">
                              {conv.context_type === "order" ? "Sipariş" : conv.context_type === "product_qa" ? "Ürün S&C" : conv.context_type === "complaint" ? "Şikayet" : conv.context_type}
                            </Badge>
                          )}
                          {hasUnread && (
                            <Badge className="h-5 min-w-5 px-1.5 text-[10px] rounded-full">{conv.unread_count}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Delete conversation button */}
                      <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteConvId(conv.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <div className="lg:col-span-8 overflow-hidden h-full relative">
          {selectedId ? (
            <ChatWindow
              conversationId={selectedId}
              title={selectedConversation ? getConversationTitle(selectedConversation) : "Görüşme"}
              participantProfiles={profileMap || {}}
            />
          ) : (
            <Card className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 p-12 text-center">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <MessageSquare className="h-10 w-10 opacity-40" />
              </div>
              <h3 className="text-lg font-medium">Mesaj Seçin</h3>
              <p className="text-sm max-w-[280px] mt-2">
                Sol taraftaki görüşmelerden birini seçerek mesajlaşmaya başlayabilirsiniz.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Delete conversation confirmation */}
      <AlertDialog open={!!deleteConvId} onOpenChange={() => setDeleteConvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Görüşmeyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu görüşme ve tüm mesajları kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteConversation}>
              Görüşmeyi Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default MessagingPage;
