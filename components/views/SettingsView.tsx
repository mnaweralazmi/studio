'use client';

import {
  Bell,
  UserCircle,
  Shield,
  Palette,
  LogOut,
  Loader2,
  CheckCircle,
  Archive,
  UserCog,
  Send,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useAdmin } from '@/lib/hooks/useAdmin';
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
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import ArchiveView from './ArchiveView';
import { toast } from '../ui/use-toast';
import { cn } from '@/lib/utils';
import { Toggle } from '../ui/toggle';

// --- Sub-page Components ---

function ProfileView() {
  const [user, loading] = useAuthState(auth);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [publicInfo, setPublicInfo] = useState('');
  const [privateInfo, setPrivateInfo] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const docRef = doc(db, 'users', user.uid, 'profile', 'data');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFarmName(data.farmName || '');
        setPublicInfo(data.publicInfo || '');
        setPrivateInfo(data.privateInfo || '');
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    setIsSuccess(false);
    const docRef = doc(db, 'users', user.uid, 'profile', 'data');
    try {
      await setDoc(
        docRef,
        {
          farmName,
          publicInfo,
          privateInfo,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        { merge: true }
      );
      toast({
        title: 'تم الحفظ بنجاح!',
        description: 'تم تحديث معلومات ملفك الشخصي.',
        className: 'bg-green-600 text-white',
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile: ', error);
      toast({
        title: 'خطأ',
        description: 'لم نتمكن من حفظ التغييرات.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || 'صورة المستخدم'}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <UserCircle className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">
                {user?.displayName || 'مستخدم جديد'}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="mt-2">
                <Label htmlFor="user-uid" className="text-xs">
                  Your User ID (for Admin)
                </Label>
                <Input
                  id="user-uid"
                  readOnly
                  value={user?.uid || ''}
                  className="text-xs h-8 mt-1"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farm-name">اسم المزرعة (عام)</Label>
            <Input
              id="farm-name"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="مثال: مزرعة الأمل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public-info">معلومات عامة (تظهر للجميع)</Label>
            <Textarea
              id="public-info"
              value={publicInfo}
              onChange={(e) => setPublicInfo(e.target.value)}
              placeholder="وصف قصير عن المزرعة أو المنتجات..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="private-info">معلومات خاصة (تظهر لك فقط)</Label>
            <Textarea
              id="private-info"
              value={privateInfo}
              onChange={(e) => setPrivateInfo(e.target.value)}
              placeholder="ملاحظات، أرقام هواتف، أو أي معلومات خاصة..."
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSaveChanges}
            disabled={isSaving || isSuccess}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle className="h-5 w-5" />
            ) : null}
            <span className="mx-2">
              {isSaving
                ? 'جاري الحفظ...'
                : isSuccess
                ? 'تم الحفظ بنجاح!'
                : 'حفظ التغييرات'}
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GeneralSettingsView() {
  const [language, setLanguage] = useState('ar');
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>المظهر</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <Label htmlFor="task-notifications">إشعارات المهام</Label>
            <Toggle
              id="task-notifications"
              pressed={taskNotifications}
              onPressedChange={setTaskNotifications}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-background">
            <Label htmlFor="sales-notifications">إشعارات المبيعات</Label>
            <Toggle
              id="sales-notifications"
              pressed={salesNotifications}
              onPressedChange={setSalesNotifications}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>الأمان</CardTitle>
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
           <Button className="w-full">تحديث كلمة المرور</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminView({ user }: { user: any }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [targetUid, setTargetUid] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!title || !body) {
      toast({
        title: 'خطأ',
        description: 'الرجاء ملء حقل العنوان والرسالة.',
        variant: 'destructive',
      });
      return;
    }
    if (target === 'specific' && !targetUid) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال معرف المستخدم المستهدف.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        body,
        target: target === 'all' ? 'all' : targetUid,
        createdAt: serverTimestamp(),
        read: false,
      });
      toast({
        title: 'تم الإرسال بنجاح',
        description: 'تم إرسال الإشعار للمستخدمين المستهدفين.',
        className: 'bg-green-600 text-white',
      });
      setTitle('');
      setBody('');
      setTargetUid('');
    } catch (e: any) {
      toast({
        title: 'خطأ في الإرسال',
        description: e.message || 'لم نتمكن من إرسال الإشعار.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إرسال إشعار</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notif-title">عنوان الإشعار</Label>
          <Input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: صيانة مجدولة"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notif-body">نص الإشعار</Label>
          <Textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="تفاصيل الرسالة..."
          />
        </div>
        <div className="space-y-2">
          <Label>المستلم</Label>
          <Select value={target} onValueChange={(v: any) => setTarget(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستخدمين</SelectItem>
              <SelectItem value="specific">مستخدم محدد</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {target === 'specific' && (
          <div className="space-y-2">
            <Label htmlFor="notif-uid">معرف المستخدم (UID)</Label>
            <Input
              id="notif-uid"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              placeholder="أدخل معرف المستخدم هنا"
            />
          </div>
        )}
        <Button
          onClick={handleSendNotification}
          disabled={isSending}
          className="w-full"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <Send className="w-4 h-4 ml-2" />
          )}
          {isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { isAdmin, loading: adminLoading } = useAdmin();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const tabs = [
    { value: 'profile', label: 'الملف الشخصي', icon: UserCircle },
    { value: 'settings', label: 'الإعدادات العامة', icon: Settings },
    { value: 'archive', label: 'الأرشيف', icon: Archive },
  ];

  if (isAdmin) {
    tabs.push({ value: 'admin', label: 'المدير', icon: UserCog });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <GeneralSettingsView />;
      case 'archive':
        return <ArchiveView user={user} />;
      case 'admin':
        return isAdmin ? <AdminView user={user} /> : null;
      default:
        return <ProfileView />;
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <nav className="flex flex-col space-y-2">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.value)}
                className="w-full justify-start"
              >
                <tab.icon className="h-5 w-5 ml-3" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </aside>

        <main className="md:col-span-3">
          {(loading || adminLoading) ? (
             <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
          ): renderContent()}
          </main>
      </div>

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
