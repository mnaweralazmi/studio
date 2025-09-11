'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  ListChecks,
  Tractor,
  Settings,
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  HandCoins,
  User,
  CalendarIcon,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

export default function AppFooter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isManagementPage = pathname === '/management';
  const isTasksPage = pathname === '/tasks';

  const [activeTab, setActiveTab] = React.useState(isManagementPage ? 'expenses' : isTasksPage ? 'calendar' : '');


  const mainNavItems = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/tasks', label: 'المهام', icon: ListChecks },
    { href: '/management', label: 'الإدارة', icon: Tractor },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  const managementNavItems = [
    { href: '/management?tab=expenses', label: 'المصاريف', icon: DollarSign },
    { href: '/management?tab=sales', label: 'المبيعات', icon: ShoppingCart },
    { href: '/management?tab=debts', label: 'الديون', icon: HandCoins },
    { href: '/management?tab=workers', label: 'العمال', icon: User },
    { href: '/', label: 'رجوع', icon: ArrowLeft },
  ];
  
  const NavLink = ({
    href,
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
  }) => (
    <Link
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
        isActive && 'text-primary'
      )}
    >
      <Icon className="h-7 w-7" />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </Link>
  );

  let navItems;
  if (isManagementPage) {
    navItems = managementNavItems;
  } else {
    navItems = mainNavItems;
  }
  
  if (isTasksPage) {
    // Render nothing for tasks page, as it has its own footer
    return null;
  }


  const getIsActive = (item: { href: string; }) => {
    if (isManagementPage) {
      const itemTab = item.href.split('=')[1];
      const currentTabParam = searchParams.get('tab');
      const currentTab = currentTabParam || 'expenses';
      return itemTab === currentTab;
    }
    return pathname === item.href && !searchParams.get('tab');
  };
  
  const handleNavClick = (tab: string) => {
      const event = new CustomEvent('tab-change', { detail: { tab } });
      window.dispatchEvent(event);
      setActiveTab(tab);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong z-50">
      <nav className="flex justify-around items-center h-20">
        {navItems.map((item) => {
           const itemTab = item.href.split('=')[1];
          return (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={getIsActive(item)}
               onClick={isManagementPage && itemTab ? () => handleNavClick(itemTab) : undefined}
            />
          );
        })}
      </nav>
    </footer>
  );
}
