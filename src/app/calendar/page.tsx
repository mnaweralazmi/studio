import AppLayout from "@/components/app-layout";

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">التقويم والمهام</h1>
        <p className="mt-4 text-muted-foreground">
          هنا سيتم عرض التقويم والمهام الخاصة بالمزرعة.
        </p>
      </div>
    </AppLayout>
  );
}