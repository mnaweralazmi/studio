
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { HandCoins } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { DebtItem } from '@/lib/types';
import { Label } from '../ui/label';

interface PaymentDialogProps {
    debt: DebtItem;
    onConfirm: (debtId: string, amount: number) => void;
}

export function PaymentDialog({ debt, onConfirm }: PaymentDialogProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const [amount, setAmount] = React.useState(0);
    const [error, setError] = React.useState('');

    const remainingAmount = debt.amount - (debt.payments || []).reduce((sum, p) => sum + p.amount, 0);

    React.useEffect(() => {
        if (isOpen) {
            const remaining = Number(remainingAmount.toFixed(2));
            setAmount(remaining > 0 ? remaining : 0.01);
            setError('');
        }
    }, [isOpen, remainingAmount]);


    const handleConfirm = (event: React.FormEvent) => {
        event.preventDefault();
        
        if (amount <= 0) {
            setError(t('amountMustBePositive'));
            return;
        }

        if (amount > Number(remainingAmount.toFixed(2)) + 0.001) { // Add tolerance for floating point issues
            setError(t('paymentExceedsRemaining'));
            return;
        }
        
        setError('');
        onConfirm(debt.id, amount);
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
                        <form onSubmit={handleConfirm} className="space-y-4 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label htmlFor="amount">{t('paymentAmount')}</Label>
                                <Input 
                                    id="amount"
                                    type="number" 
                                    step="0.01" 
                                    value={amount} 
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                            </div>
                            <Button type="submit" className="w-full">{t('confirmPayment')}</Button>
                        </form>
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
                                    {(debt.payments || []).length > 0 ? debt.payments.map((p, index) => (
                                        <TableRow key={index}>
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
