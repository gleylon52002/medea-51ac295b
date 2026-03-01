import { useState, useCallback } from "react";
import { Upload, X, Loader2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  bucket: "product-images" | "category-images" | "site-assets";
  maxImages?: number;
  className?: string;
}

const ImageUpload = ({
  images,
  onImagesChange,
  bucket,
  maxImages = 5,
  className,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const validFiles = Array.from(files).filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} geçerli bir görsel değil`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} 5MB'dan büyük`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        toast.error(`En fazla ${maxImages} görsel yükleyebilirsiniz`);
        return;
      }

      const filesToUpload = validFiles.slice(0, remainingSlots);

      setIsUploading(true);
      try {
        const uploadPromises = filesToUpload.map((file) => uploadFile(file));
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter((url): url is string => url !== null);

        if (successfulUploads.length > 0) {
          onImagesChange([...images, ...successfulUploads]);
          toast.success(`${successfulUploads.length} görsel yüklendi`);
        }

        if (successfulUploads.length < filesToUpload.length) {
          toast.error("Bazı görseller yüklenemedi");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Görsel yüklenirken hata oluştu");
      } finally {
        setIsUploading(false);
      }
    },
    [images, maxImages, bucket, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Try to delete from storage
    try {
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from(bucket).remove([fileName]);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleImageDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newImages = [...images];
    const [movedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, movedImage);
    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          id="image-upload"
          disabled={isUploading}
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-sm">
                {isUploading ? "Yükleniyor..." : "Görselleri sürükleyin veya tıklayın"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP (max 5MB) - {images.length}/{maxImages}
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleImageDrop(index)}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-move",
                draggedIndex === index && "opacity-50",
                index === 0 && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <img
                src={url}
                alt={`Görsel ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              
              {/* Drag Handle */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                  Ana Görsel
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
