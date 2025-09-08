
"use client";
import React from "react";
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>{children}</DataProvider>
    </AuthProvider>
  );
}
