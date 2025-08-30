
"use client";

import * as React from 'react';
import { useAuth, AppUser } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Leaf, PawPrint, Bird, Fish, Wallet, CreditCard, Landmark, Users } from 'lucide-react';

import { BudgetContent } from '@/components/budget-content';
import { ExpensesContent } from '@/components/expenses-content';
import { DebtsContent } from '@/components/debts-content';
import { WorkersContent } from '@/components/workers-content';

type Department = 'agriculture' | 'livestock' | 'poultry' | 'fish';

export default function AdminDashboardPage() {
    const { user: adminUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    
    const [users, setUsers] = React.useState<AppUser[]>([]);
    const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeDepartment, setActiveDepartment] = React.useState<Department>('agriculture');
    
    React.useEffect(() => {
        if (!authLoading && adminUser?.role !== 'admin') {
            router.replace('/');
        }
    }, [adminUser, authLoading, router]);

    React.useEffect(() => {
        const fetchUsers = async () => {
            if (adminUser?.role === 'admin') {
                try {
                    const q = query(collection(db, 'users'), orderBy('name'));
                    const querySnapshot = await getDocs(q);
                    const userList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
                    setUsers(userList);
                    if (userList.length > 0) {
                        setSelectedUserId(userList[0].uid);
                    }
                } catch (error) {
                    console.error("Failed to fetch users:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchUsers();
    }, [adminUser]);

    const handleDepartmentChange = (value: string) => {
        const department = value as Department;
        setActiveDepartment(department);
    };

    const departmentIcons: Record<Department, React.ElementType> = {
        agriculture: Leaf, livestock: PawPrint, poultry: Bird, fish: Fish,
    };
    
    const departmentTitles: Record<Department, string> = {
        agriculture: t('topicSoil'), livestock: t('livestockSales'), poultry: t('poultrySales'), fish: t('fishSales'),
    };
    
    if (authLoading || isLoading) {
        return (
            <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                     <Skeleton className="h-32 w-full" />
                     <Skeleton className="h-64 w-full" />
                </div>
            </main>
        )
    }
    
    if (adminUser?.role !== 'admin') return null;

    const selectedUserName = users.find(u => u.uid === selectedUserId)?.name || selectedUserId;

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('adminDashboard' as any)}</CardTitle>
                        <CardDescription>{t('adminDashboardDesc' as any)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Select onValueChange={setSelectedUserId} value={selectedUserId || undefined}>
                            <SelectTrigger className="w-full md:w-1/3">
                                <SelectValue placeholder={t('selectUser' as any)} />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(user => (
                                    <SelectItem key={user.uid} value={user.uid}>{user.name || user.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {selectedUserId && (
                    <>
                         <Card>
                            <CardHeader>
                                <CardTitle>{t('financialManagementFor' as any)} {selectedUserName}</CardTitle>
                                <CardDescription>{t('financialManagementDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activeDepartment} onValueChange={handleDepartmentChange} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                                        {(Object.keys(departmentIcons) as Department[]).map(dept => {
                                            const Icon = departmentIcons[dept];
                                            return (
                                                <TabsTrigger key={dept} value={dept} className="flex-col h-16 gap-1">
                                                    <Icon className="h-5 w-5" />
                                                    <span>{departmentTitles[dept]}</span>
                                                </TabsTrigger>
                                            )
                                        })}
                                    </TabsList>
                                </Tabs>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="sales" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="sales"><Wallet className="mr-2 h-4 w-4" />{t('sales')}</TabsTrigger>
                                <TabsTrigger value="expenses"><CreditCard className="mr-2 h-4 w-4" />{t('expenses')}</TabsTrigger>
                                <TabsTrigger value="debts"><Landmark className="mr-2 h-4 w-4" />{t('debts')}</TabsTrigger>
                                <TabsTrigger value="workers"><Users className="mr-2 h-4 w-4" />{t('workers')}</TabsTrigger>
                            </TabsList>
                            
                            <div className="mt-6 space-y-6">
                                <TabsContent value="sales">
                                    <BudgetContent departmentId={activeDepartment} userId={selectedUserId} />
                                </TabsContent>
                                <TabsContent value="expenses">
                                    <ExpensesContent departmentId={activeDepartment} userId={selectedUserId} />
                                </TabsContent>
                                <TabsContent value="debts">
                                    <DebtsContent departmentId={activeDepartment} userId={selectedUserId} />
                                </TabsContent>
                                <TabsContent value="workers">
                                    <WorkersContent departmentId={activeDepartment} userId={selectedUserId} />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </>
                )}

            </div>
        </main>
    );
}
