import { DollarSign, ShoppingCart, HandCoins, User } from "lucide-react";
import Link from "next/link";

export default function ManagementPage() {
  const managementItems = [
    {
      title: "المصاريف",
      icon: DollarSign,
      color: "text-primary",
      href: "/management/expenses",
    },
    {
      title: "المبيعات",
      icon: ShoppingCart,
      color: "text-primary",
      href: "/management/sales",
    },
    {
      title: "الديون",
      icon: HandCoins,
      color: "text-primary",
      href: "/management/debts",
    },
    { title: "العمال", icon: User, color: "text-primary", href: "/management/workers" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">إدارة المزرعة</h1>
        <p className="mt-1 text-muted-foreground">
          نظرة شاملة على عمليات مزرعتك.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-4">
        {managementItems.map((item) => (
          <Link href={item.href} key={item.title}>
            <div
              className="bg-card p-6 rounded-xl shadow-md flex flex-col items-center justify-center space-y-3 transition-all cursor-pointer hover:shadow-xl hover:scale-105 hover:-translate-y-2 duration-300 h-full"
            >
              <div className="p-4 rounded-lg border bg-secondary/30">
                <item.icon
                  className={`h-12 w-12 ${item.color} drop-shadow-sm`}
                />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">
                {item.title}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
