
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useLayoutEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { Cairo } from 'next/font/google';
import { Leaf } from 'lucide-react';
import { AppProvider, useAppContext } from '@/context/app-context';
import { AppLayout } from '@/components/app-layout';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAppContext();
  const { t } = useLanguage();
  
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (loading) {
      return; 
    }
    if (!user && !isAuthPage) {
      router.replace('/login');
    }
    if (user && isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, isAuthPage, router]);

  if (loading || (!user && !isAuthPage)) {
    return (
      <div className="flex h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Leaf className="h-20 w-20 text-primary" />
          <p className="text-lg text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  if (isAuthPage) {
     return <>{children}</>;
  }
  
  if (user) {
    return <AppLayout>{children}</AppLayout>
  }

  // Fallback for edge cases during redirection
  return (
      <div className="flex h-screen w-full bg-background items-center justify-center">
           <div className="flex flex-col items-center gap-4 animate-pulse">
              <Leaf className="h-20 w-20 text-primary" />
              <p className="text-lg text-muted-foreground">{t('loading')}</p>
          </div>
      </div>
  );
}


function AppHtml({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  
  useIsomorphicLayoutEffect(() => {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.body.style.fontFamily = cairo.style.fontFamily;

      const theme = localStorage.getItem("theme") || "theme-green";
      document.body.classList.remove("theme-green", "theme-blue", "theme-orange");
      document.body.classList.add(theme);

      const mode = localStorage.getItem("mode") || "dark";
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(mode);

  }, [language]);
  
  return (
     <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Kuwaiti Farmer</title>
      </head>
      <body className={cairo.className}>
          <AppProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
            <Toaster />
          </AppProvider>
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <LanguageProvider>
        <AppHtml>{children}</AppHtml>
    </LanguageProvider>
  );
}
