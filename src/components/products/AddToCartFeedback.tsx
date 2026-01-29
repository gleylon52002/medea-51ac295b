import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCartFeedbackProps {
  isAdding: boolean;
  onComplete?: () => void;
}

const AddToCartFeedback = ({ isAdding, onComplete }: AddToCartFeedbackProps) => {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  useEffect(() => {
    if (isAdding) {
      setState("adding");
    }
  }, [isAdding]);

  useEffect(() => {
    if (state === "adding") {
      const timer = setTimeout(() => {
        setState("added");
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
    if (state === "added") {
      const timer = setTimeout(() => {
        setState("idle");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, onComplete]);

  return (
    <div className="relative">
      {state === "idle" && (
        <span className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Sepete Ekle
        </span>
      )}
      {state === "adding" && (
        <span className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Ekleniyor...
        </span>
      )}
      {state === "added" && (
        <span className="flex items-center gap-2 text-green-600">
          <Check className="h-4 w-4" />
          Eklendi!
        </span>
      )}
    </div>
  );
};

export default AddToCartFeedback;
