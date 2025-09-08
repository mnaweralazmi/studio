
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { collection, query, onSnapshot, Timestamp, collectionGroup } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { type DebtItem } from '../debts-content';

interface ArchivedDebt extends DebtItem {
    archivedAt: Timestamp;
}

const departmentTitles = {
    agriculture: 'departmentAgriculture',
    livestock: 'departmentLivestock',
    poultry: 'departmentPoultry',
    fish: 'departmentFish'
};
type DeptKey = keyof typeof departmentTitles;


export function ArchivedDebts() {
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = React.useState(true);
    const [archivedItems, setArchivedItems] = React.useState<ArchivedDebt[]>([]);
    
    React.useEffect(() => {
        if (!user) {
            if (!authLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        const departments = ['agriculture', 'livestock', 'poultry', 'fish'];
        const unsubscribers = departments.map(dept => {
            const collectionName = `archive_${dept}_debts`;
            const q = query(collection(db, 'users', user.uid, collectionName));
            return onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id,
                        ...data,
                        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
                        payments: (data.payments || []).map((p: any) => ({ ...p, date: p.date.toDate() })),
                        archivedAt: data.archivedAt
                    } as ArchivedDebt;
                });
                
                setArchivedItems(prev => {
                    const otherItems = prev.filter(p => p.departmentId !== dept);
                    const newItems = [...otherItems, ...items];
                    return newItems.sort((a,b) => b.archivedAt.toMillis() - a.archivedAt.toMillis());
                });
            }, (error) => {
                console.error(`Error fetching archived debts from ${collectionName}:`, error);
            });
        });

        setIsLoading(false);
        return () => unsubscribers.forEach(unsub => unsub());

    }, [user, authLoading]);

    if (isLoading) {
        return <Skeleton className="h-60 w-full" />;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('archivedDebts')}</CardTitle>
            </CardHeader>
            <CardContent>
                {archivedItems.length > 0 ? (
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
                            {archivedItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{t(departmentTitles[item.departmentId as DeptKey] as any)}</TableCell>
                                    <TableCell>{item.creditor}</TableCell>
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
