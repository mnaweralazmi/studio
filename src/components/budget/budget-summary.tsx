
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

async function getDataForUser<T extends { id: string, ownerId?: string }>(collectionName: string, userId: string, departmentId: string): Promise<T[]> {
    const colRef = collection(db, collectionName);
    
    // First query: Try to fetch data with ownerId and departmentId
    const q1 = query(colRef, where("ownerId", "==", userId), where("departmentId", "==", departmentId));
    let snapshot = await getDocs(q1);

    // Second query (fallback): If first is empty, try fetching just by departmentId (for legacy data)
    if (snapshot.empty) {
        const q2 = query(colRef, where("departmentId", "==", departmentId));
        const legacySnapshot = await getDocs(q2);
        const legacyDocs = legacySnapshot.docs.filter(doc => !doc.data().ownerId);
        if (legacyDocs.length > 0) {
             snapshot = legacySnapshot;
        }
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Timestamps to Dates for relevant fields
        Object.keys(data).forEach(key => {
            if (data[key] instanceof Timestamp) {
                data[key] = data[key].toDate();
            }
        });
        return { id: doc.id, ...data } as T;
    });
}


export function BudgetSummary({ departmentId }: { departmentId: string }) {
    const { user: authUser, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = React.useState(true);
    const [summary, setSummary] = React.useState({
        totalSales: 0,
        totalExpenses: 0,
        totalDebts: 0,
        netProfit: 0,
    });
    

    const fetchAllData = React.useCallback(async (deptId: string) => {
        if (!authUser) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        try {
            const [sales, expenses, debts, workers] = await Promise.all([
                getDataForUser<SalesItem>('sales', authUser.uid, deptId),
                getDataForUser<ExpenseItem>('expenses', authUser.uid, deptId),
                getDataForUser<DebtItem>('debts', authUser.uid, deptId),
                getDataForUser<Worker>('workers', authUser.uid, deptId)
            ]);
            
            const totalSales = sales.reduce((sum, doc) => sum + doc.total, 0);
            const totalExpensesItems = expenses.reduce((sum, doc) => sum + doc.amount, 0);
            
            const totalSalariesPaid = workers.reduce((workerSum, worker) => {
                const salaries = (worker.transactions || [])
                    .filter(t => t.type === 'salary')
                    .reduce((sum, t) => sum + t.amount, 0);
                return workerSum + salaries;
            }, 0);

            const totalDebtPaymentsMade = debts.reduce((debtSum, debt) => {
                const payments = (debt.payments || []).reduce((sum, p) => sum + p.amount, 0);
                return debtSum + payments;
            }, 0);

            const totalOutstandingDebts = debts
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
        if (authUser && departmentId) {
            fetchAllData(departmentId);
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [departmentId, authUser, authLoading, fetchAllData]);


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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('financialSummary')}</CardTitle>
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
        </div>
    )
}
