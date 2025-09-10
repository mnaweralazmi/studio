
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { Worker } from '@/lib/types';

const monthsAr = [ { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' }, { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' }, { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' }, { value: 10, label: 'أكتوبر' }, { value: 11, 'label': 'نوفمبر' }, { value: 12, label: 'ديسمبر' } ];
const monthsEn = [ { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' }, { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' }, { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' }, { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' } ];

interface SalaryPaymentDialogProps {
    worker: Worker;
    onConfirm: (workerId: string, month: number, year: number, amount: number) => void;
}

function SalaryPaymentDialogComponent({ worker, onConfirm }: SalaryPaymentDialogProps) {
    const { language, t } = useLanguage();
    const months = language === 'ar' ? monthsAr : monthsEn;
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedMonth, setSelectedMonth] = React.useState<number | undefined>();
    const currentYear = new Date().getFullYear();

    const unpaidMonths = React.useMemo(() => {
        const isMonthPaid = (monthValue: number) => {
            return (worker.paidMonths || []).some(pm => pm.month === monthValue && pm.year === currentYear);
        }
        return months.filter(m => !isMonthPaid(m.value));
    }, [worker.paidMonths, months, currentYear]);

    const handleConfirm = () => {
        if (selectedMonth) {
            onConfirm(worker.id, selectedMonth, currentYear, worker.baseSalary);
            setIsOpen(false);
            setSelectedMonth(undefined);
        }
    };
    
    React.useEffect(() => {
        if(isOpen) {
            if (unpaidMonths.length > 0) {
                 setSelectedMonth(unpaidMonths[0].value);
            } else {
                 setSelectedMonth(undefined);
            }
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
                     <Select onValueChange={(val) => setSelectedMonth(Number(val))} value={selectedMonth?.toString()} disabled={unpaidMonths.length === 0}>
                        <SelectTrigger>
                            <SelectValue placeholder={unpaidMonths.length === 0 ? t('noMonthsToPay') : t('selectMonth')} />
                        </SelectTrigger>
                        <SelectContent side="bottom" position="popper">
                            {unpaidMonths.map(m => (
                                <SelectItem key={m.value} value={m.value.toString()}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleConfirm} disabled={!selectedMonth || unpaidMonths.length === 0} className="flex-1">{t('confirmPayment')}</Button>
                    <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">{t('cancel')}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const SalaryPaymentDialog = React.memo(SalaryPaymentDialogComponent);

    