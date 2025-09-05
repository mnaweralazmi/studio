
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Eye, PlusCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { Worker, TransactionFormValues } from './types';
import { Label } from '../ui/label';

interface FinancialRecordDialogProps {
    worker: Worker;
    departmentId: string;
    onAddTransaction: (workerId: string, transaction: TransactionFormValues) => void;
}

function FinancialRecordDialogComponent({ worker, departmentId, onAddTransaction }: FinancialRecordDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { language, t } = useLanguage();
    const formRef = React.useRef<HTMLFormElement>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = {
            type: formData.get('type') as 'bonus' | 'deduction',
            amount: Number(formData.get('amount')),
            description: formData.get('description') as string,
        };

        if (data.amount <= 0 || data.description.length < 3) {
            return;
        }

        onAddTransaction(worker.id, data);
        formRef.current?.reset();
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
                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label>{t('transactionType')}</Label>
                                <Select name="type" defaultValue="bonus">
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bonus">{t('bonus')}</SelectItem>
                                        <SelectItem value="deduction">{t('deduction')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">{t('amountInDinar')}</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{t('description')}</Label>
                                <Input id="description" name="description" placeholder={t('transactionDescPlaceholder')} required />
                            </div>
                            <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('addTransaction')}
                            </Button>
                        </form>
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
