
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from '@/context/language-context';
import type { Worker, WorkerFormValues } from './types';
import { Label } from '../ui/label';

interface AddWorkerDialogProps {
    onSave: (data: WorkerFormValues, workerId?: string) => void;
    worker?: Worker;
    children: React.ReactNode;
}

export function AddWorkerDialog({ onSave, worker, children }: AddWorkerDialogProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);

    React.useEffect(() => {
        if (!isOpen) {
            formRef.current?.reset();
        }
    }, [isOpen]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get('name') as string,
            baseSalary: Number(formData.get('baseSalary')),
        };

        if (data.name.length < 3 || data.baseSalary < 0) {
            // Basic validation
            return;
        }

        onSave(data, worker?.id);
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
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('workerName')}</Label>
                        <Input id="name" name="name" placeholder={t('workerNamePlaceholder')} defaultValue={worker?.name} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="baseSalary">{t('baseSalaryInDinar')} ({t('monthly')})</Label>
                        <Input id="baseSalary" name="baseSalary" type="number" step="1" defaultValue={worker?.baseSalary} required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit">{worker ? t('saveChanges') : t('addWorker')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
