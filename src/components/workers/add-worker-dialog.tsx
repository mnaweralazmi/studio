
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { Worker } from './types';

const workerFormSchema = z.object({
  name: z.string().min(3, "اسم العامل يجب أن يكون 3 أحرف على الأقل."),
  baseSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون رقمًا إيجابيًا."),
});

type WorkerFormValues = z.infer<typeof workerFormSchema>;

interface AddWorkerDialogProps {
    onAdd: (data: WorkerFormValues) => void;
}

function AddWorkerDialogComponent({ onAdd }: AddWorkerDialogProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerFormSchema),
        defaultValues: { name: "", baseSalary: 0 },
    });

    const handleSubmit = (data: WorkerFormValues) => {
        onAdd(data);
        form.reset();
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addNewWorker')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('addNewWorker')}</DialogTitle>
                    <DialogDescription>{t('addNewWorkerDesc')}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('workerName')}</FormLabel><FormControl><Input placeholder={t('workerNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="baseSalary" render={({ field }) => (<FormItem><FormLabel>{t('baseSalaryInDinar')}</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit">{t('addWorker')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export const AddWorkerDialog = React.memo(AddWorkerDialogComponent);
