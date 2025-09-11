import { Droplets, BookOpen, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const topics = [
    { title: "أفضل الممارسات للري", icon: Droplets },
    { title: "مكافحة الآفات بطرق عضوية", icon: BookOpen },
  ];

  return (
    <div className="space-y-8 flex flex-col items-center h-full pt-16">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-bold text-primary">مزارع كويتي</h1>
        <p className="text-muted-foreground">
          دليلك التعليمي لاستدامة مزرعتك ونموها.
        </p>
      </header>

      <div className="w-full max-w-sm space-y-4">
        <Button asChild className="w-full" size="lg">
          <Link href="/login">
            <LogIn className="ml-2 h-5 w-5" />
            تسجيل الدخول
          </Link>
        </Button>
        <Button asChild className="w-full" size="lg" variant="outline">
          <Link href="/register">إنشاء حساب جديد</Link>
        </Button>
      </div>

      <div className="pt-8 w-full max-w-md">
        <h3 className="text-2xl font-semibold mb-4 text-foreground text-center">
          مواضيع شائعة
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="bg-card p-4 rounded-xl shadow-sm flex items-center space-x-4 rtl:space-x-reverse transition-all hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer duration-300"
            >
              <div className="bg-primary/10 p-3 rounded-full border">
                <topic.icon className="h-6 w-6 text-primary drop-shadow-sm" />
              </div>
              <p className="text-card-foreground font-medium text-base flex-1">
                {topic.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
