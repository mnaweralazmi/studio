
"use client";

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { getSales } from '@/lib/api/sales';
import { getExpenses } from '@/lib/api/expenses';
import { getDebts } from '@/lib/api/debts';
import { getWorkers } from '@/lib/api/workers';

export function BudgetSummary() {
    const { user: authUser, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = React.useState(true);
    const [departmentId, setDepartmentId] = React.useState<string>('agriculture');
    const [summary, setSummary] = React.useState({
        totalSales: 0,
        totalExpenses: 0,
        totalDebts: 0,
        netProfit: 0,
    });
    
    const targetUserId = authUser?.uid;

    const fetchAllData = React.useCallback(async (deptId: string, userId: string) => {
        setIsLoading(true);

        try {
            const sales = await getSales(userId, deptId);
            const expenses = await getExpenses(userId, deptId);
            const debts = await getDebts(userId, deptId);
            const workers = await getWorkers(userId, deptId);

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
        setDepartmentId(lastSelectedDept);
        
        if (targetUserId) {
            fetchAllData(lastSelectedDept, targetUserId);
        } else if (!authLoading) {
            setIsLoading(false);
        }

        const handleDepartmentChange = () => {
            const newDept = localStorage.getItem('selectedDepartment') || 'agriculture';
            setDepartmentId(newDept);
            if (targetUserId) {
                fetchAllData(newDept, targetUserId);
            }
        };
        
        window.addEventListener('departmentChanged', handleDepartmentChange);
        return () => window.removeEventListener('departmentChanged', handleDepartmentChange);
    }, [fetchAllData, targetUserId, authLoading]);


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
