"use client";

import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/app-layout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/loading-screen";

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">التقويم والمهام</h1>
        <p className="text-muted-foreground mt-2">
          هنا يمكنك عرض وإدارة مهامك.
        </p>
      </div>
    </AppLayout>
  );
}
