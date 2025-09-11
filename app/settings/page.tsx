'use client';

import {
  Bell,
  Languages,
  UserCircle,
  Shield,
  ArrowLeft,
  Palette,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// --- Sub-page Components ---

function ThemeView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">الألوان</h1>
      <ThemeSwitcher />
    </div>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            سيتم إضافة محتوى هذا القسم قريبًا.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page Component ---

type SettingsViewId = 'theme' | 'profile' | 'notifications' | 'language' | 'security';

export default function SettingsPage() {
  const [activeView, setActiveView] = useState<SettingsViewId>('theme');

  const views: { id: SettingsViewId; component: ReactNode }[] = [
    { id: 'theme', component: <ThemeView /> },
    { id: 'profile', component: <PlaceholderView title="ملف المزرعة" /> },
    { id: 'notifications', component: <PlaceholderView title="الإشعارات" /> },
    { id: 'language', component: <PlaceholderView title="اللغة" /> },
    { id: 'security', component: <PlaceholderView title="الأمان" /> },
  ];

  const navItems: {
    id: SettingsViewId | 'back';
    label: string;
    icon: React.ElementType;
    href?: string;
  }[] = [
    { id: 'theme', label: 'الألوان', icon: Palette },
    { id: 'profile', label: 'الملف', icon: UserCircle },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'language', label: 'اللغة', icon: Languages },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'back', label: 'رجوع', icon: ArrowLeft, href: '/' },
  ];

  const activeComponent = views.find((v) => v.id === activeView)?.component;

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = activeView === item.id;
    const content = (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
          isActive && 'text-primary'
        )}
        onClick={() => item.id !== 'back' && setActiveView(item.id as SettingsViewId)}
      >
        <item.icon className="h-7 w-7" />
        <span className="text-xs mt-1 font-medium">{item.label}</span>
      </div>
    );

    if (item.href) {
      return (
        <Link href={item.href} className="w-full h-full">
          {content}
        </Link>
      );
    }

    return <div className="w-full h-full cursor-pointer">{content}</div>;
  };

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-foreground sr-only">
          الإعدادات
        </h1>
        <p className="mt-1 text-muted-foreground sr-only">
          قم بتخصيص إعدادات التطبيق والمزرعة.
        </p>
      </header>

      <div className="mt-6">{activeComponent}</div>

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong z-50">
        <nav className="flex justify-around items-center h-20">
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>
      </footer>
    </div>
  );
}
