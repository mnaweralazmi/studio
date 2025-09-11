'use client';

import {
  Bell,
  Languages,
  UserCircle,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function SettingsPage() {
  const settingsItems = [
    { title: 'ملف المزرعة', icon: UserCircle, component: <ChevronLeft className="h-6 w-6 text-muted-foreground" /> },
    { title: 'الإشعارات', icon: Bell, component: <ChevronLeft className="h-6 w-6 text-muted-foreground" /> },
    { title: 'اللغة', icon: Languages, component: <ChevronLeft className="h-6 w-6 text-muted-foreground" /> },
    { title: 'الأمان', icon: Shield, component: <ChevronLeft className="h-6 w-6 text-muted-foreground" /> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
        <p className="mt-1 text-muted-foreground">
          قم بتخصيص إعدادات التطبيق والمزرعة.
        </p>
      </header>
      <div className="space-y-3">
        <ThemeSwitcher />
        {settingsItems.map((item) => (
          <div
            key={item.title}
            className="bg-card p-4 rounded-xl shadow-sm flex items-center space-x-4 rtl:space-x-reverse hover:bg-secondary transition-all cursor-pointer"
          >
            <div className="p-2 rounded-lg border bg-secondary/30">
              <item.icon className="h-7 w-7 text-primary drop-shadow-sm" />
            </div>
            <span className="text-lg font-medium text-card-foreground flex-1">
              {item.title}
            </span>
            {item.component}
          </div>
        ))}
      </div>
    </div>
  );
}
