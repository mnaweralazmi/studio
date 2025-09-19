'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Loader2,
  CalendarCheck,
  User as UserIcon,
  Settings,
  Lightbulb,
  Landmark,
  TrendingUp,
} from 'lucide-react';

import {
  Timestamp,
  collection,
  where,
  orderBy,
  query,
  getDocs,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import NotificationsPopover from '@/components/home/NotificationsPopover';
import AdMarquee from '@/components/home/AdMarquee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Quick Stats ---
const useQuickStats = (userId?: string) => {
  const [stats, setStats] = useState({
    todayTasks: 0,
    monthlyIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch Today's Tasks
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const tasksQuery = query(
          collection(db, `users/${userId}/tasks`),
          where('date', '>=', Timestamp.fromDate(startOfToday)),
          where('date', '<=', Timestamp.fromDate(endOfToday)),
          where('completed', '==', false)
        );
        const tasksSnap = await getDocs(tasksQuery);
        const todayTasks = tasksSnap.size;

        // Fetch Monthly Income
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const salesCollections = [
          'agriSales',
          'poultryEggSales',
          'poultrySales',
          'livestockSales',
        ];
        let totalIncome = 0;

        for (const coll of salesCollections) {
          const salesQuery = query(
            collection(db, `users/${userId}/${coll}`),
            where('date', '>=', Timestamp.fromDate(startOfMonth))
          );
          const salesSnap = await getDocs(salesQuery);
          salesSnap.forEach((doc) => {
            totalIncome += doc.data().totalAmount || 0;
          });
        }

        setStats({
          todayTasks,
          monthlyIncome: totalIncome,
        });
      } catch (error) {
        console.error('Error fetching quick stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};


// --- Main Home Page Component ---
export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const { stats: quickStats, loading: statsLoading } = useQuickStats(user?.uid);


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const quickAccessLinks = [
    {
      title: 'بنك الأفكار',
      href: '/ideas',
      icon: Lightbulb,
      color: 'bg-blue-500',
    },
    {
      title: 'عرض الميزانية',
      href: '/budget',
      icon: Landmark,
      color: 'bg-purple-500',
    },
    {
      title: 'المهام والتقويم',
      href: '/tasks',
      icon: CalendarCheck,
      color: 'bg-orange-500',
    },
    {
      title: 'إدارة الأقسام',
      href: '/management',
      icon: TrendingUp,
      color: 'bg-teal-500',
    },
  ];

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <main className="container mx-auto px-4 pt-4">
        <AdMarquee />
        {/* --- Header --- */}
        <header className="pt-8 mb-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-primary/50"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-md text-muted-foreground">أهلاً بعودتك،</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {user.displayName || 'مستخدمنا العزيز'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && <NotificationsPopover user={user} />}
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* --- Quick Stats --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                مهام اليوم
              </CardTitle>
              <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {quickStats.todayTasks}
                </div>
              )}
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                مهام غير مكتملة لهذا اليوم
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/50 dark:to-sky-950/50 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                دخل هذا الشهر
              </CardTitle>
              <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {quickStats.monthlyIncome.toFixed(3)}
                  <span className="text-lg font-normal"> د.ك</span>
                </div>
              )}
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                إجمالي المبيعات منذ بداية الشهر
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Quick Access --- */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3">وصول سريع</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickAccessLinks.map((link) => (
              <Link href={link.href} key={link.title}>
                <div
                  className={`p-4 rounded-lg text-white flex flex-col justify-between h-24 hover:scale-105 transition-transform duration-200 ${link.color}`}
                >
                  <link.icon className="h-6 w-6" />
                  <span className="font-semibold text-sm">{link.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
