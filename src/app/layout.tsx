
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

function AppBody({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
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

  const renderContent = () => {
    if (!isClientLoaded && !isAuthPage) {
        return null; // Or a loading spinner covering the whole page
    }
    if (isAuthPage) {
        return <>{children}<Toaster /></>;
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

  return (
    <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased theme-green">
        {renderContent()}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
        <TopicsProvider>
            <AppBody>{children}</AppBody>
        </TopicsProvider>
    </LanguageProvider>
  );
}
