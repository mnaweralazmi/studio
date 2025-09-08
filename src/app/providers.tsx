
"use client";
import React from "react";

// This component is now a simple wrapper. 
// The actual providers have been moved to layout.tsx to enforce the correct order.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
