'use client';

import {
  Bell,
  UserCircle,
  Shield,
  Palette,
  ToggleLeft,
  ToggleRight,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// --- Sub-page Components ---

function ProfileView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground sr-only">ملف المزرعة</h1>
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
      <h1 className="text-3xl font-bold text-foreground sr-only">الإشعارات</h1>
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
      <h1 className="text-3xl font-bold text-foreground sr-only">المظهر</h1>
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
      <h1 className="text-3xl font-bold text-foreground sr-only">الأمان والخصوصية</h1>
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

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
        <p className="mt-1 text-muted-foreground">
          قم بتخصيص إعدادات التطبيق والمزرعة.
        </p>
      </header>
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <UserCircle className="h-5 w-5 ml-2" />
            الملف
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-5 w-5 ml-2" />
            المظهر
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-5 w-5 ml-2" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-5 w-5 ml-2" />
            الأمان
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileView />
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
          <AppearanceView />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsView />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityView />
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-5 w-5 ml-2" />
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
