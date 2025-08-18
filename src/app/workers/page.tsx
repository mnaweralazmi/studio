
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2, PlusCircle, Award, ArrowDownCircle, DollarSign, Eye, BadgeAlert, BadgeCheck, BadgeHelp, Banknote } from 'lucide-react';
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

const months = [
    { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' }
];


// --- Sub-components for better organization ---

function AddWorkerDialog({ onAdd }: { onAdd: (data: WorkerFormValues) => void }) {
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
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة عامل جديد
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة عامل جديد</DialogTitle>
                    <DialogDescription>أدخل تفاصيل العامل الجديد والراتب الأساسي.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم العامل</FormLabel><FormControl><Input placeholder="أدخل اسم العامل..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="baseSalary" render={({ field }) => (<FormItem><FormLabel>الراتب الأساسي (دينار)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>إلغاء</Button>
                            <Button type="submit">إضافة عامل</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function SalaryPaymentDialog({ worker, onConfirm }: { worker: Worker; onConfirm: (workerId: string, month: number, year: number, amount: number) => void; }) {
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
                    <DollarSign className="h-4 w-4 ml-1" />
                    دفع الراتب
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>تسديد راتب لـ {worker.name}</DialogTitle>
                    <DialogDescription>
                        الراتب الأساسي: {worker.baseSalary.toFixed(2)} دينار.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 py-4">
                    <Button onClick={handleConfirm} disabled={!selectedMonth} className="flex-1">تأكيد الدفع</Button>
                    <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">إلغاء</Button>
                </div>
                <div className="py-4">
                     <Select onValueChange={(val) => setSelectedMonth(Number(val))} value={selectedMonth?.toString()}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الشهر..." />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => {
                                const paid = isMonthPaid(m.value);
                                return (
                                <SelectItem key={m.value} value={m.value.toString()} disabled={paid}>
                                    {m.label} {paid ? '(مدفوع)' : ''}
                                </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
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
                   <Eye className="h-4 w-4 ml-1" />
                   عرض السجل المالي
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>السجل المالي لـ {worker.name}</DialogTitle>
                    <DialogDescription>
                        إجمالي الرصيد الحالي: <span className={`font-bold ${workerBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{workerBalance.toFixed(2)} دينار</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="max-h-96 overflow-y-auto pr-2">
                        <h4 className="font-semibold mb-2">سجل المعاملات</h4>
                        <Table>
                            <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>الوصف</TableHead><TableHead className="text-left">المبلغ</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {worker.transactions.length > 0 ? worker.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.date), 'yyyy/MM/dd')}</TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell className={`text-left font-mono ${t.type === 'bonus' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'bonus' ? '+' : '-'}{t.amount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="text-center">لا توجد معاملات.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">إضافة معاملة جديدة</h4>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 border rounded-md">
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem><FormLabel>النوع</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="bonus">مكافأة</SelectItem><SelectItem value="deduction">خصم</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel>المبلغ (دينار)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>الوصف</FormLabel><FormControl><Input placeholder="أدخل وصفًا..." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" className="w-full">
                                    <PlusCircle className="ml-2 h-4 w-4" />
                                    إضافة معاملة
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>إغلاق</Button>
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
                title: "خطأ",
                description: "عامل بهذا الاسم موجود بالفعل."
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
        toast({ title: "تمت إضافة العامل بنجاح!" });
    }

    function deleteWorker(workerId: string) {
        setWorkers(prev => prev.filter(w => w.id !== workerId));
        toast({ variant: "destructive", title: "تم حذف العامل." });
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
                    description: `راتب شهر ${months.find(m => m.value === month)?.label} ${year}`
                };
                return {
                    ...w,
                    paidMonths: [...w.paidMonths, { year, month }],
                    transactions: [...w.transactions, newTransaction],
                };
            }
            return w;
        }));
        toast({ title: "تم تسجيل الراتب بنجاح!" });
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
        toast({ title: "تمت إضافة المعاملة بنجاح!" });
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
                    إدارة العمالة والرواتب
                </CardTitle>
                <CardDescription>
                    أضف العمال، تتبع رواتبهم، وقم بإدارة المكافآت والخصومات بكفاءة.
                </CardDescription>
            </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي عدد العمال</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{workers.length}</div>
                    <p className="text-xs text-muted-foreground">عدد العمال المسجلين حالياً</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الرواتب المدفوعة (هذا العام)</CardTitle>
                    <Banknote className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{totalSalariesThisYear.toFixed(2)} دينار</div>
                    <p className="text-xs text-muted-foreground">مجموع الرواتب المدفوعة في {currentYear}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الرواتب غير المدفوعة (هذا الشهر)</CardTitle>
                    <Banknote className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{totalUnpaidSalariesThisMonth.toFixed(2)} دينار</div>
                    <p className="text-xs text-muted-foreground">مجموع رواتب شهر {months.find(m => m.value === currentMonth)?.label} غير المدفوعة</p>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>قائمة العمال</CardTitle>
                <AddWorkerDialog onAdd={addWorker} />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العامل</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                       <TableHead>حالة راتب الشهر الحالي</TableHead>
                       <TableHead>الرصيد الإجمالي</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.length > 0 ? workers.map((worker) => {
                      const isPaidThisMonth = getMonthStatus(worker, currentMonth, currentYear);
                      const balance = getWorkerBalance(worker);
                      return (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{(worker.baseSalary || 0).toFixed(2)} دينار</TableCell>
                        <TableCell>
                           <Badge className={`${isPaidThisMonth ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                {isPaidThisMonth ? <BadgeCheck className="h-3 w-3 ml-1"/> : <BadgeAlert className="h-3 w-3 ml-1"/>}
                                {isPaidThisMonth ? 'مدفوع' : 'غير مدفوع'}
                            </Badge>
                        </TableCell>
                        <TableCell className={`font-mono ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {balance.toFixed(2)} دينار
                        </TableCell>
                        <TableCell className="text-left flex gap-2 justify-end">
                            <SalaryPaymentDialog worker={worker} onConfirm={handleSalaryPayment} />
                            <FinancialRecordDialog worker={worker} onAddTransaction={handleAddTransaction} />
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" title="حذف العامل">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيؤدي هذا الإجراء إلى حذف العامل ({worker.name}) بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteWorker(worker.id)}>
                                    نعم، حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )}) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                لا يوجد عمال بعد. قم بإضافة عامل جديد لبدء الإدارة.
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
