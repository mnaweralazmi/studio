
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { LanguageProvider } from '@/context/language-context';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
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

  return (
    <LanguageProvider>
        <html lang="ar" dir="rtl" className="dark">
          <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
          </head>
          <body className="font-body antialiased theme-green">
            {isAuthPage ? (
              <>
                {children}
                <Toaster />
              </>
            ) : (
              <SidebarProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </SidebarProvider>
            )}
            {!isAuthPage && <Toaster />}
          </body>
        </html>
    </LanguageProvider>
  );
}
