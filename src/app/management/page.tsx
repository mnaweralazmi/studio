import AppLayout from "@/components/app-layout";

export default function ManagementPage() {
  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">إدارة المزرعة</h1>
        <p className="mt-4 text-muted-foreground">
          هنا سيتم عرض أدوات إدارة المصاريف، المبيعات، الديون، والعمال.
        </p>
      </div>
    </AppLayout>
  );
}
