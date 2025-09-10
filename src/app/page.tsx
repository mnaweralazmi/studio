import AppLayout from "@/components/app-layout";

export default function HomePage() {
  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">مواضيع للتعليم</h1>
        <p className="mt-4 text-muted-foreground">
          هنا سيتم عرض المواضيع التعليمية الخاصة بالزراعة.
        </p>
      </div>
    </AppLayout>
  );
}