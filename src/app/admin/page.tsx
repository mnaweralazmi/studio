
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Shield, Import } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import FirestoreDebugTest from '@/components/debug/firestore-debug';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [isMigrating, setIsMigrating] = React.useState(false);

    React.useEffect(() => {
        if (!loading && user?.role !== 'admin') {
            router.replace('/');
        }
    }, [user, loading, router]);

    const handleMigrateData = async () => {
        if (!user) return;
        setIsMigrating(true);
        toast({ title: "بدء عملية النقل...", description: "الرجاء الانتظار، قد تستغرق العملية بضع لحظات." });

        const batch = writeBatch(db);
        const adminUid = user.uid;
        let totalMigrated = 0;

        try {
            // Mapping old collections to new department-specific collections
            const collectionsToMigrate: { old: string; newPrefix: string; departmentId: string }[] = [
                { old: 'sales', newPrefix: 'agriculture', departmentId: 'agriculture' },
                { old: 'expenses', newPrefix: 'agriculture', departmentId: 'agriculture' },
                { old: 'debts', newPrefix: 'agriculture', departmentId: 'agriculture' },
            ];

            for (const { old: oldCollection, newPrefix, departmentId } of collectionsToMigrate) {
                const oldDataSnapshot = await getDocs(collection(db, oldCollection));
                oldDataSnapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    // IMPORTANT: We only migrate data that doesn't have an ownerId or belongs to the admin
                    if (!data.ownerId || data.ownerId === adminUid) {
                        const newCollectionName = `${newPrefix}_${oldCollection}`;
                        const newData: any = { ...data, ownerId: adminUid, departmentId };
                        const newDocRef = doc(db, 'users', adminUid, newCollectionName, docSnap.id);
                        batch.set(newDocRef, newData);
                        totalMigrated++;
                    }
                });
            }

            // Handle workers separately as they are not prefixed
            const workersSnapshot = await getDocs(collection(db, 'workers'));
            workersSnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (!data.ownerId || data.ownerId === adminUid) {
                    const newData = { ...data, ownerId: adminUid, departmentId: 'agriculture' };
                    const newDocRef = doc(db, 'users', adminUid, 'workers', docSnap.id);
                    batch.set(newDocRef, newData);
                    totalMigrated++;
                }
            });


            if (totalMigrated > 0) {
                await batch.commit();
                toast({
                    title: "نجحت عملية النقل!",
                    description: `تم نقل ${totalMigrated} سجل بنجاح إلى حسابك.`
                });
            } else {
                toast({
                    title: "لا توجد بيانات للنقل",
                    description: "لم يتم العثور على بيانات قديمة لنقلها."
                });
            }
        } catch (error) {
            console.error("Migration failed: ", error);
            toast({
                variant: "destructive",
                title: "فشلت عملية النقل",
                description: "حدث خطأ أثناء نقل البيانات. تحقق من الـ console."
            });
        } finally {
            setIsMigrating(false);
        }
    };

    if (loading || !user || user.role !== 'admin') {
        return (
            <main className="flex flex-1 flex-col items-center justify-center p-8">
                <Skeleton className="h-64 w-full max-w-2xl" />
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <div className="w-full">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary"/>
                        {t('adminDashboard')}
                    </h1>
                    <p className="text-muted-foreground">{t('adminDashboardDesc')}</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>نقل البيانات القديمة</CardTitle>
                        <CardDescription>
                            إذا كانت لديك بيانات في الإصدار القديم من التطبيق (في مجموعات عامة مثل 'sales' أو 'expenses')، يمكنك نقلها إلى حسابك الحالي. سيتم تعيينها إلى قسم "الزراعة" بشكل افتراضي.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            سيقوم هذا الإجراء بنسخ السجلات من المجموعات العامة وربطها بحسابك (UID: {user.uid}).
                        </p>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleMigrateData} disabled={isMigrating}>
                            <Import className="mr-2 h-4 w-4" />
                            {isMigrating ? "جاري النقل..." : "نقل البيانات القديمة الآن"}
                        </Button>
                    </CardFooter>
                </Card>

                <FirestoreDebugTest collectionName="sales" />
                <FirestoreDebugTest collectionName="expenses" />
                <FirestoreDebugTest collectionName="debts" />
                <FirestoreDebugTest collectionName="workers" />

            </div>
        </main>
    );
}
