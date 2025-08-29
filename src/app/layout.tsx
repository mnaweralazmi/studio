
"use client";

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { LanguageProvider } from '@/context/language-context';
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
  }, [user, loading, isAuthPage, router]);


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
    <AppLayout>
        {children}
        <Toaster />
    </AppLayout>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The dir and lang attributes are now managed by the LanguageProvider
    <html lang="ar" dir="rtl" className={cairo.className}>
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
