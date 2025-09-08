
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import useCollectionSubscription from '@/hooks/use-collection-subscription';
import type { ArchivedTask } from '@/lib/types';


export function ArchivedTasks() {
    const { user, loading: authLoading } = useAuth();
    const [archivedTasks, isLoading] = useCollectionSubscription<ArchivedTask>('completed_tasks', user?.uid);
    const { t, language } = useLanguage();

    const sortedTasks = React.useMemo(() => {
        return [...archivedTasks].sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    }, [archivedTasks]);


    if (isLoading || authLoading) {
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
