
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Landmark, Trash2, PlusCircle, CalendarIcon, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';


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

export function DebtsContent() {
    const [debts, setDebts] = React.useState<DebtItem[]>([]);
    const { toast } = useToast();
    const { user } = useAuth();
    const { language, t } = useLanguage();

    React.useEffect(() => {
        if (user) {
            const userDebtsKey = `debts_${user.uid}`;
            const storedDebts = localStorage.getItem(userDebtsKey);
            if (storedDebts) {
                const parsedDebts = JSON.parse(storedDebts).map((debt: any) => ({
                    ...debt,
                    dueDate: debt.dueDate ? new Date(debt.dueDate) : undefined,
                }));
                setDebts(parsedDebts);
            }
        }
    }, [user]);

    React.useEffect(() => {
        if (user) {
            const userDebtsKey = `debts_${user.uid}`;
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
        toast({ title: t('debtAddedSuccess') });
    }

    function deleteDebt(id: number) {
        setDebts(prev => prev.filter(item => item.id !== id));
        toast({ variant: "destructive", title: t('debtDeleted') });
    }

    function settleDebt(id: number) {
        setDebts(prev => prev.map(item => item.id === id ? { ...item, status: 'paid' } : item));
        toast({ title: t('debtSettledSuccess'), className: "bg-green-100 text-green-800" });
    }
    
    const totalUnpaidDebts = debts.filter(d => d.status === 'unpaid').reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Landmark className="h-5 w-5 sm:h-6 sm:w-6" />{t('debtManagement')}</CardTitle>
                    <CardDescription>{t('debtManagementDesc')}</CardDescription>
                </CardHeader>
            </Card>
            
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalUnpaidDebts')}</CardTitle>
                    <Landmark className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnpaidDebts.toFixed(2)} {t('dinar')}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-xl sm:text-2xl">{t('addNewDebt')}</CardTitle></CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <FormField control={form.control} name="creditor" render={({ field }) => (
                                <FormItem><FormLabel>{t('creditorName')}</FormLabel><FormControl><Input placeholder={t('creditorNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel>{t('amountInDinar')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="dueDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>{t('dueDateOptional')}</FormLabel><Popover>
                                    <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                                        {field.value ? format(field.value, "PPP", { locale: language === 'ar' ? arSA : enUS }) : <span>{t('pickDate')}</span>}
                                    </Button></FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={language === 'ar' ? arSA : enUS} /></PopoverContent>
                                </Popover><FormMessage /></FormItem>
                            )} />
                            <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />{t('addDebt')}</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {debts.length > 0 && (
            <Card>
                <CardHeader><CardTitle className="text-xl sm:text-2xl">{t('debtList')}</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>{t('tableCreditor')}</TableHead>
                                <TableHead>{t('tableAmount')}</TableHead>
                                <TableHead>{t('tableDueDate')}</TableHead>
                                <TableHead>{t('tableStatus')}</TableHead>
                                <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>{t('tableActions')}</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {debts.map((item) => (
                                    <TableRow key={item.id} className={item.status === 'paid' ? 'bg-green-50' : ''}>
                                        <TableCell className="font-medium">{item.creditor}</TableCell>
                                        <TableCell>{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                        <TableCell>{item.dueDate ? format(item.dueDate, "PPP", { locale: language === 'ar' ? arSA : enUS }) : t('noDueDate')}</TableCell>
                                        <TableCell><Badge variant={item.status === 'paid' ? 'default' : 'destructive'} className={item.status === 'paid' ? 'bg-green-600' : ''}>{item.status === 'paid' ? t('statusPaid') : t('statusUnpaid')}</Badge></TableCell>
                                        <TableCell className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                                            {item.status === 'unpaid' && <Button size="sm" onClick={() => settleDebt(item.id)}><CheckCircle className="h-4 w-4 mr-1" />{t('settleDebt')}</Button>}
                                            <Button variant="destructive" size="icon" onClick={() => deleteDebt(item.id)} title={t('delete')}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            )}
        </div>
    );
}
