
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';
import React, { useEffect, useLayoutEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { useRouter } from 'next/navigation';
import { Cairo } from 'next/font/google';
import { Skeleton } from '@/components/ui/skeleton';
import { AppProvider, useAppContext } from '@/context/app-context';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
});

// Use useLayoutEffect to prevent flash of untranslated content
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
    if (!loading && !user && !isAuthPage) {
      router.replace('/login');
    }
  }, [user, loading, isAuthPage, router]);


  if (loading && !isAuthPage) {
    return (
        <div className="flex h-screen w-full bg-background items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-6 w-48" />
            </div>
        </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}<Toaster /></>;
  }
  
  if (!user) {
     return (
        <div className="flex h-screen w-full bg-background items-center justify-center">
            <p>Redirecting to login...</p>
        </div>
    );
  }


  return (
    <AppLayout>
        {children}
        <Toaster />
    </AppLayout>
  );
}


function AppHtml({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
