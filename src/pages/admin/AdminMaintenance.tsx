import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Bot, Trash2, Wrench, Sparkles, Cpu, Zap, Search, FolderOpen, X, Paperclip, Menu } from "lucide-react";
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
import FileManager from "@/components/admin/maintenance/FileManager";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: AIAction[];
  filePreview?: string;
  fileName?: string;
}

const quickActions = [
  { label: "Sistem Durumu", prompt: "Sistem durumunu analiz et ve bana detaylı rapor ver. Varsa aksiyonları öner.", icon: Cpu },
  { label: "Eksik Ayarlar", prompt: "Eksik veya yapılandırılmamış ayarları tespit et ve düzeltme önerileri sun.", icon: Wrench },
  { label: "Düşük Stok Analizi", prompt: "Düşük stoklu ve stoksuz ürünleri analiz et. Gerekirse pasife alma aksiyonu öner.", icon: Zap },
  { label: "Mesajları Yönet", prompt: "Okunmamış iletişim mesajlarını göster. Her biri için uygun yanıt öner ve yanıtlama aksiyonu sun.", icon: Sparkles },
  { label: "SEO Analizi", prompt: "Site SEO durumunu analiz et. Meta etiketleri, eksik açıklamalar. Aksiyon butonları ile raporla.", icon: Search },
  { label: "Ürün Oluştur", prompt: "Yeni bir ürün oluşturmam için bana yardımcı ol. Kategori listesini göster ve ürün oluşturma aksiyonu sun.", icon: Bot },
  { label: "Sipariş Özeti", prompt: "Bugünkü ve bekleyen siparişleri özetle. Kargoya verilmemiş olanları listele ve toplu onay aksiyonu sun.", icon: Cpu },
  { label: "Kampanya Oluştur", prompt: "Yeni bir kampanya oluşturmam için yardımcı ol. Mevcut kampanyaları listele ve yeni kampanya aksiyonu sun.", icon: Zap },
  { label: "Kupon Oluştur", prompt: "Yeni bir indirim kuponu oluştur. Kupon tipi, değer ve süre bilgilerini sor.", icon: Sparkles },
  { label: "Blog Yazısı Oluştur", prompt: "SEO uyumlu bir blog yazısı oluştur. Konu öner veya benim vereceğim konuda yaz.", icon: Bot },
  { label: "SSS Üret", prompt: "Ürünlere ve siteye uygun sık sorulan sorular üret ve kaydet.", icon: Wrench },
  { label: "Yorum Yönetimi", prompt: "Bekleyen ve onaylanmamış ürün yorumlarını listele. Toplu onay veya red aksiyonu sun.", icon: Sparkles },
  { label: "Satıcı Başvuruları", prompt: "Bekleyen satıcı başvurularını listele ve her biri için onay/red aksiyonu sun.", icon: Search },
  { label: "Günlük Rapor", prompt: "Bugünün satış, sipariş, yeni üye ve gelir raporunu detaylı oluştur.", icon: Cpu },
  { label: "Toplu Fiyat Güncelle", prompt: "Kategoriye veya ürün grubuna göre toplu fiyat güncelleme yap. Yüzde veya sabit tutar seçeneği sun.", icon: Zap },
  { label: "Kargo Takibi", prompt: "Kargoya verilmiş ama teslim edilmemiş siparişleri listele. Takip numarası eksik olanları göster.", icon: Wrench },
  { label: "Bülten Gönder", prompt: "Newsletter abonelerine kampanya veya bilgilendirme e-postası hazırla ve gönderim aksiyonu sun.", icon: Sparkles },
  { label: "Tema Ayarları", prompt: "Mevcut tema ve görünüm ayarlarını göster. Değişiklik önerileri sun.", icon: Bot },
];

