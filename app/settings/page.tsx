import { Bell, Languages, UserCircle, Shield } from "lucide-react";

export default function SettingsPage() {
  const settingsItems = [
    { title: "ملف المزرعة", icon: UserCircle },
    { title: "الإشعارات", icon: Bell },
    { title: "اللغة", icon: Languages },
    { title: "الأمان", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
        <p className="mt-1 text-muted-foreground">
          قم بتخصيص إعدادات التطبيق والمزرعة.
        </p>
      </header>
      <div className="space-y-3">
        {settingsItems.map((item) => (
          <div
            key={item.title}
            className="bg-card p-4 rounded-xl shadow-sm flex items-center space-x-4 rtl:space-x-reverse"
          >
            <item.icon className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium text-card-foreground">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
