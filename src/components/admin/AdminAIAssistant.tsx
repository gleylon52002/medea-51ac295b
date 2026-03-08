import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const pageContextMap: Record<string, string> = {
  "/admin": "Admin Dashboard - Genel istatistikler, son siparişler ve düşük stoklu ürünler gösterilir.",
  "/admin/urunler": "Ürün Yönetimi - Ürün ekleme, düzenleme, silme, görseller, varyantlar, SEO ayarları yapılır.",
  "/admin/kategoriler": "Kategori Yönetimi - Ürün kategorileri oluşturulur ve düzenlenir.",
  "/admin/siparisler": "Sipariş Yönetimi - Siparişler görüntülenir, durumları güncellenir, kargo bilgileri girilir.",
  "/admin/kullanicilar": "Kullanıcı Yönetimi - Kayıtlı kullanıcılar listelenir ve yönetilir.",
  "/admin/kuponlar": "Kupon Yönetimi - İndirim kuponları oluşturulur ve düzenlenir.",
  "/admin/kampanyalar": "Kampanya Yönetimi - Kampanyalar oluşturulur, banner ve indirimler ayarlanır.",
  "/admin/seo": "SEO Yönetimi - Meta etiketleri, sitemap, robots.txt ayarları yapılır.",
  "/admin/ayarlar": "Site Ayarları - Genel, iletişim, kargo ve hukuki ayarlar yapılır.",
  "/admin/blog": "Blog Yönetimi - Blog yazıları oluşturulur ve düzenlenir.",
  "/admin/yorumlar": "Yorum Yönetimi - Ürün yorumları onaylanır veya reddedilir.",
  "/admin/mesajlar": "Mesaj Yönetimi - İletişim formu mesajları görüntülenir.",
  "/admin/tema": "Tema Yönetimi - Site renkleri ve görünümü özelleştirilir.",
  "/admin/hero": "Hero Yönetimi - Ana sayfa hero bölümü düzenlenir.",
  "/admin/sss": "SSS Yönetimi - Sıkça Sorulan Sorular oluşturulur ve düzenlenir.",
  "/admin/newsletter": "Bülten Yönetimi - Newsletter aboneleri yönetilir.",
  "/admin/kargo": "Kargo Ayarları - Kargo şirketleri ve ücretleri ayarlanır.",
  "/admin/odeme": "Ödeme Ayarları - Ödeme yöntemleri yapılandırılır.",
  "/admin/sosyal-medya": "Sosyal Medya - Instagram paylaşımları ve sosyal medya entegrasyonları.",
  "/admin/saticilar": "Satıcı Yönetimi - Pazaryeri satıcıları yönetilir.",
  "/admin/spin-wheel": "Çark Yönetimi - Şans çarkı ödülleri ve ayarları yapılır.",
  "/admin/push-bildirimler": "Push Bildirimler - Mobil bildirimler gönderilir.",
  "/admin/rss": "RSS Feed - Ürün RSS beslemesi ayarları.",
  "/admin/faturalar": "Fatura Yönetimi - Siparişlere ait faturalar oluşturulur.",
};

const AdminAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const currentPageContext = Object.entries(pageContextMap).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + "/")
  )?.[1] || "Admin paneli sayfası";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset on page change
  useEffect(() => {
    setMessages([]);
  }, [location.pathname]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-ai-assistant", {
        body: {
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          pageContext: currentPageContext,
          currentPath: location.pathname,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content || "Yanıt alınamadı." },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Hata: ${e.message || "AI servisi kullanılamıyor"}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium text-sm">MEDEA AI</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">MEDEA AI Asistan</p>
                <p className="text-xs opacity-80">{currentPageContext.split(" - ")[0]}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <Bot className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm text-foreground">Merhaba! Ben MEDEA AI 👋</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bu sayfada size yardımcı olabilirim. İçerik oluşturma, SEO önerileri veya herhangi bir konuda soru sorabilirsiniz.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    "Bu sayfada ne yapabilirim?",
                    "İçerik önerileri ver",
                    "SEO ipuçları paylaş",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => sendMessage(), 0);
                        setInput(q);
                      }}
                      className="text-xs text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-3 py-2 rounded-xl text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-xl rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Bir şey sorun..."
                className="min-h-[38px] max-h-[80px] resize-none text-sm"
                rows={1}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="shrink-0 h-[38px] w-[38px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminAIAssistant;
