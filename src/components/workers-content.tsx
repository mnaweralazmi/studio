
"use client";

import * as React from 'react';
import { collection, addDoc, doc, Timestamp, writeBatch, updateDoc, arrayUnion } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Users, BadgeCheck, Banknote, FileText, PlusCircle, Edit } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { AddWorkerDialog } from '@/components/workers/add-worker-dialog';
import { SalaryPaymentDialog } from '@/components/workers/salary-payment-dialog';
import { FinancialRecordDialog } from '@/components/workers/financial-record-dialog';
import { DeleteWorkerAlert } from '@/components/workers/delete-worker-alert';
import { useAppContext } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import type { Department, Worker, Transaction, TransactionFormValues, WorkerFormValues, PaidMonth } from '@/lib/types';


const monthsAr = [ { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' }, { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' }, { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' }, { value: 10, label: 'أكتوبر' }, { value: 11, 'label': 'نوفمبر' }, { value: 12, label: 'ديسمبر' } ];
const monthsEn = [ { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' }, { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' }, { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' }, { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' } ];

async function addWorker(data: Omit<Worker, 'id' | 'paidMonths' | 'transactions'>): Promise<string> {
    const workersColRef = collection(db, 'workers');
    const docRef = await addDoc(workersColRef, {
        ...data,
        paidMonths: [],
        transactions: [],
    });
    return docRef.id;
}

async function updateWorker(workerId: string, data: Partial<WorkerFormValues>) {
    const workerDocRef = doc(db, 'workers', workerId);
    await updateDoc(workerDocRef, data);
}

async function paySalary(workerId: string, paidMonth: PaidMonth, transactionData: Omit<Transaction, 'id' | 'date'>) {
    const workerRef = doc(db, 'workers', workerId);
    const newTransaction = { 
        ...transactionData, 
        id: new Date().toISOString() + Math.random(),
        date: Timestamp.now(), 
    };
    await updateDoc(workerRef, {
        paidMonths: arrayUnion(paidMonth),
        transactions: arrayUnion(newTransaction)
    });
}

async function addTransaction(workerId: string, transactionData: Omit<Transaction, 'id' | 'date' | 'month' | 'year'>) {
    const workerRef = doc(db, 'workers', workerId);
    const newTransaction = {
        ...transactionData,
        id: new Date().toISOString() + Math.random(),
        date: Timestamp.now(),
    };
    await updateDoc(workerRef, {
        transactions: arrayUnion(newTransaction)
    });
}

async function deleteWorker(workerId: string) {
    const workerDocRef = doc(db, 'workers', workerId);
    const batch = writeBatch(db);
    batch.delete(workerDocRef);
    await batch.commit();
}


interface WorkersContentProps {
    departmentId: Department;
}

export function WorkersContent({ departmentId }: WorkersContentProps) {
    const { user, allWorkers, loading } = useAppContext();

    const { toast } = useToast();
    const { language, t } = useLanguage();
    const months = language === 'ar' ? monthsAr : monthsEn;

    const workers = React.useMemo(() => {
        const list = Array.isArray(allWorkers) ? allWorkers : [];
        return list.filter(worker => worker?.departmentId === departmentId);
    }, [allWorkers, departmentId]);
    

    async function handleSaveWorker(data: WorkerFormValues, workerId?: string) {
        if (!user) {
             toast({ variant: "destructive", title: t('error'), description: "You cannot manage workers for this user." });
            return;
        }

        const workerExists = workers.some(w => w.name.toLowerCase() === data.name.toLowerCase() && w.id !== workerId);
        if (workerExists) {
            toast({ variant: "destructive", title: t('error'), description: t('workerExistsError') });
            return;
        }

        try {
            if (workerId) {
                await updateWorker(workerId, data);
                toast({ title: t('workerUpdatedSuccess') });
            } else {
                const newWorkerData = { ...data, ownerId: user.uid, departmentId: departmentId };
                await addWorker(newWorkerData);
                toast({ title: t('workerAddedSuccess') });
            }
        } catch (e) {
            console.error("Error saving worker: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save worker data." });
        }
    }
    
    async function handleSalaryPayment(workerId: string, month: number, year: number, amount: number) {
        if (!user) return;
        try {
            const transaction: Omit<Transaction, 'id'|'date'> = {
                type: 'salary',
                amount: amount,
                description: `${t('salaryForMonth')} ${months.find(m => m.value === month)?.label || ''} ${year}`,
                month,
                year,
            };
            await paySalary(workerId, {year, month}, transaction);
            toast({ title: t('salaryPaidSuccess') });
        } catch (e) {
            console.error("Error paying salary: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to record salary payment." });
        }
    }

    async function handleAddTransaction(workerId: string, transaction: TransactionFormValues) {
        if (!user) return;
        
        try {
            const newTransactionData: Omit<Transaction, 'id' | 'date' | 'month' | 'year'> = {
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description,
            };

            await addTransaction(workerId, newTransactionData);
            toast({ title: t('transactionAddedSuccess') });

        } catch (e) {
            console.error("Error adding transaction: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to add transaction." });
        }
    }

    async function handleDeleteWorker(workerId: string) {
        if(!user) return;
        try {
            await deleteWorker(workerId);
            toast({ title: t('workerDeleted') });
        } catch(e) {
            console.error("Error deleting worker: ", e);
             toast({ variant: "destructive", title: t('error'), description: t('workerDeleted') });
        }
    }
  
    const getWorkerBalance = (worker: Worker) => {
        let balance = 0;
        (worker.transactions || []).forEach(t => {
            if (t.type === 'bonus') {
                balance += t.amount;
            } else if (t.type === 'deduction' || t.type === 'salary') {
                balance -= t.amount;
            }
        });
        return balance;
    }
    
    const getMonthStatus = (worker: Worker, month: number, year: number) => {
        return (worker.paidMonths || []).some(p => p.month === month && p.year === year);
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
    
    const totalAnnualBaseSalaries = workers.reduce((sum, worker) => sum + (worker.baseSalary * 12), 0);

    if (loading) {
        return (
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-16 w-full" /></CardHeader></Card>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
                <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        )
    }

    return (
    <div className="space-y-6">
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
        
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                    <CardTitle className="text-sm font-medium">{t('totalAnnualSalaries')}</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalAnnualBaseSalaries.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('totalAnnualSalariesDesc')}</p>
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
                <AddWorkerDialog onSave={handleSaveWorker} departmentId={departmentId}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('addNewWorker')}
                    </Button>
                </AddWorkerDialog>
            </CardHeader>
            <CardContent>
                {workers.length > 0 ? (
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
                                {workers.map((worker) => {
                                const isPaidThisMonth = getMonthStatus(worker, currentMonth, currentYear);
                                const balance = getWorkerBalance(worker);
                                return (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium">{worker.name}</TableCell>
                                    <TableCell>{(worker.baseSalary || 0).toFixed(2)} {t('dinar')} {t('monthly')}</TableCell>
                                    <TableCell>
                                        <BadgeCheck className={`h-5 w-5 ${isPaidThisMonth ? 'text-green-600' : 'text-muted-foreground'}`}/>
                                    </TableCell>
                                    <TableCell className={`font-mono ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {balance.toFixed(2)} {t('dinar')}
                                    </TableCell>
                                    <TableCell>
                                        <div className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                                            <SalaryPaymentDialog worker={worker} onConfirm={handleSalaryPayment} />
                                            <FinancialRecordDialog worker={worker} onAddTransaction={handleAddTransaction} />
                                            <AddWorkerDialog worker={worker} onSave={handleSaveWorker} departmentId={departmentId}>
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                            </AddWorkerDialog>
                                            <DeleteWorkerAlert workerName={worker.name} onConfirm={() => handleDeleteWorker(worker.id)} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">{t('noWorkersYet')}</p>
                )}
            </CardContent>
        </Card>
      </div>
    );
}


    