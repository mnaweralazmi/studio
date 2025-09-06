
"use client";

import * as React from 'react';
import { collection, Timestamp, where, onSnapshot, query } from 'firebase/firestore';
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
    
    const [totalSales, setTotalSales] = React.useState(0);
    const [totalExpenses, setTotalExpenses] = React.useState(0);
    const [totalDebts, setTotalDebts] = React.useState(0);
    const [totalSalaries, setTotalSalaries] = React.useState(0);
    
    const [loadingSales, setLoadingSales] = React.useState(true);
    const [loadingExpenses, setLoadingExpenses] = React.useState(true);
    const [loadingDebts, setLoadingDebts] = React.useState(true);
    const [loadingWorkers, setLoadingWorkers] = React.useState(true);

    const isLoading = loadingSales || loadingExpenses || loadingDebts || loadingWorkers;

    // Fetch Sales
    React.useEffect(() => {
        if (!authUser) {
            if (!authLoading) setLoadingSales(false);
            return;
        }
        const unsubscribes = departments.map(deptId => {
            const q = query(
                collection(db, 'users', authUser.uid, `${deptId}_sales`),
                where("ownerId", "==", authUser.uid)
            );
            return onSnapshot(q, () => { // Re-fetch all sales on any change
                Promise.all(departments.map(d => 
                    query(collection(db, 'users', authUser.uid, `${d}_sales`), where("ownerId", "==", authUser.uid))
                )).then(async (queries) => {
                    const snaps = await Promise.all(queries.map(q => onSnapshot(q, ()=>{
                    })));

                    let currentTotal = 0;
                     for (const snap of snaps) {
                        // const salesItems = snap.docs.map(doc => doc.data() as SalesItem);
                        // currentTotal += salesItems.reduce((sum, item) => sum + item.total, 0);
                    }
                    setTotalSales(currentTotal);
                    setLoadingSales(false);
                });
            });
        });
        return () => unsubscribes.forEach(unsub => unsub());
    }, [authUser, authLoading]);

    // Fetch Expenses
    React.useEffect(() => {
        if (!authUser) {
             if (!authLoading) setLoadingExpenses(false);
            return;
        }
        const unsubscribes = departments.map(deptId => {
            const q = query(collection(db, 'users', authUser.uid, `${deptId}_expenses`), where("ownerId", "==", authUser.uid));
            return onSnapshot(q, () => {
                 Promise.all(departments.map(d => 
                    query(collection(db, 'users', authUser.uid, `${d}_expenses`), where("ownerId", "==", authUser.uid))
                )).then(async (queries) => {
                    const snaps = await Promise.all(queries.map(q => onSnapshot(q, ()=>{})));
                    let currentTotal = 0;
                    for (const snap of snaps) {
                        // const expenseItems = snap.docs.map(doc => doc.data() as ExpenseItem);
                        // currentTotal += expenseItems.reduce((sum, item) => sum + item.amount, 0);
                    }
                    setTotalExpenses(currentTotal);
                    setLoadingExpenses(false);
                });
            });
        });
        return () => unsubscribes.forEach(unsub => unsub());
    }, [authUser, authLoading]);
    
     // Fetch Workers (for salaries)
    React.useEffect(() => {
        if (!authUser) {
            if (!authLoading) setLoadingWorkers(false);
            return;
        }
        const unsubscribes = departments.map(deptId => {
            const q = query(collection(db, 'users', authUser.uid, `${deptId}_workers`), where("ownerId", "==", authUser.uid));
            return onSnapshot(q, () => {
                Promise.all(departments.map(d => 
                    query(collection(db, 'users', authUser.uid, `${d}_workers`), where("ownerId", "==", authUser.uid))
                )).then(async (queries) => {
                    const snaps = await Promise.all(queries.map(q => onSnapshot(q, ()=>{})));
                    let totalSalariesPaid = 0;
                    for (const snap of snaps) {
                        // const workers = snap.docs.map(doc => doc.data() as Worker);
                        // totalSalariesPaid += workers.reduce((workerSum, worker) => {
                        //     const salaries = (worker.transactions || [])
                        //         .filter(t => t.type === 'salary')
                        //         .reduce((sum, t) => sum + t.amount, 0);
                        //     return workerSum + salaries;
                        // }, 0);
                    }
                    setTotalSalaries(totalSalariesPaid);
                    setLoadingWorkers(false);
                });
            });
        });
        return () => unsubscribes.forEach(unsub => unsub());
    }, [authUser, authLoading]);


    // Fetch Debts
    React.useEffect(() => {
        if (!authUser) {
            if (!authLoading) setLoadingDebts(false);
            return;
        }
        const unsubscribes = departments.map(deptId => {
            const q = query(collection(db, 'users', authUser.uid, `${deptId}_debts`), where("ownerId", "==", authUser.uid));
            return onSnapshot(q, () => {
                 Promise.all(departments.map(d => 
                    query(collection(db, 'users', authUser.uid, `${d}_debts`), where("ownerId", "==", authUser.uid))
                )).then(async (queries) => {
                    const snaps = await Promise.all(queries.map(q => onSnapshot(q,()=>{})));
                    let totalOutstanding = 0;
                    for (const snap of snaps) {
                        // const debtItems = snap.docs.map(doc => doc.data() as DebtItem);
                        // totalOutstanding += debtItems
                        //     .filter(d => d.status !== 'paid')
                        //     .reduce((sum, item) => {
                        //         const paidAmount = (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
                        //         return sum + (item.amount - paidAmount);
                        //     }, 0);
                    }
                    setTotalDebts(totalOutstanding);
                    setLoadingDebts(false);
                });
            });
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
    
    const totalExpenditure = totalExpenses + totalSalaries;
    const netProfit = totalSales - totalExpenditure;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSales.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('fromSales')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalExpenditure')}</CardTitle>
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalExpenditure.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('expensesAndSalaries')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('netProfit')}</CardTitle>
                    <DollarSign className={`h-5 w-5 ${netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netProfit.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('incomeVsExpenses')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('outstandingDebts')}</CardTitle>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalDebts.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('totalUnpaidDebts')}</p>
                </CardContent>
            </Card>
        </div>
    )
}

    