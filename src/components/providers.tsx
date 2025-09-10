"use client";

import React from 'react';
import { AppProvider } from '@/context/app-context';
import { useAppContext } from '@/context/app-context';
import { Leaf } from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
    const { loading } = useAppContext();

    if (loading) {
        return (
          <div className="flex h-screen w-full bg-background items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <Leaf className="h-20 w-20 text-primary" />
              <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
          </div>
        );
    }
    
    return <>{children}</>;
}


export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <AppProvider>
        <AppContent>
            {children}
        </AppContent>
      </AppProvider>
  );
}
