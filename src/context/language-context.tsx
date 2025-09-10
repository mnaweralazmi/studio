"use client";

import { createContext, useState, useEffect, ReactNode } from "react";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

type Locale = "ar" | "en";
type Translations = typeof ar | typeof en;

interface LanguageContextType {
  locale: Locale;
  t: (key: keyof Translations) => string;
  setLocale: (locale: Locale) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations = { ar, en };

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale | null;
    if (savedLocale) {
      setLocaleState(savedLocale);
      document.documentElement.lang = savedLocale;
      document.documentElement.dir = savedLocale === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
  };

  const t = (key: keyof Translations) => {
    return translations[locale][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};
