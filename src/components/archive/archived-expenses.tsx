"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { collection, query, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { type ExpenseItem } from '../expenses-content';
import useCollectionSubscription from '@/hooks/use-collection-subscription';

interface ArchivedExpense extends ExpenseItem {
    archivedAt: Timestamp;
}

const departmentTitles = {
    agriculture: 'departmentAgriculture',
    livestock: 'departmentLivestock',
    poultry: 'departmentPoultry',
    fish: 'departmentFish'
};
type DeptKey = keyof typeof departmentTitles;

export function ArchivedExpenses() {
    const { user, loading: authLoading } = useAuth();
    const [archivedItems, isLoading] = useCollectionSubscription<ArchivedExpense>('archive_expenses', user?.uid);
    const { t, language } = useLanguage();

    const sortedItems = React.useMemo(() => {
        return [...archivedItems].sort((a,b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime())
    }, [archivedItems]);

    if (isLoading || authLoading) {
        return <Skeleton className="h-60 w-full" />;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('archivedExpenses')}</CardTitle>
            </CardHeader>
            <CardContent>
                {sortedItems.length > 0 ? (
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
                            {sortedItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{t(departmentTitles[item.departmentId as DeptKey] as any)}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{item.item}</TableCell>
                                    <TableCell>{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                    <TableCell>{format(new Date(item.archivedAt), "PPP p", { locale: language === 'ar' ? arSA : enUS })}</TableCell>
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
