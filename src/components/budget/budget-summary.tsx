
"use client";

import * as React from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
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
    
    const [loading, setLoading] = React.useState(true);

    const fetchAllData = React.useCallback(async (userId: string) => {
        try {
            setLoading(true);
            let salesTotal = 0;
            let expensesTotal = 0;
            let debtsTotal = 0;
            let salariesTotal = 0;

            for (const dept of departments) {
                // Sales
                const salesSnapshot = await getDocs(collection(db, 'users', userId, `${dept}_sales`));
                salesTotal += salesSnapshot.docs.map(doc => doc.data() as SalesItem).reduce((sum, item) => sum + item.total, 0);

                // Expenses
                const expensesSnapshot = await getDocs(collection(db, 'users', userId, `${dept}_expenses`));
                expensesTotal += expensesSnapshot.docs.map(doc => doc.data() as ExpenseItem).reduce((sum, item) => sum + item.amount, 0);
                
                // Workers (Salaries)
                const workersSnapshot = await getDocs(collection(db, 'users', userId, `${dept}_workers`));
                salariesTotal += workersSnapshot.docs.map(doc => doc.data() as Worker).reduce((workerSum, worker) => {
                    const salaries = (worker.transactions || []).filter(t => t.type === 'salary').reduce((sum, t) => sum + t.amount, 0);
                    return workerSum + salaries;
                }, 0);

                // Debts
                const debtsSnapshot = await getDocs(collection(db, 'users', userId, `${dept}_debts`));
                debtsTotal += debtsSnapshot.docs.map(doc => doc.data() as DebtItem)
                    .filter(d => d.status !== 'paid')
                    .reduce((sum, item) => {
                        const paidAmount = (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
                        return sum + (item.amount - paidAmount);
                    }, 0);
            }

            setTotalSales(salesTotal);
            setTotalExpenses(expensesTotal);
            setTotalDebts(debtsTotal);
            setTotalSalaries(salariesTotal);
        } catch (error) {
            console.error("Error fetching budget summary:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!authUser) {
            if (!authLoading) setLoading(false);
            return;
        }
        
        fetchAllData(authUser.uid);

        // Set up listeners for real-time updates
        const unsubscribes = departments.flatMap(dept => [
            onSnapshot(collection(db, 'users', authUser.uid, `${dept}_sales`), () => fetchAllData(authUser.uid)),
            onSnapshot(collection(db, 'users', authUser.uid, `${dept}_expenses`), () => fetchAllData(authUser.uid)),
            onSnapshot(collection(db, 'users', authUser.uid, `${dept}_workers`), () => fetchAllData(authUser.uid)),
            onSnapshot(collection(db, 'users', authUser.uid, `${dept}_debts`), () => fetchAllData(authUser.uid)),
        ]);

        return () => unsubscribes.forEach(unsub => unsub());

    }, [authUser, authLoading, fetchAllData]);


    if (loading || authLoading) {
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
