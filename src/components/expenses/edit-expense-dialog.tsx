
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/language-context';
import type { ExpenseItem, ExpenseFormValues } from '../expenses-content';

const expenseFormSchema = z.object({
  type: z.enum(['fixed', 'variable'], { required_error: "الرجاء تحديد نوع المصروف." }),
  category: z.string({ required_error: "الرجاء اختيار الفئة." }),
  item: z.string({ required_error: "الرجاء اختيار البند." }),
  newItemName: z.string().optional(),
  amount: z.coerce.number().min(0.01, "يجب أن يكون المبلغ إيجابياً."),
}).refine(data => {
    if (data.item === 'add_new_item') {
        return !!data.newItemName && data.newItemName.length > 2;
    }
    return true;
}, {
    message: "الرجاء إدخال اسم بند جديد (3 أحرف على الأقل).",
    path: ['newItemName'],
});

interface EditExpenseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    expense: ExpenseItem;
    onSave: (id: string, data: ExpenseFormValues) => void;
    expenseCategories: Record<string, string[]>;
}

export function EditExpenseDialog({ isOpen, onClose, expense, onSave, expenseCategories }: EditExpenseDialogProps) {
    const { t } = useLanguage();
    
    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema),
        defaultValues: expense,
    });

    React.useEffect(() => {
        if (expense) {
            form.reset(expense);
        }
    }, [expense, form]);

    const handleSubmit = (data: ExpenseFormValues) => {
        onSave(expense.id, data);
    };

    const selectedCategory = form.watch("category");
    const selectedItem = form.watch("item");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editExpense')}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('expenseType')}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder={t('selectType')} /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="fixed">{t('expenseTypeFixed')}</SelectItem>
                                            <SelectItem value="variable">{t('expenseTypeVariable')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('category')}</FormLabel>
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue("item", undefined);
                                    }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.keys(expenseCategories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        {selectedCategory && (
                            <FormField control={form.control} name="item" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('item')}</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder={t('selectItem')} /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {expenseCategories[selectedCategory]?.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                            <SelectItem value="add_new_item">{t('addNewItem')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                        {selectedItem === 'add_new_item' && (
                            <FormField control={form.control} name="newItemName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('newItemName')}</FormLabel>
                                    <FormControl><Input placeholder={t('newItemNamePlaceholder')} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                         <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('amountInDinar')}</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
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
