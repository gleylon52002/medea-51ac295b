import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AIAction {
  id: string;
  type: string;
  label: string;
  description?: string;
  params?: Record<string, unknown>;
  dangerous?: boolean;
}

interface ActionButtonsProps {
  actions: AIAction[];
  onActionComplete?: (action: AIAction, result: unknown) => void;
}

const ActionButtons = ({ actions, onActionComplete }: ActionButtonsProps) => {
  const [executing, setExecuting] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  const executeAction = async (action: AIAction) => {
    setExecuting(action.id);
    
    try {
      const { data, error } = await supabase.functions.invoke("maintenance-ai", {
        body: {
          executeAction: true,
          actionType: action.type,
          actionParams: action.params || {},
        },
      });

      if (error) throw error;

      // Log the action
      await supabase.from("ai_action_logs").insert([{
        action_type: action.type,
        action_params: action.params || {},
        result: data,
        status: "success",
      }]);

      setCompleted([...completed, action.id]);
      toast.success(`"${action.label}" başarıyla uygulandı`);
      onActionComplete?.(action, data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
      setFailed([...failed, action.id]);
      toast.error(`Aksiyon başarısız: ${errorMessage}`);
      
      // Log the failure
      await supabase.from("ai_action_logs").insert([{
        action_type: action.type,
        action_params: action.params || {},
        status: "failed",
        error_message: errorMessage,
      }]);
    } finally {
      setExecuting(null);
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
      <p className="text-xs font-medium text-primary mb-2">🎯 Önerilen Aksiyonlar</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const isExecuting = executing === action.id;
          const isCompleted = completed.includes(action.id);
          const isFailed = failed.includes(action.id);

          return (
            <Button
              key={action.id}
              size="sm"
              variant={action.dangerous ? "destructive" : "secondary"}
              disabled={isExecuting || isCompleted}
              onClick={() => executeAction(action)}
              className={cn(
                "text-xs h-8",
                isCompleted && "bg-green-500/20 text-green-700 border-green-500/30",
                isFailed && "bg-red-500/20 text-red-700 border-red-500/30"
              )}
            >
              {isExecuting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : isFailed ? (
                <AlertCircle className="h-3 w-3 mr-1" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              {action.label}
            </Button>
          );
        })}
      </div>
      {actions.some(a => a.description) && (
        <div className="mt-2 space-y-1">
          {actions.filter(a => a.description).map((action) => (
            <p key={action.id} className="text-[10px] text-muted-foreground">
              <span className="font-medium">{action.label}:</span> {action.description}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionButtons;

// Helper to parse AI response for action markers
export const parseActionsFromResponse = (content: string): { cleanContent: string; actions: AIAction[] } => {
  const actions: AIAction[] = [];
  let cleanContent = content;

  // Parse action blocks: [ACTION:type:label:description?:params?]
  const actionRegex = /\[ACTION:([^:\]]+):([^\]]+?)(?::([^\]]*?))?(?::(\{.*?\}))?\]/g;
  let match;

  while ((match = actionRegex.exec(content)) !== null) {
    const [fullMatch, type, label, description, paramsStr] = match;
    let params = {};
    
    try {
      if (paramsStr) {
        params = JSON.parse(paramsStr);
      }
    } catch {
      // Invalid JSON, ignore params
    }

    actions.push({
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      description: description || undefined,
      params,
      dangerous: type.includes("delete") || type.includes("remove"),
    });

    cleanContent = cleanContent.replace(fullMatch, "");
  }

  return { cleanContent: cleanContent.trim(), actions };
};
