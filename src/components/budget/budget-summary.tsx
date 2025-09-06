
"use client";

import * as React from 'react';
import { collection, onSnapshot, query, where, getDocs, DocumentData } from 'firebase/firestore';
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

const useAllDepartmentsData = <T extends DocumentData>(collectionSuffix: string): [T[], boolean] => {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = React.useState<T[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!user) {
            if (!authLoading) {
                setData([]);
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        const unsubscribes = departments.map(dept => {
            const collectionName = `${dept}_${collectionSuffix}`;
            const q = query(collection(db, 'users', user.uid, collectionName));
            return onSnapshot(q, () => {
                // When any department changes, refetch all data to recalculate totals
                fetchAllData();
            });
        });
        
        const fetchAllData = async () => {
            try {
                const allDataPromises = departments.map(async dept => {
                    const collectionName = `${dept}_${collectionSuffix}`;
                    const q = query(collection(db, 'users', user.uid, collectionName));
                    const snapshot = await getDocs(q);
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
                });
                
                const allDataArrays = await Promise.all(allDataPromises);
                setData(allDataArrays.flat());

            } catch (error) {
                console.error(`Error fetching ${collectionSuffix}:`, error);
                setData([]);
            } finally {
                 // Set loading to false only after the first fetch is complete.
                if(loading) setLoading(false);
            }
        };

        fetchAllData();

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, authLoading, collectionSuffix]);

    return [data, loading || authLoading];
};


export function BudgetSummary() {
    const { t } = useLanguage();
    
    const [allSales, salesLoading] = useAllDepartmentsData<SalesItem>('sales');
    const [allExpenses, expensesLoading] = useAllDepartmentsData<ExpenseItem>('expenses');
    const [allDebts, debtsLoading] = useAllDepartmentsData<DebtItem>('debts');
    const [allWorkers, workersLoading] = useAllDepartmentsData<Worker>('workers');

    const loading = salesLoading || expensesLoading || debtsLoading || workersLoading;

    const totalSales = React.useMemo(() => allSales.reduce((sum, item) => sum + item.total, 0), [allSales]);
    
    const totalExpenses = React.useMemo(() => allExpenses.reduce((sum, item) => sum + item.amount, 0), [allExpenses]);

    const totalSalaries = React.useMemo(() => allWorkers.reduce((workerSum, worker) => {
        const salaries = (worker.transactions || []).filter(t => t.type === 'salary').reduce((sum, t) => sum + t.amount, 0);
        return workerSum + salaries;
    }, 0), [allWorkers]);
    
    const totalDebts = React.useMemo(() => allDebts.filter(d => d.status !== 'paid').reduce((sum, item) => {
        const paidAmount = (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
        return sum + (item.amount - paidAmount);
    }, 0), [allDebts]);

    if (loading) {
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

    