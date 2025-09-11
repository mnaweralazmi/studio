'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ListChecks,
  Tractor,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function AppFooter() {
  const pathname = usePathname();
  const [user] = useAuthState(auth);

  if (!user || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const mainNavItems = [
    { href: '/tasks', label: 'المهام', icon: ListChecks },
    { href: '/management', label: 'الإدارة', icon: Tractor },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  const NavLink = ({
    href,
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    href?: string;
    icon: React.ElementType;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
  }) => {
    const content = (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
          isActive && 'text-primary'
        )}
        onClick={onClick}
      >
        <Icon className="h-7 w-7" />
        <span className="text-xs mt-1 font-medium">{label}</span>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="w-full h-full">
          {content}
        </Link>
      );
    }
    return <div className="w-full h-full cursor-pointer">{content}</div>;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong z-50">
      <nav className="flex justify-around items-center h-20">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
         <NavLink
            key="logout"
            icon={LogOut}
            label="خروج"
            onClick={() => auth.signOut()}
          />
      </nav>
    </footer>
  );
}