const AdminMaintenance = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isImageFile = (file: File) => file.type.startsWith("image/");

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Dosya boyutu 20MB'dan küçük olmalı");
      return;
    }

    setSelectedFile(file);
    if (isImageFile(file)) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const typeMap: Record<string, string> = {
      pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
      csv: "📊", txt: "📃", json: "🔧", xml: "🔧", html: "🌐",
      css: "🎨", js: "⚡", ts: "⚡", zip: "📦", rar: "📦",
      mp3: "🎵", mp4: "🎬", svg: "🖼️", psd: "🎨", ai: "🎨",
    };
    if (isImageFile(file)) return "🖼️";
    return typeMap[ext] || "📎";
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if ((!messageText.trim() && !selectedFile) || isLoading) return;

    const currentFile = selectedFile;
    const currentFilePreview = filePreview;

    const userMsg: Message = { 
      role: "user", 
      content: messageText || (currentFile ? `📎 ${currentFile.name}` : ""),
      timestamp: new Date(),
      filePreview: currentFilePreview || undefined,
      fileName: currentFile?.name,
    };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    removeFile();

    try {
      let data: any;
      let error: any;

      if (currentFile) {
        const base64 = await fileToBase64(currentFile);
        const isImage = isImageFile(currentFile);
        
        const result = await supabase.functions.invoke("maintenance-ai", {
          body: {
            ...(isImage ? { imageBase64: base64 } : { fileBase64: base64, fileName: currentFile.name, fileType: currentFile.type }),
            imageContext: messageText || (isImage 
              ? "Bu görseli analiz et. Ürün görseli ise ürün oluşturma öner."
              : `Bu dosyayı analiz et: ${currentFile.name}`),
          },
        });
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase.functions.invoke("maintenance-ai", {
          body: {
            messages: allMessages
              .filter(m => !m.filePreview || m.role === "user")
              .map((m) => ({ role: m.role, content: m.content })),
          },
        });
        data = result.data;
        error = result.error;
      }

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

  const handleActionComplete = () => {};

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Dosya boyutu 20MB'dan küçük olmalı");
        return;
      }
      setSelectedFile(file);
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (ev) => setFilePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-56px)] lg:h-screen flex flex-col gap-4">
      <HealthMonitor />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="chat" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Komuta Merkezi
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Wrench className="h-4 w-4" />
              Görevler
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Dosyalar
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

        <TabsContent value="files" className="flex-1 mt-0 min-h-0">
          <FileManager />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0 min-h-0">
          <Card 
            className="flex-1 flex flex-col overflow-hidden border-border"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Header with hamburger menu */}
            <div className="flex items-center gap-3 p-3 border-b border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Menu className="h-4 w-4" />
                    Hızlı Komutlar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 max-h-[400px] overflow-y-auto">
                  {quickActions.map((action) => (
                    <DropdownMenuItem 
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="gap-2 cursor-pointer"
                    >
                      <action.icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {messages.length} mesaj
              </span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">MEDEA AI Komuta Merkezi</h2>
                    <p className="text-muted-foreground max-w-lg text-sm">
                      Sol üstteki menüden hazır komutları kullanın veya aşağıya yazın.
                    </p>
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
                      {/* File preview in message */}
                      {msg.filePreview && (
                        <img 
                          src={msg.filePreview} 
                          alt="Yüklenen görsel" 
                          className="rounded-lg mb-2 max-h-48 object-cover"
                        />
                      )}
                      {msg.fileName && !msg.filePreview && (
                        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-background/20 border border-border/30">
                          <Paperclip className="h-4 w-4 shrink-0" />
                          <span className="text-xs truncate">{msg.fileName}</span>
                        </div>
                      )}
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

            {/* File Preview */}
            {selectedFile && (
              <div className="px-4 pt-2 border-t border-border">
                <div className="relative inline-flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
                  {filePreview ? (
                    <img src={filePreview} alt="Seçilen görsel" className="h-16 rounded-lg" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getFileIcon(selectedFile)}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-3 max-w-4xl mx-auto items-start">
                {/* Hamburger menu for quick actions (visible when chat has messages) */}
                {messages.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0 h-[44px] w-[44px]" title="Hızlı komutlar">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {quickActions.map((action) => (
                        <DropdownMenuItem 
                          key={action.label}
                          onClick={() => sendMessage(action.prompt)}
                          className="gap-2"
                        >
                          <action.icon className="h-4 w-4 text-primary" />
                          <span>{action.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 h-[44px] w-[44px]"
                  title="Dosya yükle"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Komut ver: 'Ürün oluştur', 'Mesajlara yanıt ver', 'Dosyayı analiz et'..."
                  className="min-h-[44px] max-h-[120px] resize-none text-sm"
                  rows={1}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={(!input.trim() && !selectedFile) || isLoading}
                  className="shrink-0 h-[44px] px-5"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                🔓 Tam yetkili AI • Tüm dosya türleri • Sürükle-bırak destekli
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMaintenance;
