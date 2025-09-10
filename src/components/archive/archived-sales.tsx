
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Department } from '@/lib/types';
import { useAppContext } from '@/context/app-context';


const departmentTitles: Record<Department, string> = {
    agriculture: 'departmentAgriculture',
    livestock: 'departmentLivestock',
    poultry: 'departmentPoultry',
    fish: 'departmentFish'
};

export function ArchivedSales() {
    const { archivedSales, loading } = useAppContext();
    const { t, language } = useLanguage();
    
    const sortedItems = React.useMemo(() => {
        const list = Array.isArray(archivedSales) ? archivedSales : [];
        return [...list].sort((a,b) => {
            const dateA = a?.archivedAt ? new Date(a.archivedAt).getTime() : 0;
            const dateB = b?.archivedAt ? new Date(b.archivedAt).getTime() : 0;
            return dateB - dateA;
        });
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
                                    <TableCell>{item.archivedAt ? format(new Date(item.archivedAt), "PPP p", { locale: language === 'ar' ? arSA : enUS }) : '-'}</TableCell>
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
