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
  Save,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  signOut,
  linkWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
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

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.696,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

// --- Sub-page Components ---

function ProfileView() {
  const [user, loading] = useAuthState(auth);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [publicInfo, setPublicInfo] = useState('');
  const [privateInfo, setPrivateInfo] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [isLinking, setIsLinking] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFarmName(data.farmName || '');
        setPublicInfo(data.publicInfo || '');
        setPrivateInfo(data.privateInfo || '');
      }
    };

    if (user) {
      const isLinked = user.providerData.some(
        (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
      );
      setIsGoogleLinked(isLinked);
      setDisplayName(user.displayName || '');
      fetchProfile();
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    setIsSuccess(false);
    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(
        docRef,
        {
          farmName,
          publicInfo,
          privateInfo,
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

  const handleLinkWithGoogle = async () => {
    if (!user) return;
    setIsLinking(true);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(user, provider);
      toast({
        title: 'تم الربط بنجاح!',
        description: 'تم ربط حسابك مع جوجل.',
        className: 'bg-green-600 text-white',
      });
      setIsGoogleLinked(true);
    } catch (error: any) {
      console.error('Error linking with Google: ', error);
      let description = 'حدث خطأ غير متوقع.';
      if (error.code === 'auth/credential-already-in-use') {
        description = 'حساب جوجل هذا مرتبط بالفعل بحساب آخر.';
      }
      toast({
        title: 'فشل الربط',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleNameChange = async () => {
    if (!user || !displayName.trim()) {
      toast({
        title: 'خطأ',
        description: 'لا يمكن ترك الاسم فارغًا.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingName(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { displayName: displayName.trim() }, { merge: true });

      toast({
        title: 'تم تحديث الاسم!',
        description: 'لقد تم تغيير اسمك المعروض بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: 'خطأ',
        description: 'لم نتمكن من تحديث اسمك.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingName(false);
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
            <div className="flex-1">
              <div className="space-y-2">
                <Label htmlFor="display-name">الاسم المعروض</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Button
                    size="icon"
                    onClick={handleNameChange}
                    disabled={isSavingName}
                  >
                    {isSavingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
          <div>
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
                : 'حفظ المعلومات الإضافية'}
            </span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الحسابات المرتبطة</CardTitle>
        </CardHeader>
        <CardContent>
          {isGoogleLinked ? (
            <div className="flex items-center text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
              <GoogleIcon className="h-5 w-5 ml-3" />
              <span>حسابك مرتبط مع جوجل.</span>
            </div>
          ) : (
            <Button
              onClick={handleLinkWithGoogle}
              disabled={isLinking}
              className="w-full"
            >
              {isLinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              <span className="mr-2">
                {isLinking ? 'جاري الربط...' : 'ربط مع حساب جوجل'}
              </span>
            </Button>
          )}
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
          {loading || adminLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      <Card>
        <CardContent className="p-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 ml-2" />
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
