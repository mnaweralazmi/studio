
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface DeleteWorkerAlertProps {
    workerId: string;
    workerName: string;
    onConfirm: (workerId: string) => void;
}

function DeleteWorkerAlertComponent({ workerId, workerName, onConfirm }: DeleteWorkerAlertProps) {
    const { t } = useLanguage();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" title={t('deleteWorker')}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('confirmDeleteWorkerDesc', { workerName: workerName })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm(workerId)}>
                        {t('confirmDelete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export const DeleteWorkerAlert = React.memo(DeleteWorkerAlertComponent);
