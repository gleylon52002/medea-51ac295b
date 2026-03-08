import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIFillButtonProps {
  field: string;
  context: string;
  onResult: (value: string) => void;
  disabled?: boolean;
}

const AIFillButton = ({ field, context, onResult, disabled }: AIFillButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleFill = async () => {
    if (!context.trim()) {
      toast.error("Lütfen önce ürün adını ve/veya görsel ekleyin");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-ai-fill", {
        body: { field, context },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.content) {
        onResult(data.content);
        toast.success("AI ile dolduruldu");
      }
    } catch (e: any) {
      toast.error(e.message || "AI ile doldurulamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary hover:text-primary/80 shrink-0"
            onClick={handleFill}
            disabled={loading || disabled}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>AI ile doldur</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AIFillButton;
