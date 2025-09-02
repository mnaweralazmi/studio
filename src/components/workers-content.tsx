
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Users, BadgeCheck, Banknote, FileText, PlusCircle, Pencil } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { AddWorkerDialog } from '@/components/workers/add-worker-dialog';
import { SalaryPaymentDialog } from '@/components/workers/salary-payment-dialog';
import { FinancialRecordDialog } from '@/components/workers/financial-record-dialog';
import { DeleteWorkerAlert } from '@/components/workers/delete-worker-alert';
import type { Worker, Transaction, TransactionFormValues, WorkerFormValues } from '@/components/workers/types';
import { useAuth } from '@/context/auth-context';
import { collection, getDocs, doc, addDoc, deleteDoc, writeBatch, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const monthsAr = [ { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' }, { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' }, { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' }, { value: 10, label: 'أكتوبر' }, { value: 11, 'label': 'نوفمبر' }, { value: 12, label: 'ديسمبر' } ];
const monthsEn = [ { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' }, { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' }, { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' }, { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' } ];

interface WorkersContentProps {
    departmentId: string;
}

export function WorkersContent({ departmentId }: WorkersContentProps) {
    const [workers, setWorkers] = React.useState<Worker[]>([]);
    const [isDataLoading, setIsDataLoading] = React.useState(true);
    const { toast } = useToast();
    const { user: authUser, loading: isAuthLoading } = useAuth();
    const { language, t } = useLanguage();
    const months = language === 'ar' ? monthsAr : monthsEn;

    const targetUserId = authUser?.uid;

    React.useEffect(() => {
        const fetchWorkers = async () => {
            if (!targetUserId) return;
            
            setIsDataLoading(true);
            try {
                const workersColRef = collection(db, 'users', targetUserId, 'workers');
                const q = query(workersColRef, where("departmentId", "==", departmentId));
                const workersSnapshot = await getDocs(q);
                const fetchedWorkers: Worker[] = [];

                for (const workerDoc of workersSnapshot.docs) {
                    const transactionsColRef = collection(db, 'users', targetUserId, 'workers', workerDoc.id, 'transactions');
                    const transactionsSnapshot = await getDocs(transactionsColRef);
                    const transactions = transactionsSnapshot.docs.map(tDoc => ({ id: tDoc.id, ...tDoc.data() })) as Transaction[];
                    
                    const workerData = workerDoc.data();
                    fetchedWorkers.push({
                        id: workerDoc.id,
                        name: workerData.name,
                        baseSalary: workerData.baseSalary,
                        departmentId: workerData.departmentId,
                        transactions: transactions,
                        paidMonths: workerData.paidMonths || [],
                    });
                }
                setWorkers(fetchedWorkers);
            } catch (e) {
                console.error("Error fetching workers: ", e);
                toast({ variant: "destructive", title: t('error'), description: "Failed to load workers data." });
            } finally {
                setIsDataLoading(false);
            }
        };
        
        if (targetUserId) {
            fetchWorkers();
        } else {
            setIsDataLoading(false);
            setWorkers([]);
        }
    }, [targetUserId, departmentId, t, toast]);
    

    async function handleSaveWorker(data: WorkerFormValues, workerId?: string) {
        if (!targetUserId) {
             toast({ variant: "destructive", title: t('error'), description: "You cannot manage workers for this user." });
            return;
        }

        const workerExists = workers.some(w => w.name.toLowerCase() === data.name.toLowerCase() && w.id !== workerId);
        if (workerExists) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('workerExistsError')
            });
            return;
        }

        if (workerId) {
            // Update existing worker
            try {
                const workerDocRef = doc(db, 'users', targetUserId, 'workers', workerId);
                await updateDoc(workerDocRef, data as any);
                setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...data } : w));
                toast({ title: t('workerUpdatedSuccess') });
            } catch(e) {
                 console.error("Error updating worker: ", e);
                toast({ variant: "destructive", title: t('error'), description: "Failed to update worker data." });
            }
        } else {
            // Add new worker
            try {
                const workersColRef = collection(db, 'users', targetUserId, 'workers');
                const docRef = await addDoc(workersColRef, {
                    ...data,
                    paidMonths: [],
                    departmentId: departmentId,
                });
    
                const newWorker: Worker = {
                    id: docRef.id,
                    ...data,
                    paidMonths: [],
                    transactions: [],
                    departmentId,
                };
    
                setWorkers(prev => [...prev, newWorker]);
                toast({ title: t('workerAddedSuccess') });
    
            } catch (e) {
                console.error("Error adding worker: ", e);
                toast({ variant: "destructive", title: t('error'), description: "Failed to save worker data." });
            }
        }
    }

    async function deleteWorker(workerId: string) {
        if (!targetUserId) return;
        const batch = writeBatch(db);
        const workerDocRef = doc(db, 'users', targetUserId, 'workers', workerId);
        
        try {
            // Delete all transactions in the subcollection first
            const transactionsRef = collection(workerDocRef, 'transactions');
            const transactionsSnapshot = await getDocs(transactionsRef);
            transactionsSnapshot.forEach(transactionDoc => {
                batch.delete(transactionDoc.ref);
            });

            // Then delete the main worker document
            batch.delete(workerDocRef);

            await batch.commit();

            setWorkers(prev => prev.filter(w => w.id !== workerId));
            toast({ variant: "destructive", title: t('workerDeleted') });
        } catch (e) {
            console.error("Error deleting worker: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to delete worker data." });
        }
    }

    async function handleSalaryPayment(workerId: string, month: number, year: number, amount: number) {
        if (!targetUserId) return;
        const worker = workers.find(w => w.id === workerId);
        if (!worker) return;

        try {
            const batch = writeBatch(db);

            const newTransactionData: Omit<Transaction, 'id'> = {
                type: 'salary',
                amount: amount,
                date: new Date().toISOString(),
                month,
                year,
                description: `${t('salaryForMonth')} ${months.find(m => m.value === month)?.label} ${year}`
            };

            const transactionRef = doc(collection(db, 'users', targetUserId, 'workers', workerId, 'transactions'));
            batch.set(transactionRef, newTransactionData);
            
            const workerRef = doc(db, 'users', targetUserId, 'workers', workerId);
            const updatedPaidMonths = [...worker.paidMonths, { year, month }];
            batch.update(workerRef, { paidMonths: updatedPaidMonths });

            await batch.commit();

            setWorkers(prev => prev.map(w => {
                if (w.id === workerId) {
                    return {
                        ...w,
                        paidMonths: updatedPaidMonths,
                        transactions: [...w.transactions, { id: transactionRef.id, ...newTransactionData }],
                    };
                }
                return w;
            }));
            toast({ title: t('salaryPaidSuccess') });

        } catch (e) {
            console.error("Error paying salary: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to record salary payment." });
        }
    }

    async function handleAddTransaction(workerId: string, transaction: TransactionFormValues) {
        if (!targetUserId) return;
        
        try {
            const newTransactionData: Omit<Transaction, 'id'> = {
                type: transaction.type,
                amount: transaction.amount,
                date: new Date().toISOString(),
                description: transaction.description,
            };

            const transactionRef = await addDoc(collection(db, 'users', targetUserId, 'workers', workerId, 'transactions'), newTransactionData);
            
            setWorkers(prev => prev.map(w => {
                if (w.id === workerId) {
                    return {
                        ...w,
                        transactions: [...w.transactions, { id: transactionRef.id, ...newTransactionData }],
                    };
                }
                return w;
            }));
            toast({ title: t('transactionAddedSuccess') });

        } catch (e) {
            console.error("Error adding transaction: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to add transaction." });
        }
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
    
    const totalAnnualBaseSalaries = workers.reduce((sum, worker) => sum + worker.baseSalary * 12, 0);

    if (isAuthLoading) {
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
                <AddWorkerDialog onSave={handleSaveWorker}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('addNewWorker')}
                    </Button>
                </AddWorkerDialog>
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
                    {isDataLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center"><Skeleton className="w-full h-8" /></TableCell></TableRow>
                    ) : workers.length > 0 ? workers.map((worker) => {
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
                        <TableCell>
                            <div className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                                <SalaryPaymentDialog worker={worker} onConfirm={handleSalaryPayment} />
                                <FinancialRecordDialog worker={worker} onAddTransaction={handleAddTransaction} />
                                <AddWorkerDialog onSave={handleSaveWorker} worker={worker}>
                                    <Button variant="ghost" size="icon" title={t('editWorker')}><Pencil className="h-4 w-4" /></Button>
                                </AddWorkerDialog>
                                <DeleteWorkerAlert workerName={worker.name} onConfirm={() => deleteWorker(worker.id)} />
                            </div>
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
    );
}
