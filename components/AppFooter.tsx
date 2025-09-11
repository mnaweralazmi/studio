'use client';

import { Home, Tractor, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

export default function AppFooter({
  activeView,
  setActiveView,
}: {
  activeView: string;
  setActiveView: (view: string) => void;
}) {
  const mainNavItems = [
    { id: 'tasks', label: 'الرئيسية', icon: Home },
    { id: 'management', label: 'الإدارة', icon: Tractor },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const NavLink = ({
    id,
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    id: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: (id: string) => void;
  }) => {
    return (
      <div
        onClick={() => onClick(id)}
        className="w-full h-full cursor-pointer"
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
            isActive && 'text-primary'
          )}
        >
          <Icon className="h-7 w-7" />
          <span className="text-xs mt-1 font-medium">{label}</span>
        </div>
      </div>
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
            isActive={activeView === item.id}
            onClick={setActiveView}
          />
        ))}
      </nav>
    </footer>
  );
}
