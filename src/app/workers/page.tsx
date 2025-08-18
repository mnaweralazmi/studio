
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2, PlusCircle, Award, ArrowDownCircle, DollarSign, Eye, BadgeAlert, BadgeCheck, BadgeHelp } from 'lucide-react';
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
    month: number;
    year: number;
    description: string;
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

function SalaryPaymentDialog({ worker, onConfirm }: { worker: Worker; onConfirm: (workerId: string, month: number, year: number, amount: number) => void; }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedMonth, setSelectedMonth] = React.useState<number | undefined>();
    const currentYear = new Date().getFullYear();

    const unpaidMonths = months.filter(m => !worker.paidMonths.some(pm => pm.month === m.value && pm.year === currentYear));

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
                    استلام راتب
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تسديد راتب لـ {worker.name}</DialogTitle>
                    <DialogDescription>
                        اختر الشهر لتسجيل دفعة الراتب. الراتب الأساسي: {worker.baseSalary.toFixed(2)} دينار.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Select onValueChange={(val) => setSelectedMonth(Number(val))} value={selectedMonth?.toString()}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الشهر..." />
                        </SelectTrigger>
                        <SelectContent>
                            {unpaidMonths.length > 0 ? (
                                unpaidMonths.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)
                            ) : (
                                <SelectItem value="none" disabled>جميع الرواتب مسددة</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>إلغاء</Button>
                    <Button onClick={handleConfirm} disabled={!selectedMonth}>تأكيد الدفع</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
                // Initialize optional fields if they don't exist
                const parsedWorkers = JSON.parse(storedWorkers).map((w: any) => ({
                    ...w,
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
    
    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerFormSchema),
        defaultValues: {
            name: "",
            baseSalary: 0,
        },
    });

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
        form.reset();
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
  
    const getWorkerStatus = (worker: Worker) => {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const isPaid = worker.paidMonths.some(p => p.month === currentMonth && p.year === currentYear);
        const balance = worker.transactions.reduce((acc, t) => {
             if (t.type === 'bonus') return acc + t.amount;
             if (t.type === 'deduction' || t.type === 'salary') return acc - t.amount;
             return acc;
        }, 0);
        
        const unpaidSalaries = (worker.baseSalary * (currentMonth - worker.paidMonths.filter(p => p.year === currentYear).length));
        const totalBalance = unpaidSalaries + balance;


        if (isPaid) return { text: 'مدفوع', color: 'bg-green-600', icon: BadgeCheck };
        if (totalBalance > 0) return { text: `غير مدفوع (${totalBalance.toFixed(2)})`, color: 'bg-red-600', icon: BadgeAlert };
        return { text: 'لا يوجد رصيد', color: 'bg-gray-500', icon: BadgeHelp };
    }

    return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users />
                    إدارة العمالة والرواتب
                </CardTitle>
                <CardDescription>
                    أضف العمال، تتبع رواتبهم، وقم بإدارة المكافآت والخصومات.
                </CardDescription>
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>إضافة عامل جديد</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(addWorker)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم العامل</FormLabel>
                                    <FormControl>
                                        <Input placeholder="أدخل اسم العامل..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="baseSalary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الراتب الأساسي (دينار)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button type="submit" className="self-end">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            إضافة عامل
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        {workers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>قائمة العمال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العامل</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                       <TableHead>حالة الراتب (الشهر الحالي)</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((worker) => {
                      const status = getWorkerStatus(worker);
                      const StatusIcon = status.icon;
                      return (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{(worker.baseSalary || 0).toFixed(2)} دينار</TableCell>
                        <TableCell>
                           <Badge className={`${status.color} text-white`}>
                                <StatusIcon className="h-3 w-3 ml-1"/>
                                {status.text}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-left flex gap-2">
                            <SalaryPaymentDialog worker={worker} onConfirm={handleSalaryPayment} />
                            <Button variant="secondary" size="sm" disabled>
                                <Award className="h-4 w-4 ml-1" />
                                مكافأة
                            </Button>
                            <Button variant="secondary" size="sm" disabled>
                               <ArrowDownCircle className="h-4 w-4 ml-1" />
                                خصم
                            </Button>
                             <Button variant="ghost" size="sm">
                               <Eye className="h-4 w-4 ml-1" />
                                عرض التفاصيل
                            </Button>
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
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
