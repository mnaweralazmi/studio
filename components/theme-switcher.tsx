'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Palette, Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: 'فاتح', value: 'light', icon: Sun },
    { name: 'داكن', value: 'dark', icon: Moon },
    { name: 'النظام', value: 'system', icon: Laptop },
  ];

  return (
    <div className="bg-card p-4 rounded-xl shadow-sm flex items-center space-x-4 rtl:space-x-reverse">
      <Palette className="h-7 w-7 text-primary" />
      <span className="text-lg font-medium text-card-foreground flex-1">
        الألوان
      </span>
      <div className="flex items-center space-x-1 rtl:space-x-reverse rounded-md bg-muted p-1">
        {themes.map((t) => (
          <Button
            key={t.value}
            variant={theme === t.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme(t.value)}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 h-auto transition-all ${
              theme === t.value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-secondary/50'
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span>{t.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
