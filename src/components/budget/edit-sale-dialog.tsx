
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
import type { SalesItem, SalesFormValues } from '../budget-content';

const salesFormSchema = z.object({
  vegetable: z.string({ required_error: 'الرجاء اختيار نوع الخضار.' }),
  quantity: z.coerce.number().min(1, 'يجب أن تكون الكمية 1 على الأقل.'),
  weightPerCarton: z.coerce.number().min(0.1, 'يجب أن يكون الوزن 0.1 كيلو على الأقل.'),
  price: z.coerce.number().min(0.01, 'يجب أن يكون السعر إيجابياً.'),
});

const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;

interface EditSaleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sale: SalesItem;
    onSave: (id: string, data: SalesFormValues) => void;
}

export function EditSaleDialog({ isOpen, onClose, sale, onSave }: EditSaleDialogProps) {
    const { language, t } = useLanguage();
    const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;

    const form = useForm<SalesFormValues>({
        resolver: zodResolver(salesFormSchema),
        defaultValues: sale,
    });

    React.useEffect(() => {
        if (sale) {
            form.reset(sale);
        }
    }, [sale, form]);

    const handleSubmit = (data: SalesFormValues) => {
        onSave(sale.id, data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editSale')}</DialogTitle>
                    <DialogDescription>{t('editSaleDesc')}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="vegetable"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('vegetableType')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t('selectVegetable')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {vegetableList.map(veg => (
                                    <SelectItem key={veg} value={veg}>{veg}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('quantityInCartons')}</FormLabel>
                                <FormControl>
                                    <Input type="number" step="1" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="weightPerCarton"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('weightPerCartonInKg')}</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('pricePerCartonInDinar')}</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

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
