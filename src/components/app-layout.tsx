"use client";

import React from 'react';

// This is the main layout for the authenticated part of the app.
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header can be added here if needed */}
      <main className="flex-1 overflow-y-auto">{children}</main>
      {/* Bottom navigation can be added here if needed */}
    </div>
  );
}
