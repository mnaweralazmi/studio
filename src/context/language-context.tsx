
"use client";

import React, { createContext, useState, useContext, useEffect, useLayoutEffect } from 'react';
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

export type Language = 'ar' | 'en';

type Translations = typeof ar;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof Translations, params?: Record<string, string>) => string;
}

const translations = { ar, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Use useLayoutEffect to prevent flash of untranslated content
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useIsomorphicLayoutEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const setLanguageWrapper = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  const t = (key: keyof Translations, params?: Record<string, string>): string => {
    let translation = translations[language][key] || translations['en'][key] || key;
    if (params) {
        Object.keys(params).forEach(pKey => {
            translation = translation.replace(`{${pKey}}`, params[pKey]);
        });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageWrapper, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
