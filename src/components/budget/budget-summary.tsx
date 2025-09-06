
"use client";

import * as React from 'react';
import { getDocs, query, collection, Timestamp, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import type { SalesItem } from '../budget-content';
import type { ExpenseItem } from '../expenses-content';
import type { DebtItem } from '../debts-content';
import type { Worker } from '../workers/types';
import { db } from '@/lib/firebase';
import type { Department } from '@/app/financials/page';

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
    
    React.useEffect(() => {
        if (!authUser) {
            if (!authLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        const fetchAllData = async () => {
             if (!authUser) return;

            try {
                const allSalesPromises = departments.map(deptId => 
                    getDocs(query(collection(db, 'users', authUser.uid, `${deptId}_sales`)))
                );
                const allExpensesPromises = departments.map(deptId => 
                    getDocs(query(collection(db, 'users', authUser.uid, `${deptId}_expenses`)))
                );
                const allDebtsPromises = departments.map(deptId => 
                    getDocs(query(collection(db, 'users', authUser.uid, `${deptId}_debts`)))
                );
                const allWorkersPromises = departments.map(deptId => 
                    getDocs(query(collection(db, 'users', authUser.uid, `${deptId}_workers`)))
                );

                const [salesSnaps, expensesSnaps, debtsSnaps, workersSnaps] = await Promise.all([
                    Promise.all(allSalesPromises),
                    Promise.all(allExpensesPromises),
                    Promise.all(allDebtsPromises),
                    Promise.all(allWorkersPromises),
                ]);

                const allSales = salesSnaps.flatMap(snap => snap.docs.map(doc => doc.data() as SalesItem));
                const allExpenses = expensesSnaps.flatMap(snap => snap.docs.map(doc => doc.data() as ExpenseItem));
                const allDebts = debtsSnaps.flatMap(snap => snap.docs.map(doc => {
                    const data = doc.data();
                    return { ...data, payments: (data.payments || []).map((p: any) => ({...p, date: (p.date as Timestamp).toDate()})) } as DebtItem;
                }));
                const allWorkers = workersSnaps.flatMap(snap => snap.docs.map(doc => doc.data() as Worker));
                
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
        };

        
        const collectionNames = departments.flatMap(deptId => [`${deptId}_sales`, `${deptId}_expenses`, `${deptId}_debts`, `${deptId}_workers`]);
        const unsubscribes = collectionNames.map(colName => {
            const q = query(collection(db, 'users', authUser.uid, colName));
            return onSnapshot(q, fetchAllData, (err) => console.error(`Listener failed for ${colName}:`, err));
        });


        return () => unsubscribes.forEach(unsub => unsub());

    }, [authUser, authLoading]);


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
    )
}
