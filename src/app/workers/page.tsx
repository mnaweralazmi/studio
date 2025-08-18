
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2, PlusCircle, Eye, BadgeCheck, Banknote, DollarSign, Gift, ArrowDownCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';

const workerFormSchema = z.object({
  name: z.string().min(3, "اسم العامل يجب أن يكون 3 أحرف على الأقل."),
  baseSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون رقمًا إيجابيًا."),
});

type WorkerFormValues = z.infer<typeof workerFormSchema>;

export interface Transaction {
    id: string;
    type: 'salary' | 'bonus' | 'deduction';
    amount: number;
    date: string;
    description: string;
    month?: number;
    year?: number;
}

export interface Worker extends WorkerFormValues {
  id: string;
  paidMonths: { year: number; month: number }[];
  transactions: Transaction[];
}

const monthsAr = [ { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' }, { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' }, { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' }, { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' } ];
const monthsEn = [ { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' }, { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' }, { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' }, { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' } ];


// --- Sub-components for better organization ---

function AddWorkerDialog({ onAdd }: { onAdd: (data: WorkerFormValues) => void }) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerFormSchema),
        defaultValues: { name: "", baseSalary: 0 },
    });

    const handleSubmit = (data: WorkerFormValues) => {
        onAdd(data);
        form.reset();
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addNewWorker')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('addNewWorker')}</DialogTitle>
                    <DialogDescription>{t('addNewWorkerDesc')}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('workerName')}</FormLabel><FormControl><Input placeholder={t('workerNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="baseSalary" render={({ field }) => (<FormItem><FormLabel>{t('baseSalaryInDinar')}</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit">{t('addWorker')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function SalaryPaymentDialog({ worker, onConfirm }: { worker: Worker; onConfirm: (workerId: string, month: number, year: number, amount: number) => void; }) {
    const { language, t } = useLanguage();
    const months = language === 'ar' ? monthsAr : monthsEn;
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedMonth, setSelectedMonth] = React.useState<number | undefined>();
    const currentYear = new Date().getFullYear();

    const isMonthPaid = (monthValue: number) => {
        return worker.paidMonths.some(pm => pm.month === monthValue && pm.year === currentYear);
    }

    const unpaidMonths = months.filter(m => !isMonthPaid(m.value));

    const handleConfirm = () => {
        if (selectedMonth) {
            onConfirm(worker.id, selectedMonth, currentYear, worker.baseSalary);
            setIsOpen(false);
            setSelectedMonth(undefined);
        }
    };
    
    React.useEffect(() => {
        if(isOpen && unpaidMonths.length > 0) {
            setSelectedMonth(unpaidMonths[0].value)
        }
    }, [isOpen, unpaidMonths]);


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={unpaidMonths.length === 0}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    {t('paySalary')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>{t('paySalaryFor')} {worker.name}</DialogTitle>
                    <DialogDescription>
                        {t('baseSalary')}: {worker.baseSalary.toFixed(2)} {t('dinar')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Select onValueChange={(val) => setSelectedMonth(Number(val))} value={selectedMonth?.toString()}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('selectMonth')} />
                        </SelectTrigger>
                        <SelectContent side="bottom" position="popper">
                            {months.map(m => {
                                const paid = isMonthPaid(m.value);
                                return (
                                <SelectItem key={m.value} value={m.value.toString()} disabled={paid}>
                                    {m.label} {paid ? `(${t('paid')})` : ''}
                                </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleConfirm} disabled={!selectedMonth} className="flex-1">{t('confirmPayment')}</Button>
                    <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">{t('cancel')}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const transactionFormSchema = z.object({
  type: z.enum(['bonus', 'deduction']),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون إيجابياً."),
  description: z.string().min(3, "الوصف مطلوب."),
});
type TransactionFormValues = z.infer<typeof transactionFormSchema>;

function FinancialRecordDialog({ worker, onAddTransaction }: { worker: Worker, onAddTransaction: (workerId: string, transaction: TransactionFormValues) => void }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { language, t } = useLanguage();
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: { type: 'bonus', amount: 10, description: "" },
    });

    const handleSubmit = (data: TransactionFormValues) => {
        onAddTransaction(worker.id, data);
        form.reset();
    };

    const workerBalance = (worker.transactions || []).reduce((acc, t) => {
        if (t.type === 'bonus') return acc + t.amount;
        if (t.type === 'deduction' || t.type === 'salary') return acc - t.amount;
        return acc;
    }, 0);

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                   <Eye className="h-4 w-4 mr-1" />
                   {t('viewFinancialRecord')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('financialRecordFor')} {worker.name}</DialogTitle>
                    <DialogDescription>
                        {t('currentBalance')}: <span className={`font-bold ${workerBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{workerBalance.toFixed(2)} {t('dinar')}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="max-h-96 overflow-y-auto pr-2">
                        <h4 className="font-semibold mb-2">{t('transactionLog')}</h4>
                        <Table>
                            <TableHeader><TableRow><TableHead>{t('tableDate')}</TableHead><TableHead>{t('tableDescription')}</TableHead><TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>{t('tableAmount')}</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {worker.transactions.length > 0 ? worker.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.date), 'yyyy/MM/dd')}</TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell className={`font-mono ${t.type === 'bonus' ? 'text-green-500' : 'text-red-500'} ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                                            {t.type === 'bonus' ? '+' : '-'}{t.amount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="text-center">{t('noTransactions')}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">{t('addNewTransaction')}</h4>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 border rounded-md">
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem><FormLabel>{t('transactionType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="bonus">{t('bonus')}</SelectItem><SelectItem value="deduction">{t('deduction')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel>{t('amountInDinar')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>{t('description')}</FormLabel><FormControl><Input placeholder={t('transactionDescPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('addTransaction')}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>{t('close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


// --- Main Page Component ---

export default function WorkersPage() {
    const [workers, setWorkers] = React.useState<Worker[]>([]);
    const { toast } = useToast();
    const [user, setUser] = React.useState<any>(null);
    const { language, t } = useLanguage();
    const months = language === 'ar' ? monthsAr : monthsEn;


    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const workersKey = `workers_${parsedUser.username}`;
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
    }, []);

    React.useEffect(() => {
        if (user) {
            const workersKey = `workers_${user.username}`;
            localStorage.setItem(workersKey, JSON.stringify(workers));
        }
    }, [workers, user]);
    

    function addWorker(data: WorkerFormValues) {
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

    return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users />
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
                <CardTitle>{t('workersList')}</CardTitle>
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
                           <Badge className={`${isPaidThisMonth ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                <BadgeCheck className="h-3 w-3 mr-1"/>
                                {isPaidThisMonth ? t('paid') : t('unpaid')}
                            </Badge>
                        </TableCell>
                        <TableCell className={`font-mono ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {balance.toFixed(2)} {t('dinar')}
                        </TableCell>
                        <TableCell className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                            <SalaryPaymentDialog worker={worker} onConfirm={handleSalaryPayment} />
                            <FinancialRecordDialog worker={worker} onAddTransaction={handleAddTransaction} />
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" title={t('deleteWorker')}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('confirmDeleteWorkerDesc', { workerName: worker.name })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteWorker(worker.id)}>
                                    {t('confirmDelete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
