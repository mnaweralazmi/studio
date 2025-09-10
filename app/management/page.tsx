import { DollarSign, ShoppingCart, HandCoins, User } from "lucide-react";

export default function ManagementPage() {
  const managementItems = [
    { title: "المصاريف", icon: DollarSign, color: "text-primary" },
    { title: "المبيعات", icon: ShoppingCart, color: "text-primary" },
    { title: "الديون", icon: HandCoins, color: "text-primary" },
    { title: "العمال", icon: User, color: "text-primary" },
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
          <div
            key={item.title}
            className="bg-card p-6 rounded-xl shadow-md flex flex-col items-center justify-center space-y-3 hover:bg-secondary transition-all cursor-pointer"
          >
            <item.icon className={`h-10 w-10 ${item.color}`} />
            <h2 className="text-lg font-semibold text-card-foreground">
              {item.title}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}