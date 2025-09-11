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
      <div className="bg-card p-4 rounded-xl shadow-sm">
        <div className="flex justify-around items-center">
          {managementItems.map((item) => (
            <Link href={item.href} key={item.title} className="flex-1">
              <div
                className="flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer hover:bg-secondary/50 rounded-lg py-3 hover:scale-105 duration-300"
              >
                <div className="p-3 rounded-full border bg-background">
                  <item.icon
                    className={`h-8 w-8 ${item.color} drop-shadow-sm`}
                  />
                </div>
                <h2 className="text-sm font-semibold text-card-foreground">
                  {item.title}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
