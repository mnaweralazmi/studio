"use client";

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Home, Calendar, ClipboardList, User, LogOut, Leaf } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full">
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 justify-center">
            <Leaf className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-primary-foreground group-data-[collapsible=icon]:hidden">
              بلانتاسي
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <NextLink href="/" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="الرئيسية">
                  <a>
                    <Home />
                    <span>الرئيسية</span>
                  </a>
                </SidebarMenuButton>
              </NextLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NextLink href="/calendar" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={pathname === '/calendar'} tooltip="التقويم والمهام">
                   <a>
                    <Calendar />
                    <span>التقويم والمهام</span>
                  </a>
                </SidebarMenuButton>
              </NextLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NextLink href="/budget" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={pathname === '/budget'} tooltip="الميزانية">
                  <a>
                    <ClipboardList />
                    <span>الميزانية</span>
                  </a>
                </SidebarMenuButton>
              </NextLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <NextLink href="/profile" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={pathname === '/profile'} tooltip="ملف المستخدم">
                  <a>
                    <User />
                    <span>ملف المستخدم</span>
                  </a>
                </SidebarMenuButton>
              </NextLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton asChild tooltip="تسجيل الخروج">
                  <a href="#">
                    <LogOut />
                    <span>تسجيل الخروج</span>
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
