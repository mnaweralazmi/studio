
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { TopicsProvider } from '@/context/topics-context';
import { useRouter } from 'next/navigation';
import { Cairo } from 'next/font/google';
import { Skeleton } from '@/components/ui/skeleton';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
});

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "theme-green";
    const mode = localStorage.getItem("mode") || "dark";
    
    const body = document.body;
    body.classList.remove("theme-green", "theme-blue", "theme-orange");
    body.classList.add(theme);

    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(mode);

    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthPage && isAuthenticated !== 'true') {
      router.replace('/login');
    } else {
        setIsClientLoaded(true);
    }
  }, [pathname, isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}<Toaster /></>;
  }

  if (!isClientLoaded) {
    return (
        <div className="flex h-screen w-full bg-background">
            <div className="hidden md:flex h-full">
               <Skeleton className="h-full w-[256px]" />
            </div>
            <div className="flex-1 p-4">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
        <AppLayout>
            {children}
        </AppLayout>
        <Toaster />
    </SidebarProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [language, setLanguage] = useState<string>('ar');

  useEffect(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang) {
      setLanguage(storedLang);
      document.documentElement.lang = storedLang;
      document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  return (
    <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} className={`dark ${cairo.className}`}>
      <head />
      <body className="antialiased theme-green">
        <LanguageProvider>
          <TopicsProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
          </TopicsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
