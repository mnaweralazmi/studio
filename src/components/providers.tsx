"use client";

import React from 'react';
import { AppProvider } from '@/context/app-context';

export function Providers({ children }: { children: React.ReactNode }) {
  // Effects to set theme and mode from localStorage
  React.useEffect(() => {
    const theme = localStorage.getItem("theme") || "theme-green";
    document.body.classList.remove("theme-green", "theme-blue", "theme-orange");
    document.body.classList.add(theme);

    const mode = localStorage.getItem("mode") || "light"; // Default to light
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(mode);
  }, []);

  return (
      <AppProvider>
        {children}
      </AppProvider>
  );
}
