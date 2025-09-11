'use client';

import {
  Bell,
  Languages,
  UserCircle,
  Shield,
  ArrowLeft,
  Palette,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// --- Sub-page Components ---

function ProfileView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">ملف المزرعة</h1>
      <Card>
        <CardHeader>
          <CardTitle>تعديل معلومات المزرعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
              <UserCircle className="w-16 h-16 text-muted-foreground" />
            </div>
            <Button variant="outline">تغيير الشعار</Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="farm-name">اسم المزرعة</Label>
            <Input id="farm-name" defaultValue="مزرعة الأمل" />
          </div>
          <Button className="w-full">حفظ التغييرات</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsView() {
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(false);

  const Toggle = ({
    label,
    enabled,
    setEnabled,
  }: {
    label: string;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
  }) => (
    <div
      onClick={() => setEnabled(!enabled)}
      className="bg-card p-4 rounded-xl shadow-sm flex items-center cursor-pointer"
    >
      <div className="flex-1">
        <h3 className="text-lg font-medium text-card-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground">
          {enabled ? 'مفعل' : 'معطل'}
        </p>
      </div>
      {enabled ? (
        <ToggleRight className="h-8 w-8 text-primary" />
      ) : (
        <ToggleLeft className="h-8 w-8 text-muted-foreground" />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">الإشعارات</h1>
      <div className="space-y-4">
        <Toggle
          label="إشعارات المهام"
          enabled={taskNotifications}
          setEnabled={setTaskNotifications}
        />
        <Toggle
          label="إشعارات المبيعات"
          enabled={salesNotifications}
          setEnabled={setSalesNotifications}
        />
      </div>
    </div>
  );
}

function AppearanceView() {
  const [language, setLanguage] = useState('ar');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">المظهر واللغة</h1>
      <ThemeSwitcher />
      <Card>
        <CardHeader>
          <CardTitle>اللغة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language-select">اختر لغة التطبيق</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language-select">
                <SelectValue placeholder="اختر لغة..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">الأمان والخصوصية</h1>
      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">كلمة المرور الحالية</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button className="w-full">تحديث كلمة المرور</Button>
        </CardContent>
      </Card>
    </div>
  );
}


// --- Main Page Component ---

type SettingsViewId =
  | 'profile'
  | 'appearance'
  | 'notifications'
  | 'security';

export default function SettingsPage() {
  const [activeView, setActiveView] = useState<SettingsViewId>('profile');

  const views: { id: SettingsViewId; component: ReactNode }[] = [
    { id: 'profile', component: <ProfileView /> },
    { id: 'appearance', component: <AppearanceView /> },
    { id: 'notifications', component: <NotificationsView /> },
    { id: 'security', component: <SecurityView /> },
  ];

  const navItems: {
    id: SettingsViewId | 'back';
    label: string;
    icon: React.ElementType;
    href?: string;
  }[] = [
    { id: 'profile', label: 'الملف', icon: UserCircle },
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'back', label: 'رجوع', icon: ArrowLeft, href: '/' },
  ];

  const activeComponent = views.find((v) => v.id === activeView)?.component;

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = activeView === item.id;
    const content = (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
          isActive && 'text-primary'
        )}
        onClick={() =>
          item.id !== 'back' && setActiveView(item.id as SettingsViewId)
        }
      >
        <item.icon className="h-7 w-7" />
        <span className="text-xs mt-1 font-medium">{item.label}</span>
      </div>
    );

    if (item.href) {
      return (
        <Link href={item.href} className="w-full h-full">
          {content}
        </Link>
      );
    }

    return <div className="w-full h-full cursor-pointer">{content}</div>;
  };

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-foreground sr-only">
          الإعدادات
        </h1>
        <p className="mt-1 text-muted-foreground sr-only">
          قم بتخصيص إعدادات التطبيق والمزرعة.
        </p>
      </header>

      <div className="mt-6">{activeComponent}</div>

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong z-50">
        <nav className="flex justify-around items-center h-20">
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>
      </footer>
    </div>
  );
}
