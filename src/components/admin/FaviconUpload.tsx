import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FaviconUploadProps {
  currentFavicon: string | null;
  onFaviconChange: (url: string | null) => void;
}

const FaviconUpload = ({ currentFavicon, onFaviconChange }: FaviconUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin");
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error("Favicon dosyası 1MB'den küçük olmalıdır");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `favicon/favicon-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      onFaviconChange(urlData.publicUrl);
      toast.success("Favicon yüklendi");
    } catch (err) {
      toast.error("Favicon yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {currentFavicon ? (
          <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <img src={currentFavicon} alt="Favicon" className="w-8 h-8 object-contain" />
            <button
              onClick={() => onFaviconChange(null)}
              className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        <div>
          <label className="cursor-pointer">
            <input type="file" accept="image/png,image/ico,image/x-icon,image/svg+xml" onChange={handleUpload} className="hidden" />
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Yükleniyor..." : "Favicon Yükle"}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-1">PNG, ICO veya SVG • Maks 1MB • 32×32px önerilir</p>
        </div>
      </div>
    </div>
  );
};

export default FaviconUpload;
