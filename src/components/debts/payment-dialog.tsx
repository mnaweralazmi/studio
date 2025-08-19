
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { HandCoins } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { DebtItem } from '../debts-content';

interface PaymentDialogProps {
    debt: DebtItem;
    onConfirm: (debtId: number, amount: number) => void;
}

export function PaymentDialog({ debt, onConfirm }: PaymentDialogProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);

    const remainingAmount = debt.amount - debt.payments.reduce((sum, p) => sum + p.amount, 0);

    const paymentFormSchema = z.object({
        amount: z.coerce.number()
            .min(0.01, t('amountMustBePositive'))
            .max(remainingAmount, t('paymentExceedsRemaining')),
    });
    
    type PaymentFormValues = z.infer<typeof paymentFormSchema>;

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: { amount: remainingAmount > 0 ? Number(remainingAmount.toFixed(2)) : 0.01 },
    });
    
    React.useEffect(() => {
        if(isOpen) {
            form.reset({ amount: Number(remainingAmount.toFixed(2)) });
        }
    }, [isOpen, remainingAmount, form]);


    const handleConfirm = (data: PaymentFormValues) => {
        onConfirm(debt.id, data.amount);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <HandCoins className="h-4 w-4 mr-1" />
                    {t('recordPayment')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t('recordPaymentFor')} {debt.creditor}</DialogTitle>
                    <DialogDescription>
                        {t('totalDebtAmount')}: {debt.amount.toFixed(2)} {t('dinar')} | {t('remainingAmount')}: <span className="font-bold">{remainingAmount.toFixed(2)} {t('dinar')}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                        <h4 className="font-semibold">{t('newPayment')}</h4>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleConfirm)} className="space-y-4 p-4 border rounded-md">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('paymentAmount')}</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">{t('confirmPayment')}</Button>
                            </form>
                        </Form>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold">{t('paymentHistory')}</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('tableDate')}</TableHead>
                                        <TableHead className="text-right">{t('tableAmount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {debt.payments.length > 0 ? debt.payments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{format(new Date(p.date), 'yyyy/MM/dd')}</TableCell>
                                            <TableCell className="text-right font-mono">{p.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center h-24">{t('noPaymentsYet')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>{t('close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
