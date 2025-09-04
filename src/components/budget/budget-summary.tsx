
"use client";

import * as React from 'react';
import { getDocs, query, collection, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { userSubcollection } from '@/lib/firestore';
import type { SalesItem } from '../budget-content';
import type { ExpenseItem } from '../expenses-content';
import type { DebtItem } from '../debts-content';
import type { Worker, Transaction } from '../workers/types';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';


async function getSales(departmentId: string): Promise<SalesItem[]> {
    const salesCollectionRef = userSubcollection<Omit<SalesItem, 'id'>>('sales');
    const q = query(salesCollectionRef);
    const querySnapshot = await getDocs(q);
    const allSales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: (doc.data().date as unknown as Timestamp).toDate() } as SalesItem));
    return allSales.filter(sale => sale.departmentId === departmentId);
}

async function getExpenses(departmentId: string): Promise<ExpenseItem[]> {
    const expensesCollectionRef = userSubcollection<Omit<ExpenseItem, 'id'>>('expenses');
    const q = query(expensesCollectionRef);
    const querySnapshot = await getDocs(q);
    const allExpenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: (doc.data().date as unknown as Timestamp).toDate() } as ExpenseItem));
    return allExpenses.filter(exp => exp.departmentId === departmentId);
}

async function getDebts(departmentId: string): Promise<DebtItem[]> {
    const debtsCollectionRef = userSubcollection<Omit<DebtItem, 'id'>>('debts');
    const querySnapshot = await getDocs(query(debtsCollectionRef));
    const allDebts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), dueDate: doc.data().dueDate ? (doc.data().dueDate as unknown as Timestamp).toDate() : undefined } as DebtItem));
    return allDebts.filter(debt => debt.departmentId === departmentId);
}

async function getWorkers(departmentId: string): Promise<Worker[]> {
    const workersColRef = userSubcollection<Omit<Worker, 'id'>>('workers');
    const workersSnapshot = await getDocs(query(workersColRef));
    
    const workerPromises = workersSnapshot.docs
        .filter(docSnap => docSnap.data().departmentId === departmentId)
        .map(async (docSnap) => {
            const data = docSnap.data();
            const transactionsColRef = collection(db, 'users', auth.currentUser!.uid, 'workers', docSnap.id, 'transactions');
            const transactionsSnapshot = await getDocs(transactionsColRef);
            const transactions: Transaction[] = transactionsSnapshot.docs.map(tDoc => ({ 
                id: tDoc.id, 
                ...tDoc.data(),
                date: (tDoc.data().date as Timestamp).toDate().toISOString(),
            })) as Transaction[];

            return {
                id: docSnap.id,
                ...data,
                transactions,
            } as Worker;
        });

    return Promise.all(workerPromises);
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
                getSales(deptId),
                getExpenses(deptId),
                getDebts(deptId),
                getWorkers(deptId)
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

            const totalExpenses = totalExpensesItems + totalSalariesPaid + totalDebtPaymentsMade;
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
