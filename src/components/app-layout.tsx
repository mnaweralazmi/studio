"use client";

import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
