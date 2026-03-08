import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import tr from './locales/tr.json';
import en from './locales/en.json';

// Dynamic languages will use AI translation for content
// Static UI strings fallback to Turkish if not available
const emptyTranslation = {};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
      de: { translation: emptyTranslation },
      fr: { translation: emptyTranslation },
      es: { translation: emptyTranslation },
      ar: { translation: emptyTranslation },
      ru: { translation: emptyTranslation },
      zh: { translation: emptyTranslation },
      ja: { translation: emptyTranslation },
      ko: { translation: emptyTranslation },
    },
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

