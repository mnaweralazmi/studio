
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { type Task } from '@/app/calendar/page';

interface ArchivedTask extends Task {
    completedAt: Timestamp;
}

export function ArchivedTasks() {
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = React.useState(true);
    const [archivedTasks, setArchivedTasks] = React.useState<ArchivedTask[]>([]);
    
    React.useEffect(() => {
        if (!user) {
            if (!authLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const q = query(collection(db, "completed_tasks"), where("ownerId", "==", user.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const tasks: ArchivedTask[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                tasks.push({ 
                    id: doc.id, 
                    ...data,
                    // Ensure dueDate is a Date object, even if it's stored differently
                    dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(),
                    completedAt: data.completedAt,
                } as ArchivedTask);
            });
            setArchivedTasks(tasks.sort((a,b) => b.completedAt.toMillis() - a.completedAt.toMillis()));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching archived tasks:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    if (isLoading) {
        return <Skeleton className="h-60 w-full" />;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('completedTasksLog')}</CardTitle>
            </CardHeader>
            <CardContent>
                {archivedTasks.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('taskTitle')}</TableHead>
                                <TableHead>{t('description')}</TableHead>
                                <TableHead>{t('archivedAt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {archivedTasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.title}</TableCell>
                                    <TableCell>{task.description || '-'}</TableCell>
                                    <TableCell>{format(task.completedAt.toDate(), "PPP p", { locale: language === 'ar' ? arSA : enUS })}</TableCell>
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
