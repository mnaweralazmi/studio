'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ListChecks,
  Tractor,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

export default function AppFooter() {
  const pathname = usePathname();

  // Hide the main footer on pages that have their own custom footer
  if (pathname === '/tasks' || pathname === '/management' || pathname === '/settings') {
    return null;
  }

  const mainNavItems = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/tasks', label: 'المهام', icon: ListChecks },
    { href: '/management', label: 'الإدارة', icon: Tractor },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  const NavLink = ({
    href,
    icon: Icon,
    label,
    isActive,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive?: boolean;
  }) => (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
        isActive && 'text-primary'
      )}
    >
      <Icon className="h-7 w-7" />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </Link>
  );

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong z-50">
      <nav className="flex justify-around items-center h-20">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </footer>
  );
}
