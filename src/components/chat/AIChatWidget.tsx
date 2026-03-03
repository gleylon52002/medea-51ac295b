import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };
type ChatMode = "skin_consultant" | "faq";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-consultant`;

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen, mode]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !mode) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, mode }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Bağlantı hatası");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message || "Bir hata oluştu. Lütfen tekrar deneyin."}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectMode = (m: ChatMode) => {
    setMode(m);
    setMessages([{
      role: "assistant",
      content: m === "skin_consultant"
        ? "Merhaba! 👋 Ben Medea'nın cilt bakım danışmanıyım. Cilt tipiniz, sorunlarınız veya aradığınız ürün hakkında bilgi verin, size en uygun doğal bakım ürünlerini önereyim!"
        : "Merhaba! 👋 Size nasıl yardımcı olabilirim? Siparişleriniz, ürünlerimiz veya mağazamız hakkında sorularınızı yanıtlayabilirim."
    }]);
  };

  const resetChat = () => {
    setMode(null);
    setMessages([]);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
          aria-label="AI Asistan"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border bg-background shadow-2xl" style={{ height: "min(520px, calc(100vh - 2rem))" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-primary/5 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">
                {mode === "skin_consultant" ? "Cilt Danışmanı" : mode === "faq" ? "Yardım Asistanı" : "Medea AI"}
              </span>
            </div>
            <div className="flex gap-1">
              {mode && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetChat}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mode Selection */}
          {!mode && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
              <Bot className="h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">Nasıl yardımcı olabilirim?</h3>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => selectMode("skin_consultant")}
                  className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-primary/5 transition-colors"
                >
                  <Sparkles className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">AI Cilt Danışmanı</p>
                    <p className="text-xs text-muted-foreground">Cilt tipinize göre ürün önerileri alın</p>
                  </div>
                </button>
                <button
                  onClick={() => selectMode("faq")}
                  className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-primary/5 transition-colors"
                >
                  <HelpCircle className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Yardım & SSS</p>
                    <p className="text-xs text-muted-foreground">Sipariş, kargo ve mağaza hakkında sorular</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {mode && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0 [&_a]:text-primary [&_a]:underline">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-2xl px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={mode === "skin_consultant" ? "Cilt sorunumu anlat..." : "Sorunuzu yazın..."}
                    className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 rounded-xl shrink-0" disabled={!input.trim() || isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
