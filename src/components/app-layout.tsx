'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Wallet, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

const navItems = [
  { href: '/', icon: Home, label: 'home' },
  { href: '/calendar', icon: Calendar, label: 'calendarAndTasks' },
  { href: '/financials', icon: Wallet, label: 'financialManagement' },
  { href: '/settings', icon: Settings, label: 'settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="sticky bottom-0 w-full bg-background border-t">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full h-full',
                  'text-muted-foreground transition-colors hover:text-primary',
                  {
                    'text-primary': isActive,
                  }
                )}
              >
                <item.icon
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-xs font-medium">{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
