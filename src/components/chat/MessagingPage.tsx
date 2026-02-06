import { useState } from "react";
import { useConversations } from "@/hooks/useMessages";
import ChatWindow from "@/components/chat/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const MessagingPage = ({ role }: { role: 'admin' | 'seller' }) => {
    const { user } = useAuth();
    const { data: conversations, isLoading } = useConversations();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredConversations = conversations?.filter(c =>
        c.context_type.includes(searchTerm) ||
        c.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
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
