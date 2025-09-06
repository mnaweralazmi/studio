
"use client";

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardPen, CalendarDays, Settings, BarChart } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/calendar', label: t('calendarAndTasks'), icon: CalendarDays },
    { href: '/financials', label: t('departmentalManagement'), icon: ClipboardPen },
    { href: '/summary', label: t('financialSummary'), icon: BarChart },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t border-border/20 bg-background/80 backdrop-blur-md">
        <div className={`mx-auto grid h-full max-w-lg font-medium grid-cols-5`}>
          {navItems.map(item => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={cn(
                  "group inline-flex flex-col items-center justify-center px-2 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                  isActive && "text-primary"
                )}
              >
                <item.icon className="mb-1 h-6 w-6" />
                <span className="text-xs text-center">{item.label}</span>
              </NextLink>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
