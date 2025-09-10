
"use client";

import React from 'react';
import { useLanguage } from '@/context/language-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="flex h-screen w-full flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
