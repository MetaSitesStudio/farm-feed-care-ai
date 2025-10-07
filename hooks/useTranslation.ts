
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Helper to access nested keys like 'header.title'
const getNestedTranslation = (obj: any, key: string): string | undefined => {
  if (!obj) return undefined;
  return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

export const useTranslation = () => {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<{current: any, en: any}>({ current: null, en: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoading(true);
      try {
        const [enResponse, langResponse] = await Promise.all([
            fetch('./translations/en.json'),
            fetch(`./translations/${language}.json`)
        ]);

        if (!enResponse.ok || !langResponse.ok) {
            throw new Error('Network response was not ok for translations');
        }

        const enData = await enResponse.json();
        const langData = await langResponse.json();
        
        setTranslations({ current: langData, en: enData });
      } catch (error) {
        console.error('Failed to fetch translations:', error);
        // Attempt to load English as a fallback for both
        try {
            const enResponse = await fetch('./translations/en.json');
            if (!enResponse.ok) throw new Error('Failed to load fallback English translation');
            const enData = await enResponse.json();
            setTranslations({ current: enData, en: enData });
        } catch (fallbackError) {
            console.error('Fallback translation fetch failed:', fallbackError);
            setTranslations({ current: {}, en: {} }); // Set to empty to avoid errors
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [language]);

  const t = useCallback((key: string): string => {
    if (isLoading || !translations.current || !translations.en) {
      return key; // Return key as fallback during load
    }
    
    const translatedText = getNestedTranslation(translations.current, key);
    if (translatedText !== undefined) {
      return translatedText;
    }
    
    // Fallback to English if key not found in current language
    const fallbackText = getNestedTranslation(translations.en, key);
    return fallbackText || key; // Return key if not found anywhere
  }, [isLoading, translations]);

  return { t, language };
};