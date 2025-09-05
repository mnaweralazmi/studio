
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
    const [name, setName] = React.useState(worker?.name || '');
    const [baseSalary, setBaseSalary] = React.useState(worker?.baseSalary || 0);

    React.useEffect(() => {
        if (worker) {
            setName(worker.name);
            setBaseSalary(worker.baseSalary);
        } else {
            setName('');
            setBaseSalary(0);
        }
    }, [worker]);

    React.useEffect(() => {
        if (!isOpen) {
            formRef.current?.reset();
            setName(worker?.name || '');
            setBaseSalary(worker?.baseSalary || 0);
        }
    }, [isOpen, worker]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (name.length < 3 || baseSalary < 0) {
            // Basic validation
            return;
        }

        onSave({ name, baseSalary }, worker?.id);
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
                        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('workerNamePlaceholder')} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="baseSalary">{t('baseSalaryInDinar')} ({t('monthly')})</Label>
                        <Input id="baseSalary" name="baseSalary" type="number" value={baseSalary} onChange={(e) => setBaseSalary(Number(e.target.value))} step="1" required />
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
