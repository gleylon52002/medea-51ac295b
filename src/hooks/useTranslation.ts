import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface TranslationRequest {
  key: string;
  text: string;
}

// Global cache to avoid re-fetching across components
const translationCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<void>>();

export const useAITranslation = () => {
  const { i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const currentLang = i18n.language;
  const batchQueue = useRef<TranslationRequest[]>([]);
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceUpdate] = useState(0);

  const getCacheKey = useCallback((key: string, lang: string) => `${lang}:${key}`, []);

  // Batch translate function
  const processBatch = useCallback(async () => {
    const batch = [...batchQueue.current];
    batchQueue.current = [];
    
    if (batch.length === 0 || currentLang === "tr") return;

    // Filter out already cached
    const uncached = batch.filter(t => !translationCache.has(getCacheKey(t.key, currentLang)));
    if (uncached.length === 0) return;

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { texts: uncached, target_lang: currentLang },
      });

      if (!error && data?.translations) {
        Object.entries(data.translations).forEach(([key, translated]) => {
          translationCache.set(getCacheKey(key, currentLang), translated as string);
        });
        forceUpdate(n => n + 1);
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setIsTranslating(false);
    }
  }, [currentLang, getCacheKey]);

  // Add to batch queue
  const queueTranslation = useCallback((key: string, text: string) => {
    if (currentLang === "tr") return text;
    
    const cacheKey = getCacheKey(key, currentLang);
    if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

    // Add to batch
    if (!batchQueue.current.some(t => t.key === key)) {
      batchQueue.current.push({ key, text });
    }

    // Debounce batch processing
    if (batchTimer.current) clearTimeout(batchTimer.current);
    batchTimer.current = setTimeout(processBatch, 150);

    return text; // Return original until translation arrives
  }, [currentLang, getCacheKey, processBatch]);

  // Translate a single text immediately (for critical content)
  const translateNow = useCallback(async (key: string, text: string): Promise<string> => {
    if (currentLang === "tr") return text;

    const cacheKey = getCacheKey(key, currentLang);
    if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

    // Check if already pending
    if (pendingRequests.has(cacheKey)) {
      await pendingRequests.get(cacheKey);
      return translationCache.get(cacheKey) || text;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("translate", {
          body: { texts: [{ key, text }], target_lang: currentLang },
        });
        if (!error && data?.translations?.[key]) {
          translationCache.set(cacheKey, data.translations[key]);
        }
      } catch (err) {
        console.error("Translation error:", err);
      } finally {
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, promise);
    await promise;
    return translationCache.get(cacheKey) || text;
  }, [currentLang, getCacheKey]);

  // Preload translations for a page
  const preloadTranslations = useCallback(async (texts: TranslationRequest[]) => {
    if (currentLang === "tr" || texts.length === 0) return;

    const uncached = texts.filter(t => !translationCache.has(getCacheKey(t.key, currentLang)));
    if (uncached.length === 0) return;

    setIsTranslating(true);
    try {
      // First check DB cache
      const keys = uncached.map(t => t.key);
      const { data: dbCached } = await supabase
        .from("translations")
        .select("content_key, translated_text")
        .eq("target_lang", currentLang)
        .in("content_key", keys);

      if (dbCached) {
        dbCached.forEach(row => {
          translationCache.set(getCacheKey(row.content_key, currentLang), row.translated_text);
        });
      }

      // Translate remaining
      const stillUncached = uncached.filter(t => !translationCache.has(getCacheKey(t.key, currentLang)));
      if (stillUncached.length > 0) {
        const { data, error } = await supabase.functions.invoke("translate", {
          body: { texts: stillUncached, target_lang: currentLang },
        });
        if (!error && data?.translations) {
          Object.entries(data.translations).forEach(([key, translated]) => {
            translationCache.set(getCacheKey(key, currentLang), translated as string);
          });
        }
      }
      forceUpdate(n => n + 1);
    } catch (err) {
      console.error("Preload translation error:", err);
    } finally {
      setIsTranslating(false);
    }
  }, [currentLang, getCacheKey]);

  // Get cached translation (sync, returns original if not yet translated)
  const t = useCallback((key: string, fallback: string): string => {
    if (currentLang === "tr") return fallback;
    const cacheKey = getCacheKey(key, currentLang);
    return translationCache.get(cacheKey) || fallback;
  }, [currentLang, getCacheKey]);

  // Clear cache on language change
  useEffect(() => {
    forceUpdate(n => n + 1);
  }, [currentLang]);

  return {
    t,
    translateNow,
    queueTranslation,
    preloadTranslations,
    isTranslating,
    currentLang,
    isSourceLang: currentLang === "tr",
  };
};

// Helper to generate a stable key for product content
export const productKey = (productId: string, field: string) => `product:${productId}:${field}`;
export const categoryKey = (categoryId: string, field: string) => `category:${categoryId}:${field}`;
export const pageKey = (page: string, field: string) => `page:${page}:${field}`;
