import AppLayout from "@/components/app-layout";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="mt-4 text-muted-foreground">
          هنا ستكون إعدادات التطبيق والحساب.
        </p>
      </div>
    </AppLayout>
  );
}
