
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { DebtItem, DebtFormValues } from '../debts-content';
import { cn } from "@/lib/utils";


const debtFormSchema = z.object({
  creditor: z.string().min(2, "اسم الدائن مطلوب."),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون إيجابياً."),
  dueDate: z.date().optional(),
});

interface EditDebtDialogProps {
    isOpen: boolean;
    onClose: () => void;
    debt: DebtItem;
    onSave: (id: string, data: DebtFormValues) => void;
}

export function EditDebtDialog({ isOpen, onClose, debt, onSave }: EditDebtDialogProps) {
    const { language, t } = useLanguage();

    const form = useForm<DebtFormValues>({
        resolver: zodResolver(debtFormSchema),
        defaultValues: {
            ...debt,
            dueDate: debt.dueDate ? new Date(debt.dueDate) : undefined,
        },
    });

    React.useEffect(() => {
        if (debt) {
            form.reset({
                ...debt,
                dueDate: debt.dueDate ? new Date(debt.dueDate) : undefined,
            });
        }
    }, [debt, form]);

    const handleSubmit = (data: DebtFormValues) => {
        onSave(debt.id, data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editDebt')}</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="creditor" render={({ field }) => (
                            <FormItem><FormLabel>{t('creditorName')}</FormLabel><FormControl><Input placeholder={t('creditorNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem><FormLabel>{t('amountInDinar')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="dueDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>{t('dueDateOptional')}</FormLabel><Popover>
                                <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", language === 'ar' ? 'pr-3' : 'pl-3')}>
                                    <CalendarIcon className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                                    {field.value ? format(field.value, "PPP", { locale: language === 'ar' ? arSA : enUS }) : <span>{t('pickDate')}</span>}
                                </Button></FormControl></PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={language === 'ar' ? arSA : enUS} /></PopoverContent>
                            </Popover><FormMessage /></FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                            <Button type="submit">{t('saveChanges')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
