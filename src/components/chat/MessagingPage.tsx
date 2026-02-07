import { useState } from "react";
import { useConversations, useGetOrCreateConversation } from "@/hooks/useMessages";
import ChatWindow from "@/components/chat/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2, Search, Plus, User } from "lucide-react";
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
import { useAllSellers } from "@/hooks/useAdminSellers";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MessagingPage = ({ role }: { role: 'admin' | 'seller' }) => {
    const [searchParams] = useSearchParams();
    const initialId = searchParams.get('id');
    const { user } = useAuth();
    const { data: conversations, isLoading } = useConversations();
    const { data: sellers } = useAllSellers();
    const getOrCreateConversation = useGetOrCreateConversation();

    const [selectedId, setSelectedId] = useState<string | null>(initialId);
    const [searchTerm, setSearchTerm] = useState("");
    const [sellerSearch, setSellerSearch] = useState("");
    const [isNewMsgOpen, setIsNewMsgOpen] = useState(false);

    useEffect(() => {
        if (initialId) {
            setSelectedId(initialId);
        }
    }, [initialId]);

    const filteredConversations = conversations?.filter(c =>
        c.context_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.last_message?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false)
    );

    const selectedConversation = conversations?.find(c => c.id === selectedId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 h-[calc(100vh-100px)]">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    Mesajlar
                </h1>
                <p className="text-muted-foreground">
                    {role === 'admin' ? 'Satıcılarla olan görüşmelerinizi yönetin' : 'Admin ve müşterilerle iletişim kurun'}
                </p>
            </div>

            <div className="flex gap-4 mb-4">
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
                            {role === 'admin' ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Satıcı ara..."
                                            className="pl-9"
                                            value={sellerSearch}
                                            onChange={(e) => setSellerSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto space-y-1 pt-2">
                                        {sellers?.filter(s => s.company_name.toLowerCase().includes(sellerSearch.toLowerCase())).map(seller => (
                                            <button
                                                key={seller.id}
                                                onClick={async () => {
                                                    try {
                                                        const convId = await getOrCreateConversation.mutateAsync({
                                                            participantId: seller.user_id,
                                                            contextType: 'direct'
                                                        });
                                                        setSelectedId(convId);
                                                        setIsNewMsgOpen(false);
                                                        toast.success("Görüşme başlatıldı");
                                                    } catch (error: any) {
                                                        console.error("Conversation error:", error);
                                                        toast.error("Görüşme başlatılamadı: " + (error.message || "Bilinmeyen hata"));
                                                    }
                                                }}
                                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors"
                                            >
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium">{seller.company_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-center">
                                    <p className="text-sm text-muted-foreground">Destek ekibimizle iletişime geçmek için butona tıklayın.</p>
                                    <Button
                                        className="w-full"
                                        disabled={getOrCreateConversation.isPending}
                                        onClick={async () => {
                                            try {
                                                const { data: adminRoles, error: adminError } = await supabase
                                                    .from('user_roles')
                                                    .select('user_id')
                                                    .eq('role', 'admin')
                                                    .limit(1);

                                                if (adminError) throw adminError;

                                                if (adminRoles && adminRoles.length > 0) {
                                                    const convId = await getOrCreateConversation.mutateAsync({
                                                        participantId: adminRoles[0].user_id,
                                                        contextType: 'direct'
                                                    });
                                                    setSelectedId(convId);
                                                    setIsNewMsgOpen(false);
                                                    toast.success("Destek ekibiyle görüşme başlatıldı");
                                                } else {
                                                    toast.error("Şu an ulaşılabilecek bir yetkili bulunamadı.");
                                                }
                                            } catch (error: any) {
                                                console.error("Support chat error:", error);
                                                toast.error("Destek görüşmesi başlatılamadı: " + (error.message || "Bilinmeyen hata"));
                                            }
                                        }}
                                    >
                                        {getOrCreateConversation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : null}
                                        Admin'e Mesaj Gönder
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Conversation List */}
                <Card className="lg:col-span-4 flex flex-col overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Konuşma ara..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="divide-y">
                            {filteredConversations?.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Henüz görüşme bulunmuyor.
                                </div>
                            ) : (
                                filteredConversations?.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedId(conv.id)}
                                        className={cn(
                                            "w-full p-4 flex gap-3 text-left hover:bg-muted/50 transition-colors",
                                            selectedId === conv.id && "bg-muted"
                                        )}
                                    >
                                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {conv.context_type[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-sm capitalize">
                                                    {conv.context_type === 'direct' ? 'Genel Mesaj' :
                                                        conv.context_type === 'order' ? `Sipariş #${conv.context_id?.substring(0, 8)}` :
                                                            conv.context_type === 'product_qa' ? 'Ürün Sorusu' : 'Şikayet'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {new Date(conv.last_message_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {conv.last_message || "Henüz mesaj yok"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] px-1 h-4">
                                                    {conv.context_type}
                                                </Badge>
                                                {conv.unread_count && conv.unread_count > 0 && (
                                                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                                                        {conv.unread_count} yeni
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Chat Window */}
                <Card className="lg:col-span-8 overflow-hidden h-full">
                    {selectedId ? (
                        <ChatWindow
                            conversationId={selectedId}
                            title={
                                selectedConversation?.context_type === 'order'
                                    ? `Sipariş Mesajlaşması`
                                    : selectedConversation?.context_type === 'product_qa'
                                        ? 'Ürün Sorusu'
                                        : 'Görüşme'
                            }
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 p-12 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium">Mesaj Seçin</h3>
                            <p className="text-sm max-w-[250px] mt-2">
                                Görünümdeki görüşmelerden birini seçerek mesajlaşmaya başlayabilirsiniz.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default MessagingPage;
