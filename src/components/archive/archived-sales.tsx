
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { ArchivedSale, Department } from '@/lib/types';
import { useData } from '@/context/data-context';


const departmentTitles: Record<Department, string> = {
    agriculture: 'departmentAgriculture',
    livestock: 'departmentLivestock',
    poultry: 'departmentPoultry',
    fish: 'departmentFish'
};

export function ArchivedSales() {
    const { archivedSales, loading } = useData();
    const { t, language } = useLanguage();
    
    const sortedItems = React.useMemo(() => {
        return [...archivedSales].sort((a,b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime())
    }, [archivedSales]);

    if (loading) {
        return <Skeleton className="h-60 w-full" />;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('archivedSales')}</CardTitle>
            </CardHeader>
            <CardContent>
                {sortedItems.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('department')}</TableHead>
                                <TableHead>{t('tableProduct')}</TableHead>
                                <TableHead>{t('tableTotal')}</TableHead>
                                <TableHead>{t('archivedAt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{t(departmentTitles[item.departmentId] as any)}</TableCell>
                                    <TableCell>{item.product}</TableCell>
                                    <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
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
