
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
import { type ExpenseItem } from '../expenses-content';

interface ArchivedExpense extends ExpenseItem {
    archivedAt: Timestamp;
}

const departmentTitles = {
    agriculture: 'topicSoil',
    livestock: 'livestockSales',
    poultry: 'poultrySales',
    fish: 'fishSales'
};
type DeptKey = keyof typeof departmentTitles;

export function ArchivedExpenses() {
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = React.useState(true);
    const [archivedItems, setArchivedItems] = React.useState<ArchivedExpense[]>([]);
    
    React.useEffect(() => {
        if (!user) {
            if (!authLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const collectionName = `archive_expenses`;
        const q = query(
            collection(db, 'users', user.uid, collectionName),
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items: ArchivedExpense[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                items.push({ 
                    id: doc.id,
                    ...data,
                    date: data.date.toDate(),
                } as ArchivedExpense);
            });
            setArchivedItems(items.sort((a,b) => b.archivedAt.toMillis() - a.archivedAt.toMillis()));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching archived expenses:", error);
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
                <CardTitle>{t('archivedExpenses')}</CardTitle>
            </CardHeader>
            <CardContent>
                {archivedItems.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('department')}</TableHead>
                                <TableHead>{t('tableCategory')}</TableHead>
                                <TableHead>{t('tableItem')}</TableHead>
                                <TableHead>{t('tableAmount')}</TableHead>
                                <TableHead>{t('archivedAt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {archivedItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{t(departmentTitles[item.departmentId as DeptKey] as any)}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.item}</TableCell>
                                    <TableCell>{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                    <TableCell>{format(item.archivedAt.toDate(), "PPP p", { locale: language === 'ar' ? arSA : enUS })}</TableCell>
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
