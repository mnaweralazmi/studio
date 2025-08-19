
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Users, BadgeCheck, Banknote } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { AddWorkerDialog } from '@/components/workers/add-worker-dialog';
import { SalaryPaymentDialog } from '@/components/workers/salary-payment-dialog';
import { FinancialRecordDialog } from '@/components/workers/financial-record-dialog';
import { DeleteWorkerAlert } from '@/components/workers/delete-worker-alert';
import type { Worker, Transaction, TransactionFormValues } from '@/components/workers/types';
import { useAuth } from '@/context/auth-context';

const monthsAr = [ { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' }, { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' }, { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' }, { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' } ];
const monthsEn = [ { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' }, { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' }, { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' }, { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' } ];

export default function WorkersPage() {
    const [workers, setWorkers] = React.useState<Worker[]>([]);
    const { toast } = useToast();
    const { user, loading } = useAuth();
    const { language, t } = useLanguage();
    const months = language === 'ar' ? monthsAr : monthsEn;


    React.useEffect(() => {
        if (user && !loading) {
            const workersKey = `workers_${user.uid}`;
            const storedWorkers = localStorage.getItem(workersKey);
            if (storedWorkers) {
                const parsedWorkers = JSON.parse(storedWorkers).map((w: any) => ({
                    ...w,
                    baseSalary: w.baseSalary || 0,
                    paidMonths: w.paidMonths || [],
                    transactions: w.transactions || [],
                }));
                setWorkers(parsedWorkers);
            }
        }
    }, [user, loading]);

    React.useEffect(() => {
        if (user && !loading) {
            const workersKey = `workers_${user.uid}`;
            localStorage.setItem(workersKey, JSON.stringify(workers));
        }
    }, [workers, user, loading]);
    

    function addWorker(data: Omit<Worker, 'id' | 'paidMonths' | 'transactions'>) {
        const workerExists = workers.some(w => w.name.toLowerCase() === data.name.toLowerCase());
        if (workerExists) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('workerExistsError')
            });
            return;
        }

        const newWorker: Worker = {
            id: crypto.randomUUID(),
            name: data.name,
            baseSalary: data.baseSalary,
            paidMonths: [],
            transactions: [],
        };
        setWorkers(prev => [...prev, newWorker]);
        toast({ title: t('workerAddedSuccess') });
    }

    function deleteWorker(workerId: string) {
        setWorkers(prev => prev.filter(w => w.id !== workerId));
        toast({ variant: "destructive", title: t('workerDeleted') });
    }

    function handleSalaryPayment(workerId: string, month: number, year: number, amount: number) {
        setWorkers(prev => prev.map(w => {
            if (w.id === workerId) {
                const newTransaction: Transaction = {
                    id: crypto.randomUUID(),
                    type: 'salary',
                    amount: amount,
                    date: new Date().toISOString(),
                    month,
                    year,
                    description: `${t('salaryForMonth')} ${months.find(m => m.value === month)?.label} ${year}`
                };
                return {
                    ...w,
                    paidMonths: [...w.paidMonths, { year, month }],
                    transactions: [...w.transactions, newTransaction],
                };
            }
            return w;
        }));
        toast({ title: t('salaryPaidSuccess') });
    }

    function handleAddTransaction(workerId: string, transaction: TransactionFormValues) {
         setWorkers(prev => prev.map(w => {
            if (w.id === workerId) {
                const newTransaction: Transaction = {
                    id: crypto.randomUUID(),
                    type: transaction.type,
                    amount: transaction.amount,
                    date: new Date().toISOString(),
                    description: transaction.description,
                };
                return {
                    ...w,
                    transactions: [...w.transactions, newTransaction],
                };
            }
            return w;
        }));
        toast({ title: t('transactionAddedSuccess') });
    }
  
    const getWorkerBalance = (worker: Worker) => {
        return (worker.transactions || []).reduce((acc, t) => {
             if (t.type === 'bonus') return acc + t.amount;
             if (t.type === 'deduction' || t.type === 'salary') return acc - t.amount;
             return acc;
        }, 0);
    }
    
    const getMonthStatus = (worker: Worker, month: number, year: number) => {
        return worker.paidMonths.some(p => p.month === month && p.year === year);
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const totalUnpaidSalariesThisMonth = workers
        .filter(w => !getMonthStatus(w, currentMonth, currentYear))
        .reduce((sum, w) => sum + w.baseSalary, 0);

    const totalSalariesThisYear = workers.reduce((total, worker) => {
        const yearSalaries = (worker.transactions || [])
            .filter(t => t.type === 'salary' && t.year === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);
        return total + yearSalaries;
    }, 0);

    if (loading) {
      return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
    }

    return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    {t('workersAndSalaries')}
                </CardTitle>
                <CardDescription>
                    {t('workersAndSalariesDesc')}
                </CardDescription>
            </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalWorkers')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{workers.length}</div>
                    <p className="text-xs text-muted-foreground">{t('totalWorkersDesc')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalSalariesPaidThisYear')}</CardTitle>
                    <Banknote className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{totalSalariesThisYear.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('totalSalariesPaidThisYearDesc')} {currentYear}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('unpaidSalariesThisMonth')}</CardTitle>
                    <Banknote className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{totalUnpaidSalariesThisMonth.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('unpaidSalariesThisMonthDesc')} {months.find(m => m.value === currentMonth)?.label}</p>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl">{t('workersList')}</CardTitle>
                <AddWorkerDialog onAdd={addWorker} />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('workerName')}</TableHead>
                      <TableHead>{t('baseSalary')}</TableHead>
                       <TableHead>{t('currentMonthSalaryStatus')}</TableHead>
                       <TableHead>{t('totalBalance')}</TableHead>
                      <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>{t('tableActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.length > 0 ? workers.map((worker) => {
                      const isPaidThisMonth = getMonthStatus(worker, currentMonth, currentYear);
                      const balance = getWorkerBalance(worker);
                      return (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{(worker.baseSalary || 0).toFixed(2)} {t('dinar')}</TableCell>
                        <TableCell>
                           <BadgeCheck className={`h-5 w-5 ${isPaidThisMonth ? 'text-green-600' : 'text-muted-foreground'}`}/>
                        </TableCell>
                        <TableCell className={`font-mono ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {balance.toFixed(2)} {t('dinar')}
                        </TableCell>
                        <TableCell className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                            <SalaryPaymentDialog worker={worker} onConfirm={handleSalaryPayment} />
                            <FinancialRecordDialog worker={worker} onAddTransaction={handleAddTransaction} />
                            <DeleteWorkerAlert workerName={worker.name} onConfirm={() => deleteWorker(worker.id)} />
                        </TableCell>
                      </TableRow>
                    )}) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                {t('noWorkersYet')}
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
      </div>
    </main>
  );
}
