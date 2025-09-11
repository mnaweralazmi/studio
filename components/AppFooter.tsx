'use client';

import {
  CalendarDays,
  Tractor,
  Settings,
  Home,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function AppFooter({ activeView }: { activeView: string }) {
  const [user] = useAuthState(auth);
  const pathname = usePathname();

  if (!user || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const mainNavItems = [
    { id: 'home', label: 'الرئيسية', icon: Home, href: '/home' },
    { id: 'tasks', label: 'المهام', icon: CalendarDays, href: '/tasks' },
    { id: 'management', label: 'الإدارة', icon: Tractor, href: '/management' },
    { id: 'budget', label: 'الميزانية', icon: Landmark, href: '/budget' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, href: '/settings' },
  ];

  const NavLink = ({
    id,
    icon: Icon,
    label,
    isActive,
    href,
  }: {
    id: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    href: string;
  }) => {
    return (
      <Link href={href} className="w-full h-full">
        <div
          className={cn(
            'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
            isActive && 'text-primary'
          )}
        >
          <Icon className="h-7 w-7" />
          <span className="text-xs mt-1 font-medium">{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong z-50">
      <nav className="flex justify-around items-center h-20">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={activeView === item.id}
          />
        ))}
      </nav>
    </footer>
  );
}
