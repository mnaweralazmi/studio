'use client';

import {
  Bell,
  UserCircle,
  Shield,
  Palette,
  ToggleLeft,
  ToggleRight,
  LogOut,
  Loader2,
  CheckCircle,
  Archive,
  UserCog,
  Send,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import ArchiveView from './ArchiveView';
import { toast } from '../ui/use-toast';

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
      await setDoc(docRef, {
        farmName,
        publicInfo,
        privateInfo,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }, { merge: true });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile: ", error);
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
      <h1 className="text-3xl font-bold text-foreground sr-only">ملف المزرعة</h1>
      <Card>
        <CardHeader>
          <CardTitle>معلومات الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
             {user?.photoURL ? (
                <Image src={user.photoURL} alt={user.displayName || 'صورة المستخدم'} width={80} height={80} className="rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                  <UserCircle className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            <div>
              <h2 className="text-xl font-bold">{user?.displayName || 'مستخدم جديد'}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="mt-2">
                <Label htmlFor="user-uid" className="text-xs">Your User ID (for Admin)</Label>
                <Input id="user-uid" readOnly value={user?.uid || ''} className="text-xs h-8 mt-1" onClick={(e) => (e.target as HTMLInputElement).select()} />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="farm-name">اسم المزرعة (عام)</Label>
            <Input id="farm-name" value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="مثال: مزرعة الأمل" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="public-info">معلومات عامة (تظهر للجميع)</Label>
            <Textarea id="public-info" value={publicInfo} onChange={e => setPublicInfo(e.target.value)} placeholder="وصف قصير عن المزرعة أو المنتجات..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="private-info">معلومات خاصة (تظهر لك فقط)</Label>
            <Textarea id="private-info" value={privateInfo} onChange={e => setPrivateInfo(e.target.value)} placeholder="ملاحظات، أرقام هواتف، أو أي معلومات خاصة..." />
          </div>

          <Button className="w-full" onClick={handleSaveChanges} disabled={isSaving || isSuccess}>
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : isSuccess ? <CheckCircle className="h-5 w-5" /> : null}
            <span className="mx-2">
              {isSaving ? 'جاري الحفظ...' : isSuccess ? 'تم الحفظ بنجاح!' : 'حفظ التغييرات'}
            </span>
          </Button>
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
          <Input id="notif-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: صيانة مجدولة" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notif-body">نص الإشعار</Label>
          <Textarea id="notif-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="تفاصيل الرسالة..." />
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
            <Input id="notif-uid" value={targetUid} onChange={(e) => setTargetUid(e.target.value)} placeholder="أدخل معرف المستخدم هنا" />
          </div>
        )}
        <Button onClick={handleSendNotification} disabled={isSending} className="w-full">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
          {isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </Button>
      </CardContent>
    </Card>
  )
}


// --- Main Page Component ---

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { isAdmin } = useAdmin();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const tabs = [
    { value: 'profile', label: 'الملف', icon: UserCircle },
    { value: 'appearance', label: 'المظهر', icon: Palette },
    { value: 'notifications', label: 'الإشعارات', icon: Bell },
    { value: 'security', label: 'الأمان', icon: Shield },
    { value: 'archive', label: 'الأرشيف', icon: Archive },
  ];
  
  if (isAdmin) {
    tabs.push({ value: 'admin', label: 'المدير', icon: UserCog });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
        <p className="mt-1 text-muted-foreground">
          قم بتخصيص إعدادات التطبيق والمزرعة.
        </p>
      </header>
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <tab.icon className="h-5 w-5 ml-2" />
              {tab.label}
            </TabsTrigger>
          ))}
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
        <TabsContent value="archive" className="mt-6">
          <ArchiveView user={user} />
        </TabsContent>
         {isAdmin && (
          <TabsContent value="admin" className="mt-6">
            <AdminView user={user} />
          </TabsContent>
        )}
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
