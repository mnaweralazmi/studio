
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { addDoc, doc, Timestamp, updateDoc, arrayUnion, collection, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Landmark, PlusCircle, CalendarIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/context/language-context';
import { useAppContext } from '@/context/app-context';
import { PaymentDialog } from './debts/payment-dialog';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { db } from '@/lib/firebase';
import type { DebtItem, DebtItemData, Department, Payment } from '@/lib/types';

async function addDebt(data: DebtItemData): Promise<string> {
    const debtsCollectionRef = collection(db, 'debts');
    const docRef = await addDoc(debtsCollectionRef, {
        ...data,
        payments: [],
        status: 'unpaid',
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
    });
    return docRef.id;
}

async function archiveDebt(debt: DebtItem): Promise<void> {
    const batch = writeBatch(db);

    const originalDebtRef = doc(db, 'debts', debt.id);
    batch.delete(originalDebtRef);

    const archiveDebtRef = doc(collection(db, 'archive_debts'));

    const archivedData: any = {
        ...debt,
        archivedAt: Timestamp.now(),
        ownerId: debt.ownerId
    };
    
    batch.set(archiveDebtRef, archivedData);

    await batch.commit();
}


async function addDebtPayment(debtId: string, paymentData: Omit<Payment, 'id'>) {
    const debtRef = doc(db, 'debts', debtId);
    await updateDoc(debtRef, {
        payments: arrayUnion({
            ...paymentData,
            date: Timestamp.fromDate(paymentData.date),
        })
    });
}

async function updateDebtStatus(debtId: string, status: DebtItem['status']) {
    const debtRef = doc(db, 'debts', debtId);
    await updateDoc(debtRef, { status });
}

interface DebtsContentProps {
    departmentId: Department;
}

export function DebtsContent({ departmentId }: DebtsContentProps) {
    const { user, allDebts, loading } = useAppContext();

    const { toast } = useToast();
    const { language, t } = useLanguage();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [dueDate, setDueDate] = React.useState<Date | undefined>();

    const debts = React.useMemo(() => {
        const list = Array.isArray(allDebts) ? allDebts : [];
        return list
            .filter(item => item?.departmentId === departmentId)
            .sort((a,b) => {
                const ta = a?.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const tb = b?.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return ta - tb;
            });
    }, [allDebts, departmentId]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!user) {
            toast({ variant: "destructive", title: t('error'), description: "You cannot add debts for this user." });
            return;
        }

        const formData = new FormData(event.currentTarget);
        const data = {
            creditor: formData.get('creditor') as string,
            amount: Number(formData.get('amount')),
            dueDate: dueDate
        };

        if (!data.creditor || data.amount <= 0) {
            toast({ variant: "destructive", title: t('error'), description: "Please fill all fields correctly."});
            return;
        }

        const newDebtData: DebtItemData = {
            creditor: data.creditor,
            amount: data.amount,
            dueDate: data.dueDate,
            ownerId: user.uid,
            departmentId: departmentId,
        };

        try {
            await addDebt(newDebtData);
            formRef.current?.reset();
            setDueDate(undefined);
            toast({ title: t('debtAddedSuccess') });

        } catch (e) {
            console.error("Error adding document: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save debt." });
        }
    }
    
    async function handleDelete(debtId: string) {
        const debtToArchive = debts.find(item => item.id === debtId);
        if (!debtToArchive) return;
        try {
            await archiveDebt(debtToArchive);
            toast({ title: t('itemArchived'), description: t('itemArchivedDesc') });
        } catch(e) {
            console.error("Error archiving debt: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to archive debt." });
        }
    }

    async function handlePayment(debtId: string, paymentAmount: number) {
        const debt = debts.find(d => d.id === debtId);
        if (!debt) return;

        try {
            const newPayment = { amount: paymentAmount, date: new Date() };
            await addDebtPayment(debtId, newPayment);
            
            const totalPaid = (debt.payments || []).reduce((sum, p) => sum + p.amount, 0) + paymentAmount;
            const newStatus: DebtItem['status'] = totalPaid >= debt.amount ? 'paid' : 'partially-paid';
            if (newStatus !== debt.status) {
                await updateDebtStatus(debtId, newStatus);
            }
            
            toast({ title: t('paymentRecordedSuccess') });
        } catch (e) {
            console.error("Error processing payment: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to record payment." });
        }
    }

    const getPaidAmount = (debt: DebtItem) => {
        return (debt.payments || []).reduce((sum, p) => sum + p.amount, 0);
    }
    
    const getRemainingAmount = (debt: DebtItem) => {
        const totalPaid = getPaidAmount(debt);
        return debt.amount - totalPaid;
    }
    
    const totalUnpaidDebts = debts.filter(d => d.status !== 'paid').reduce((sum, item) => {
        return sum + getRemainingAmount(item);
    }, 0);

    if (loading) {
        return (
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-16 w-full" /></CardHeader></Card>
                <Card><CardContent><Skeleton className="h-12 w-full" /></CardContent></Card>
                <Card><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Landmark className="h-5 w-5 sm:h-6 sm:w-6" />{t('debts')}</CardTitle>
                    <CardDescription>{t('debtManagementDesc')}</CardDescription>
                </CardHeader>
            </Card>
            
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalUnpaidDebts')}</CardTitle>
                    <Landmark className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnpaidDebts.toFixed(2)} {t('dinar')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-xl sm:text-2xl">{t('addNewDebt')}</CardTitle></CardHeader>
                <CardContent>
                    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="creditor">{t('creditorName')}</Label>
                            <Input id="creditor" name="creditor" placeholder={t('creditorNamePlaceholder')} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="amount">{t('amountInDinar')}</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" required />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Label>{t('dueDateOptional')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "PPP", { locale: language === 'ar' ? arSA : enUS }) : <span>{t('pickDate')}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button type="submit"><PlusCircle className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />{t('addDebt')}</Button>
                    </form>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle className="text-xl sm:text-2xl">{t('debtList')}</CardTitle></CardHeader>
                <CardContent>
                    {debts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>{t('tableCreditor')}</TableHead>
                                <TableHead>{t('tableAmount')}</TableHead>
                                <TableHead>{t('paidAmount')}</TableHead>
                                <TableHead>{t('remainingAmount')}</TableHead>
                                <TableHead>{t('tableDueDate')}</TableHead>
                                <TableHead>{t('tableStatus')}</TableHead>
                                <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>{t('tableActions')}</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {debts.map((item) => {
                                  const remainingAmount = getRemainingAmount(item);
                                  return (
                                    <TableRow key={item.id} className={item.status === 'paid' ? 'bg-green-50/50 dark:bg-green-900/20' : ''}>
                                        <TableCell className="font-medium">{item.creditor}</TableCell>
                                        <TableCell>{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                        <TableCell className="font-mono text-green-600">{getPaidAmount(item).toFixed(2)} {t('dinar')}</TableCell>
                                        <TableCell className="font-mono">{remainingAmount.toFixed(2)} {t('dinar')}</TableCell>
                                        <TableCell>{item.dueDate ? format(new Date(item.dueDate), "PPP", { locale: language === 'ar' ? arSA : enUS }) : t('noDueDate')}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === 'paid' ? 'default' : (item.status === 'partially-paid' ? 'secondary' : 'destructive')} className={item.status === 'paid' ? 'bg-green-600 hover:bg-green-600/80' : ''}>
                                                {t(`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}` as any)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                                                {item.status !== 'paid' && <PaymentDialog debt={item} onConfirm={handlePayment} />}
                                                 <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                     ) : (
                        <p className="text-center text-muted-foreground py-4">{t('noDebtsYet')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    