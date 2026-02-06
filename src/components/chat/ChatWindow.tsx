import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Image as ImageIcon, X, Loader2, FileText, Download, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMessages, useSendMessage, Message } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ChatWindowProps {
    conversationId: string;
    title: string;
    onClose?: () => void;
}

const ChatWindow = ({ conversationId, title, onClose }: ChatWindowProps) => {
    const { user } = useAuth();
    const { data: messages, isLoading } = useMessages(conversationId);
    const sendMessage = useSendMessage();

    const [content, setContent] = useState("");
    const [attachments, setAttachments] = useState<{ file: File; type: 'image' | 'document' | 'other' }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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

        const newAttachments = Array.from(files).map(file => {
            let type: 'image' | 'document' | 'other' = 'other';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.includes('pdf') || file.type.includes('doc')) type = 'document';

            return { file, type };
        });

        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className="flex h-[500px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-card shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {title[0].toUpperCase()}
                    </div>
                    <h3 className="font-semibold">{title}</h3>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages?.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[80%]",
                                msg.sender_id === user?.id ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "p-3 rounded-2xl text-sm",
                                    msg.sender_id === user?.id
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted text-muted-foreground rounded-tl-none"
                                )}
                            >
                                {msg.content}

                                {/* Attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {msg.attachments.map((att) => (
                                            <AttachmentPreview key={att.id} attachment={att} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Attachment area */}
            {attachments.length > 0 && (
                <div className="p-2 border-t bg-muted/50 flex flex-wrap gap-2">
                    {attachments.map((item, i) => (
                        <div key={i} className="relative bg-card p-2 rounded border flex items-center gap-2 pr-8">
                            {item.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
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
            <form onSubmit={handleSend} className="p-4 border-t flex items-center gap-2">
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
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                    placeholder="Mesajınızı yazın..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={sendMessage.isPending || (!content.trim() && attachments.length === 0)}>
                    {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    );
};

const AttachmentPreview = ({ attachment }: { attachment: any }) => {
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

    if (attachment.file_type === 'image') {
        return (
            <a href={url || "#"} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border">
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
            className="flex items-center gap-2 p-2 bg-background/10 rounded border hover:bg-background/20 transition-colors"
        >
            <FileText className="h-4 w-4" />
            <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium truncate">{attachment.file_name}</p>
                <p className="text-[10px] opacity-70">{(attachment.file_size / 1024).toFixed(1)} KB</p>
            </div>
            <Download className="h-3 w-3" />
        </a>
    );
};

export default ChatWindow;
