
"use client";

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Home, Wallet, CreditCard, Landmark, CalendarDays, Users, Settings, LogOut, Leaf } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Skeleton } from '@/components/ui/skeleton';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const navItems = [
    { href: '/', label: t('home'), icon: Home, startsWith: '/' },
    { href: '/calendar', label: t('calendarAndTasks'), icon: CalendarDays, startsWith: '/calendar' },
    { href: '/budget', label: t('budget'), icon: Wallet, startsWith: '/budget' },
    { href: '/expenses', label: t('expenses'), icon: CreditCard, startsWith: '/expenses' },
    { href: '/debts', label: t('debts'), icon: Landmark, startsWith: '/debts' },
    { href: '/workers', label: t('workers'), icon: Users, startsWith: '/workers' },
  ];

  if (isLoading) {
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
    <div className="flex h-screen w-full">
      <Sidebar side={language === 'ar' ? 'right' : 'left'} collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 justify-center">
            <Leaf className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {t('kuwaitiFarmer')}
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
                 <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={item.href === '/' ? pathname === '/' : pathname.startsWith(item.startsWith)} tooltip={item.label}>
                        <NextLink href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                        </NextLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip={t('settings')}>
                <NextLink href="/settings">
                  <Settings />
                  <span>{t('settings')}</span>
                </NextLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton asChild tooltip={t('logout')}>
                  <a href="#" onClick={handleLogout}>
                    <LogOut />
                    <span>{t('logout')}</span>
                  </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col flex-1 overflow-auto">
        <header className="p-4 md:hidden">
          <SidebarTrigger />
        </header>
        <SidebarInset>
            {children}
        </SidebarInset>
      </div>
    </div>
  );
}
