
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
import type { ArchivedDebt, Department } from '@/lib/types';


const departmentTitles: Record<Department, string> = {
    agriculture: 'departmentAgriculture',
    livestock: 'departmentLivestock',
    poultry: 'departmentPoultry',
    fish: 'departmentFish'
};

export function ArchivedDebts() {
    const { user, loading: authLoading } = useAuth();
    const [archivedItems, isLoading] = useCollectionSubscription<ArchivedDebt>('archive_debts', user?.uid);
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
                <CardTitle>{t('archivedDebts')}</CardTitle>
            </CardHeader>
            <CardContent>
                {sortedItems.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('department')}</TableHead>
                                <TableHead>{t('tableCreditor')}</TableHead>
                                <TableHead>{t('tableAmount')}</TableHead>
                                <TableHead>{t('archivedAt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{t(departmentTitles[item.departmentId] as any)}</TableCell>
                                    <TableCell>{item.creditor}</TableCell>
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
