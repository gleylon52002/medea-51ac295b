import { useEffect, useState } from "react";
import { useAITranslation } from "@/hooks/useTranslation";

interface TranslatedTextProps {
  textKey: string;
  originalText: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Component that renders translated text with automatic AI translation.
 * Shows original text immediately, then replaces with translation when ready.
 */
const TranslatedText = ({ textKey, originalText, as: Tag = "span", className }: TranslatedTextProps) => {
  const { t, queueTranslation, isSourceLang } = useAITranslation();
  const [displayText, setDisplayText] = useState(originalText);

  useEffect(() => {
    if (isSourceLang) {
      setDisplayText(originalText);
      return;
    }

    // Queue for batch translation
    const translated = queueTranslation(textKey, originalText);
    setDisplayText(translated);
  }, [textKey, originalText, isSourceLang, queueTranslation]);

  // Check for cached translation on each render
  const cachedTranslation = t(textKey, originalText);
  const finalText = isSourceLang ? originalText : cachedTranslation;

  return <Tag className={className}>{finalText}</Tag>;
};

export default TranslatedText;
