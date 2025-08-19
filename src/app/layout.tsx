
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
import { AuthProvider, useAuth } from '@/context/auth-context';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
});

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "theme-green";
    const mode = localStorage.getItem("mode") || "dark";
    
    const body = document.body;
    body.classList.remove("theme-green", "theme-blue", "theme-orange");
    body.classList.add(theme);

    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(mode);

  }, []);

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace('/login');
    }
  }, [user, loading, isAuthPage, router]); // Removed pathname as it's redundant here


  if (loading && !isAuthPage) {
    return (
        <div className="flex h-screen w-full bg-background items-center justify-center">
            <Skeleton className="h-20 w-20" />
        </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}<Toaster /></>;
  }

  if (!user) {
     return (
        <div className="flex h-screen w-full bg-background items-center justify-center">
            <Skeleton className="h-20 w-20" />
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
        <AuthProvider>
            <LanguageProvider>
            <TopicsProvider>
                <RootLayoutContent>{children}</RootLayoutContent>
            </TopicsProvider>
            </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
