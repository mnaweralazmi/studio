import AppLayout from "@/components/app-layout";

export default function HomePage() {
  return (
    <AppLayout>
      <div className="flex-1 w-full p-6">
        <h1 className="text-2xl font-bold">المواضيع التعليمية</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 bg-card text-card-foreground">
              <h2 className="font-semibold">موضوع تعليمي {index + 1}</h2>
              <p className="text-sm text-muted-foreground mt-2">
                وصف موجز للموضوع التعليمي. يمكنك هنا وضع تفاصيل حول الزراعة والري والآفات.
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
