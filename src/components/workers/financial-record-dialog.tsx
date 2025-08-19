
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Eye, PlusCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { Worker, TransactionFormValues } from './types';

const transactionFormSchema = z.object({
  type: z.enum(['bonus', 'deduction']),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون إيجابياً."),
  description: z.string().min(3, "الوصف مطلوب."),
});

interface FinancialRecordDialogProps {
    worker: Worker;
    onAddTransaction: (workerId: string, transaction: TransactionFormValues) => void;
}

function FinancialRecordDialogComponent({ worker, onAddTransaction }: FinancialRecordDialogProps) {
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
                                {(worker.transactions || []).length > 0 ? worker.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
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
    );
}

export const FinancialRecordDialog = React.memo(FinancialRecordDialogComponent);
