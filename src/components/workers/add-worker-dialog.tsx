
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Pencil } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import type { Worker, WorkerFormValues } from './types';

const workerFormSchema = z.object({
  name: z.string().min(3, "اسم العامل يجب أن يكون 3 أحرف على الأقل."),
  baseSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون رقمًا إيجابيًا."),
});

interface AddWorkerDialogProps {
    onSave: (data: WorkerFormValues, workerId?: string) => void;
    worker?: Worker;
    children: React.ReactNode;
}

function AddWorkerDialogComponent({ onSave, worker, children }: AddWorkerDialogProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    
    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerFormSchema),
        defaultValues: worker ? { name: worker.name, baseSalary: worker.baseSalary } : { name: "", baseSalary: 0 },
    });

    React.useEffect(() => {
        if (worker) {
            form.reset({ name: worker.name, baseSalary: worker.baseSalary });
        } else {
            form.reset({ name: "", baseSalary: 0 });
        }
    }, [worker, form, isOpen]);

    const handleSubmit = (data: WorkerFormValues) => {
        onSave(data, worker?.id);
        form.reset();
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{worker ? t('editWorker') : t('addNewWorker')}</DialogTitle>
                    <DialogDescription>{worker ? t('editWorkerDesc') : t('addNewWorkerDesc')}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>{t('workerName')}</FormLabel><FormControl><Input placeholder={t('workerNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="baseSalary" render={({ field }) => (<FormItem><FormLabel>{t('baseSalaryInDinar')}</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit">{worker ? t('saveChanges') : t('addWorker')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export const AddWorkerDialog = React.memo(AddWorkerDialogComponent);
