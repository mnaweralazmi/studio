
"use client";

import * as React from 'react';
import { getDocs, query, collection, Timestamp, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import type { SalesItem } from '../budget-content';
import type { ExpenseItem } from '../expenses-content';
import type { DebtItem } from '../debts-content';
import type { Worker } from '../workers/types';
import { db } from '@/lib/firebase';
import type { Department } from '@/app/financials/page';

export async function getDataForUser<T extends { id: string, ownerId?: string }>(collectionName: string, userId: string): Promise<T[]> {
    const colRef = collection(db, collectionName);
    
    const q1 = query(colRef, where("ownerId", "==", userId));
    const snapshot = await getDocs(q1);

    if (!snapshot.empty) {
        return snapshot.docs.map(doc => {
            const data = doc.data();
            Object.keys(data).forEach(key => {
                if (data[key] instanceof Timestamp) {
                    data[key] = data[key].toDate();
                }
            });
            return { id: doc.id, ...data } as T;
        });
    }

    // Fallback for legacy data
    const q2 = query(colRef, where("ownerId", "==", null));
    const legacySnapshot = await getDocs(q2);
     if (!legacySnapshot.empty) {
        return legacySnapshot.docs.map(doc => {
            const data = doc.data();
            Object.keys(data).forEach(key => { if (data[key] instanceof Timestamp) { data[key] = data[key].toDate(); } });
            return { id: doc.id, ...data } as T;
        });
    }

    return [];
}


const departments: Department[] = ['agriculture', 'livestock', 'poultry', 'fish'];

export function BudgetSummary() {
    const { user: authUser, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = React.useState(true);
    const [summary, setSummary] = React.useState({
        totalSales: 0,
        totalExpenses: 0,
        totalDebts: 0,
        netProfit: 0,
    });
    

    const fetchAllData = React.useCallback(async () => {
        if (!authUser) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        try {
            let allSales: SalesItem[] = [];
            let allExpenses: ExpenseItem[] = [];
            let allDebts: DebtItem[] = [];
            let allWorkers: Worker[] = [];

            for (const deptId of departments) {
                 const [sales, expenses, debts, workers] = await Promise.all([
                    getDataForUser<SalesItem>(`${deptId}_sales`, authUser.uid),
                    getDataForUser<ExpenseItem>(`${deptId}_expenses`, authUser.uid),
                    getDataForUser<DebtItem>(`${deptId}_debts`, authUser.uid),
                    getDataForUser<Worker>(`${deptId}_workers`, authUser.uid)
                ]);
                allSales.push(...sales);
                allExpenses.push(...expenses);
                allDebts.push(...debts);
                allWorkers.push(...workers);
            }
            
            const totalSales = allSales.reduce((sum, doc) => sum + doc.total, 0);
            const totalExpensesItems = allExpenses.reduce((sum, doc) => sum + doc.amount, 0);
            
            const totalSalariesPaid = allWorkers.reduce((workerSum, worker) => {
                const salaries = (worker.transactions || [])
                    .filter(t => t.type === 'salary')
                    .reduce((sum, t) => sum + t.amount, 0);
                return workerSum + salaries;
            }, 0);
            
            const totalOutstandingDebts = allDebts
                .filter(d => d.status !== 'paid')
                .reduce((sum, item) => {
                    const paidAmount = (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
                    return sum + (item.amount - paidAmount);
                }, 0);

            const totalExpenses = totalExpensesItems + totalSalariesPaid;
            const netProfit = totalSales - totalExpenses;

            setSummary({ totalSales, totalExpenses, totalDebts: totalOutstandingDebts, netProfit });

        } catch (error) {
            console.error("Failed to fetch summary data", error);
        } finally {
            setIsLoading(false);
        }
    }, [authUser]);

    React.useEffect(() => {
        if (authUser) {
            fetchAllData();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [authUser, authLoading, fetchAllData]);


    if (isLoading || authLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('financialSummary')}</CardTitle>
                <CardDescription>{t('allDepartmentsSummaryDesc', {
                    departments: departments.map(d => t(`${d}Sales` as any)).join(', ')
                })}</CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
                            <ArrowUpCircle className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalSales.toFixed(2)} {t('dinar')}</div>
                            <p className="text-xs text-muted-foreground">{t('fromSales')}</p>
                        </CardContent>
                    </Card>
                        <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalExpenditure')}</CardTitle>
                            <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalExpenses.toFixed(2)} {t('dinar')}</div>
                            <p className="text-xs text-muted-foreground">{t('expensesAndSalaries')}</p>
                        </CardContent>
                    </Card>
                        <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('netProfit')}</CardTitle>
                            <DollarSign className={`h-5 w-5 ${summary.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{summary.netProfit.toFixed(2)} {t('dinar')}</div>
                            <p className="text-xs text-muted-foreground">{t('incomeVsExpenses')}</p>
                        </CardContent>
                    </Card>
                        <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('outstandingDebts')}</CardTitle>
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalDebts.toFixed(2)} {t('dinar')}</div>
                            <p className="text-xs text-muted-foreground">{t('totalUnpaidDebts')}</p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    )
}
