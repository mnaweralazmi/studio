
"use client";

import * as React from 'react';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/context/app-context';

export function BudgetSummary() {
    const { t } = useLanguage();
    const { allSales, allExpenses, allDebts, allWorkers, loading } = useAppContext();

    const totalSales = React.useMemo(() => (allSales || []).reduce((sum, item) => sum + item.total, 0), [allSales]);
    
    const totalExpenses = React.useMemo(() => (allExpenses || []).reduce((sum, item) => sum + item.amount, 0), [allExpenses]);

    const totalSalariesPaid = React.useMemo(() => (allWorkers || []).reduce((workerSum, worker) => {
        const salaries = (worker.transactions || []).filter(t => t.type === 'salary').reduce((sum, t) => sum + t.amount, 0);
        return workerSum + salaries;
    }, 0), [allWorkers]);
    
    const totalDebts = React.useMemo(() => (allDebts || []).filter(d => d.status !== 'paid').reduce((sum, item) => {
        const paidAmount = (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
        return sum + (item.amount - paidAmount);
    }, 0), [allDebts]);
    
    const totalExpenditure = totalExpenses + totalSalariesPaid;
    const netProfit = totalSales - totalExpenditure;

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
