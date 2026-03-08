import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, Trash2, Wrench, Sparkles, Cpu, Zap, Search, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import HealthMonitor from "@/components/admin/maintenance/HealthMonitor";
import ScheduledTasks from "@/components/admin/maintenance/ScheduledTasks";
import ActionButtons, { AIAction, parseActionsFromResponse } from "@/components/admin/maintenance/ActionButtons";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: AIAction[];
}

const quickActions = [
  { label: "Sistem Durumu", prompt: "Sistem durumunu analiz et ve bana detaylı rapor ver. Varsa aksiyonları öner.", icon: Cpu },
  { label: "Eksik Ayarlar", prompt: "Eksik veya yapılandırılmamış ayarları tespit et ve düzeltme önerileri sun", icon: Wrench },
  { label: "Düşük Stok Analizi", prompt: "Düşük stoklu ve stoksuz ürünleri analiz et. Gerekirse pasife alma aksiyonu öner.", icon: Zap },
  { label: "AI Sistemleri", prompt: "Tüm AI sistemlerinin durumunu kontrol et. Her birinin ne yaptığını, nasıl çalıştığını açıkla.", icon: Sparkles },
  { label: "SEO Analizi", prompt: "Site SEO durumunu analiz et. Meta etiketleri, eksik açıklamalar. Aksiyon butonları ile raporla.", icon: Bot },
  { label: "Trend Analizi", prompt: "Son haftalık satış trendlerini analiz et. Hangi ürünler popüler, hangileri düşüşte? Strateji öner.", icon: Search },
];

const AdminMaintenance = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: messageText, timestamp: new Date() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("maintenance-ai", {
        body: {
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const rawContent = data.content || "Yanıt alınamadı.";
      const { cleanContent, actions } = parseActionsFromResponse(rawContent);

      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: cleanContent, 
          timestamp: new Date(),
          actions: actions.length > 0 ? actions : undefined
        },
      ]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "AI servisi kullanılamıyor";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Hata: ${errorMessage}`, timestamp: new Date() },
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

  const clearChat = () => setMessages([]);

  const handleRunTask = (task: { action_type: string; title: string }) => {
    sendMessage(`"${task.title}" görevini çalıştır. Aksiyon tipi: ${task.action_type}`);
  };

  const handleActionComplete = () => {
    // Optionally refresh or add a system message
  };

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-56px)] lg:h-screen flex flex-col gap-4">
      {/* Health Monitor */}
      <HealthMonitor />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="chat" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Sohbet
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Wrench className="h-4 w-4" />
              Görevler
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "chat" && messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4 mr-1" />
              Temizle
            </Button>
          )}
        </div>

        <TabsContent value="tasks" className="flex-1 mt-0">
          <ScheduledTasks onRunTask={handleRunTask} />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0 min-h-0">
          <Card className="flex-1 flex flex-col overflow-hidden border-border">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">MEDEA Bakım AI</h2>
                    <p className="text-muted-foreground max-w-md text-sm">
                      Sistem durumunu izle, sorunları gider, toplu işlemler yap.
                      AI aksiyonları önerecek ve onayınla uygulayacak.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                          <action.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-xl px-4 py-3",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <>
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>pre]:bg-background/50 [&>pre]:rounded-lg [&>pre]:p-3">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.actions && (
                            <ActionButtons 
                              actions={msg.actions} 
                              onActionComplete={handleActionComplete}
                            />
                          )}
                        </>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <p className={cn(
                        "text-[10px] mt-1",
                        msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}>
                        {msg.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analiz ediliyor...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Komut verin: 'Stoksuz ürünleri pasife al', 'SEO raporu çıkar', 'Tüm fiyatları %10 artır'..."
                  className="min-h-[44px] max-h-[120px] resize-none text-sm"
                  rows={1}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 h-[44px] px-5"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Bakım AI sistem verilerine erişir ve aksiyonları uygular • Shift+Enter ile yeni satır
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMaintenance;
