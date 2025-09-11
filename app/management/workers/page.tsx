import { ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkersPage() {
  const workers = [
    {
      id: "1",
      name: "أحمد عبدالله",
      role: "مشرف زراعي",
      phone: "91234567",
    },
    {
      id: "2",
      name: "محمد حسين",
      role: "عامل ري",
      phone: "98765432",
    },
    {
      id: "3",
      name: "علي كريم",
      role: "عامل حصاد",
      phone: "99887766",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">العمال</h1>
          <p className="mt-1 text-muted-foreground">
            قائمة العمال في المزرعة.
          </p>
        </div>
        <Button asChild>
          <Link href="/management">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة
          </Link>
        </Button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-card p-5 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="p-3 rounded-lg border bg-secondary/30">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-card-foreground">{worker.name}</h3>
                <p className="text-sm text-muted-foreground">{worker.role}</p>
              </div>
            </div>
             <p className="text-sm text-muted-foreground text-left dir-ltr">{worker.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
