import { useEffect } from "react";
import { useAITranslation, productKey } from "@/hooks/useTranslation";

interface UseProductTranslationProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    short_description?: string | null;
    ingredients?: string | null;
    usage_instructions?: string | null;
  } | null | undefined;
}

export const useProductTranslation = ({ product }: UseProductTranslationProps) => {
  const { t, preloadTranslations, isSourceLang, isTranslating } = useAITranslation();

  useEffect(() => {
    if (!product || isSourceLang) return;

    const texts = [
      { key: productKey(product.id, "name"), text: product.name },
      product.description && { key: productKey(product.id, "description"), text: product.description },
      product.short_description && { key: productKey(product.id, "short_description"), text: product.short_description },
      product.ingredients && { key: productKey(product.id, "ingredients"), text: product.ingredients },
      product.usage_instructions && { key: productKey(product.id, "usage"), text: product.usage_instructions },
    ].filter(Boolean) as { key: string; text: string }[];

    preloadTranslations(texts);
  }, [product?.id, isSourceLang]);

  if (!product) return { name: "", description: "", shortDescription: "", ingredients: "", usage: "", isTranslating };

  return {
    name: t(productKey(product.id, "name"), product.name),
    description: t(productKey(product.id, "description"), product.description || ""),
    shortDescription: t(productKey(product.id, "short_description"), product.short_description || ""),
    ingredients: t(productKey(product.id, "ingredients"), product.ingredients || ""),
    usage: t(productKey(product.id, "usage"), product.usage_instructions || ""),
    isTranslating,
  };
};
