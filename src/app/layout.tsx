
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/app-layout';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useLayoutEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { Cairo } from 'next/font/google';
import { Leaf } from 'lucide-react';
import { AppProvider, useAppContext } from '@/context/app-context';

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
  
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "theme-green";
    document.body.classList.remove("theme-green", "theme-blue", "theme-orange");
    document.body.classList.add(theme);

    const mode = localStorage.getItem("mode") || "dark";
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(mode);

    html.style.fontFamily = cairo.style.fontFamily;
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user && !isAuthPage) {
      router.replace('/login');
    }
    
    if (user && isAuthPage) {
        router.replace('/');
    }

  }, [user, loading, isAuthPage, router]);

  if (loading) {
    return (
        <div className="flex h-screen w-full bg-background items-center justify-center">
             <div className="flex flex-col items-center gap-4 animate-pulse">
                <Leaf className="h-20 w-20 text-primary" />
                <p className="text-lg text-muted-foreground">جاري التحميل...</p>
            </div>
        </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}<Toaster /></>;
  }
  
  if (user) {
    return (
        <AppLayout>
            {children}
            <Toaster />
        </AppLayout>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Leaf className="h-20 w-20 text-primary" />
            <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
        </div>
    </div>
  );
}

function AppHtml({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  
  useIsomorphicLayoutEffect(() => {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  
  return (
     <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <head />
      <body>
          <AppProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
          </AppProvider>
      </body>
    </html>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
     <LanguageProvider>
        <AppHtml>{children}</AppHtml>
    </LanguageProvider>
  );
}

    