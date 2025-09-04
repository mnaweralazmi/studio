
"use client";

import * as React from 'react';
import { getDocs, Timestamp, query } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { userSubcollection } from '@/lib/firestore';
import type { SalesItem } from '../budget-content';
import type { ExpenseItem } from '../expenses-content';
import type { DebtItem, Payment } from '../debts-content';
import type { Worker, Transaction } from '../workers/types';

async function getSales(departmentId: string): Promise<SalesItem[]> {
    const salesCollectionRef = userSubcollection<Omit<SalesItem, 'id'>>('sales');
    const q = query(salesCollectionRef); // We will filter by departmentId on the client
    const querySnapshot = await getDocs(q);
    const allSales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesItem));
    return allSales.filter(sale => sale.departmentId === departmentId);
}

async function getExpenses(departmentId: string): Promise<ExpenseItem[]> {
    const expensesCollectionRef = userSubcollection<Omit<ExpenseItem, 'id'>>('expenses');
    const q = query(expensesCollectionRef);
    const querySnapshot = await getDocs(q);
    const allExpenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseItem));
    return allExpenses.filter(exp => exp.departmentId === departmentId);
}

async function getDebts(departmentId: string): Promise<DebtItem[]> {
    const debtsCollectionRef = userSubcollection<Omit<DebtItem, 'id'>>('debts');
    const querySnapshot = await getDocs(query(debtsCollectionRef));
    const allDebts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DebtItem));
    return allDebts.filter(debt => debt.departmentId === departmentId);
}

async function getWorkers(departmentId: string): Promise<Worker[]> {
    const workersColRef = userSubcollection<Omit<Worker, 'id'>>('workers');
    const workersSnapshot = await getDocs(query(workersColRef));
    const allWorkers = workersSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Worker));
    return allWorkers.filter(worker => worker.departmentId === departmentId);
}


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
    

    const fetchAllData = React.useCallback(async (deptId: string) => {
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
            
            let totalSalariesPaid = 0;
            workers.forEach(worker => {
                const salaries = (worker.transactions || [])
                    .filter(t => t.type === 'salary')
                    .reduce((sum, t) => sum + t.amount, 0);
                totalSalariesPaid += salaries;
            });
            
            let totalDebtPayments = 0;
            debts.forEach(debt => {
                 const paidAmount = (debt.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
                 totalDebtPayments += paidAmount;
            });

            const totalOutstandingDebts = debts
                .filter(d => d.status !== 'paid')
                .reduce((sum, item) => {
                    const paidAmount = (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
                    return sum + (item.amount - paidAmount);
                }, 0);

            const totalExpenses = totalExpensesItems + totalSalariesPaid + totalDebtPayments;
            const netProfit = totalSales - totalExpenses;

            setSummary({ totalSales, totalExpenses, totalDebts: totalOutstandingDebts, netProfit });

        } catch (error) {
            console.error("Failed to fetch summary data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const lastSelectedDept = localStorage.getItem('selectedDepartment') || 'agriculture';
        
        if (authUser) {
            fetchAllData(lastSelectedDept);
        } else if (!authLoading) {
            setIsLoading(false);
        }

        const handleDepartmentChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            const newDept = customEvent.detail || 'agriculture';
             if (authUser) {
                fetchAllData(newDept);
            }
        };
        
        window.addEventListener('departmentChanged', handleDepartmentChange);
        return () => window.removeEventListener('departmentChanged', handleDepartmentChange);
    }, [fetchAllData, authUser, authLoading]);


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
