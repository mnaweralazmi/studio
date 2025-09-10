import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404 - الصفحة غير موجودة</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        عفواً، هذه الصفحة التي تبحث عنها غير موجودة.
      </p>
      <Link href="/" className="mt-8 rounded-md bg-primary px-6 py-2 text-primary-foreground">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
