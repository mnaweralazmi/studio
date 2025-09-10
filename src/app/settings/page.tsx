"use client";

import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/app-layout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground mt-2">
          هنا يمكنك إدارة إعدادات حسابك وتطبيقك.
        </p>
        <div className="mt-8">
            <p>مرحباً, {user.displayName || user.email}</p>
            <Button variant="destructive" onClick={handleLogout} className="mt-4">
            تسجيل الخروج
            </Button>
        </div>
      </div>
    </AppLayout>
  );
}
