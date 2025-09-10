"use client";

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, DollarSign, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


// This is the main layout for the authenticated part of the app.
export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-background px-4">
        <h1 className="text-lg font-semibold">مزارع كويتي</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">تسجيل الخروج</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>تسجيل الخروج</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNavigation />
    </div>
  );
}


function BottomNavigation() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'الرئيسية', icon: Home },
        { href: '/calendar', label: 'التقويم', icon: Calendar },
        { href: '/financials', label: 'الإدارة المالية', icon: DollarSign },
        { href: '/settings', label: 'الإعدادات', icon: Settings },
    ];

    return (
        <nav className="sticky bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm md:hidden">
            <div className="flex h-16 items-center justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <NextLink href={item.href} key={item.label}>
                            <div className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-md",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                <item.icon className="h-6 w-6" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                        </NextLink>
                    );
                })}
            </div>
        </nav>
    );
}
