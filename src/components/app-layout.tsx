"use client";

import React from 'react';
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
              <SidebarMenuButton href="#" isActive tooltip="الرئيسية">
                <Home />
                <span>الرئيسية</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="التقويم والمهام">
                <Calendar />
                <span>التقويم والمهام</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="الميزانية">
                <ClipboardList />
                <span>الميزانية</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="ملف المستخدم">
                <User />
                <span>ملف المستخدم</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="تسجيل الخروج">
                <LogOut />
                <span>تسجيل الخروج</span>
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
