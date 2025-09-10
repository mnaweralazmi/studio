"use client";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-8 text-center">
        <h1 className="text-4xl font-bold">
          مرحباً بك في تطبيقك الجديد
        </h1>
        <p className="text-lg text-muted-foreground">
          لقد تم إعادة تعيين المشروع إلى أبسط حالة. هذا هو الأساس الجديد والمستقر الذي يمكنك البناء عليه.
        </p>
      </div>
    </main>
  );
}
