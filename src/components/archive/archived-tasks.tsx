
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { ArchivedTask } from '@/lib/types';
import { useAppContext } from '@/context/app-context';


export function ArchivedTasks() {
    const { completedTasks, loading } = useAppContext();
    const { t, language } = useLanguage();

    const sortedTasks = React.useMemo(() => {
        const list = Array.isArray(completedTasks) ? completedTasks : [];
        return [...list].sort((a,b) => {
            const dateA = a?.completedAt ? new Date(a.completedAt).getTime() : 0;
            const dateB = b?.completedAt ? new Date(b.completedAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [completedTasks]);


    if (loading) {
        return <Skeleton className="h-60 w-full" />;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('completedTasksLog')}</CardTitle>
            </CardHeader>
            <CardContent>
                {sortedTasks.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('taskTitle')}</TableHead>
                                <TableHead>{t('description')}</TableHead>
                                <TableHead>{t('archivedAt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.title}</TableCell>
                                    <TableCell>{task.description || '-'}</TableCell>
                                    <TableCell>{format(new Date(task.completedAt), "PPP p", { locale: language === 'ar' ? arSA : enUS })}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-4">{t('noArchivedItems')}</p>
                )}
            </CardContent>
        </Card>
    );
}
