
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Landmark, Trash2, PlusCircle, CalendarIcon, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

const debtFormSchema = z.object({
  creditor: z.string().min(2, "اسم الدائن مطلوب."),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون إيجابياً."),
  dueDate: z.date().optional(),
});

type DebtFormValues = z.infer<typeof debtFormSchema>;

type DebtItem = DebtFormValues & {
  id: number;
  status: 'unpaid' | 'paid';
};

function DebtsContent() {
    const [debts, setDebts] = React.useState<DebtItem[]>([]);
    const { toast } = useToast();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const userDebtsKey = `debts_${parsedUser.username}`;
            const storedDebts = localStorage.getItem(userDebtsKey);
            if (storedDebts) {
                const parsedDebts = JSON.parse(storedDebts).map((debt: any) => ({
                    ...debt,
                    dueDate: debt.dueDate ? new Date(debt.dueDate) : undefined,
                }));
                setDebts(parsedDebts);
            }
        }
    }, []);

    React.useEffect(() => {
        if (user) {
            const userDebtsKey = `debts_${user.username}`;
            localStorage.setItem(userDebtsKey, JSON.stringify(debts));
        }
    }, [debts, user]);

    const form = useForm<DebtFormValues>({
        resolver: zodResolver(debtFormSchema),
        defaultValues: {
            creditor: "",
            amount: 0.01,
            dueDate: undefined,
        },
    });

    function onSubmit(data: DebtFormValues) {
        const newDebt: DebtItem = {
            ...data,
            id: Date.now(),
            status: 'unpaid',
        };
        setDebts(prev => [...prev, newDebt]);
        form.reset();
        toast({ title: "تمت إضافة الدين بنجاح!" });
    }

    function deleteDebt(id: number) {
        setDebts(prev => prev.filter(item => item.id !== id));
        toast({ variant: "destructive", title: "تم حذف الدين." });
    }

    function settleDebt(id: number) {
        setDebts(prev => prev.map(item => item.id === id ? { ...item, status: 'paid' } : item));
        toast({ title: "تم تسديد الدين بنجاح!", className: "bg-green-100 text-green-800" });
    }
    
    const totalUnpaidDebts = debts.filter(d => d.status === 'unpaid').reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Landmark />إدارة الديون</CardTitle>
                    <CardDescription>أضف ديونك وتتبعها وقم بتسديدها.</CardDescription>
                </CardHeader>
            </Card>
            
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الديون غير المسددة</CardTitle>
                    <Landmark className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnpaidDebts.toFixed(2)} دينار</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>إضافة دين جديد</CardTitle></CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <FormField control={form.control} name="creditor" render={({ field }) => (
                                <FormItem><FormLabel>اسم الدائن</FormLabel><FormControl><Input placeholder="مثال: شركة الكهرباء" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel>المبلغ (دينار)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="dueDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق (اختياري)</FormLabel><Popover>
                                    <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>اختر تاريخًا</span>}
                                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                    </Button></FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                </Popover><FormMessage /></FormItem>
                            )} />
                            <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> إضافة دين</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {debts.length > 0 && (
            <Card>
                <CardHeader><CardTitle>قائمة الديون</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>الدائن</TableHead><TableHead>المبلغ</TableHead><TableHead>تاريخ الاستحقاق</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {debts.map((item) => (
                                <TableRow key={item.id} className={item.status === 'paid' ? 'bg-green-50' : ''}>
                                    <TableCell className="font-medium">{item.creditor}</TableCell>
                                    <TableCell>{item.amount.toFixed(2)} دينار</TableCell>
                                    <TableCell>{item.dueDate ? format(item.dueDate, "PPP") : 'لا يوجد'}</TableCell>
                                    <TableCell><Badge variant={item.status === 'paid' ? 'default' : 'destructive'} className={item.status === 'paid' ? 'bg-green-600' : ''}>{item.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</Badge></TableCell>
                                    <TableCell className="flex gap-2">
                                        {item.status === 'unpaid' && <Button size="sm" onClick={() => settleDebt(item.id)}><CheckCircle className="h-4 w-4 mr-1" /> تسديد</Button>}
                                        <Button variant="destructive" size="icon" onClick={() => deleteDebt(item.id)} title="حذف"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            )}
        </div>
    );
}

export default function DebtsPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <DebtsContent />
      </div>
    </main>
  );
}
