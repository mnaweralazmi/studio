
"use client";

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import type { SalesItem } from '../budget-content';
import type { ExpenseItem } from '../expenses-content';
import type { DebtItem, Payment } from '../debts-content';
import type { Worker, Transaction } from '../workers/types';

export function BudgetSummary() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = React.useState(true);
    const [summary, setSummary] = React.useState({
        totalSales: 0,
        totalExpenses: 0,
        totalDebts: 0,
        netProfit: 0,
    });

    React.useEffect(() => {
        const fetchAllData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch Sales
                const salesSnapshot = await getDocs(collection(db, 'users', user.uid, 'sales'));
                const totalSales = salesSnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);

                // Fetch Expenses
                const expensesSnapshot = await getDocs(collection(db, 'users', user.uid, 'expenses'));
                const totalExpensesItems = expensesSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
                
                // Fetch Workers and Transactions to calculate salaries paid
                const workersSnapshot = await getDocs(collection(db, 'users', user.uid, 'workers'));
                let totalSalariesPaid = 0;
                for (const workerDoc of workersSnapshot.docs) {
                    const transactionsSnapshot = await getDocs(collection(db, 'users', user.uid, 'workers', workerDoc.id, 'transactions'));
                    const salaries = transactionsSnapshot.docs
                        .map(doc => doc.data() as Transaction)
                        .filter(t => t.type === 'salary')
                        .reduce((sum, t) => sum + t.amount, 0);
                    totalSalariesPaid += salaries;
                }
                
                // Fetch Debts and Debt Payments
                const debtsSnapshot = await getDocs(collection(db, 'users', user.uid, 'debts'));
                let totalDebts = 0;
                let totalDebtPayments = 0;

                for(const debtDoc of debtsSnapshot.docs) {
                    const debtData = debtDoc.data();
                    const paymentsSnapshot = await getDocs(collection(db, 'users', user.uid, 'debts', debtDoc.id, 'payments'));
                    const payments = paymentsSnapshot.docs.map(pDoc => pDoc.data() as Payment);

                    const paidAmount = payments.reduce((pSum, p) => pSum + p.amount, 0);
                    totalDebtPayments += paidAmount;
                    
                    if (debtData.status !== 'paid') {
                        totalDebts += (debtData.amount - paidAmount);
                    }
                }


                const totalExpenses = totalExpensesItems + totalSalariesPaid + totalDebtPayments;
                const netProfit = totalSales - totalExpenses;

                setSummary({ totalSales, totalExpenses, totalDebts, netProfit });

            } catch (error) {
                console.error("Failed to fetch summary data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [user]);

    if (isLoading) {
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
                    <CardContent className="pt-6">
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
                </CardHeader>
            </Card>
        </div>
    )
}
