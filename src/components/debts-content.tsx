
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Landmark, Trash2, PlusCircle, CalendarIcon, CheckCircle, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { PaymentDialog } from './debts/payment-dialog';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, writeBatch, setDoc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export type Payment = {
  id: string;
  amount: number;
  date: string;
};

export type DebtItem = {
  id: string;
  creditor: string;
  amount: number;
  dueDate?: Date;
  status: 'unpaid' | 'paid' | 'partially-paid';
  payments: Payment[];
  departmentId: string;
};

interface DebtsContentProps {
    departmentId: string;
}

function EditDebtDialog({ debt, onSave, children }: { debt: DebtItem, onSave: (id: string, data: Partial<DebtItem>) => void, children: React.ReactNode }) {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const [dueDate, setDueDate] = React.useState<Date | undefined>(debt.dueDate);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const creditor = formData.get('creditor') as string;
        const amount = Number(formData.get('amount'));

        if (!creditor || amount <= 0) return;

        const updatedData: Partial<DebtItem> = { creditor, amount, dueDate };
        onSave(debt.id, updatedData);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editDebt')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="creditor">{t('creditorName')}</Label>
                        <Input id="creditor" name="creditor" defaultValue={debt.creditor} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t('amountInDinar')}</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={debt.amount} required />
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
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit">{t('saveChanges')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function DebtsContent({ departmentId }: DebtsContentProps) {
    const [debts, setDebts] = React.useState<DebtItem[]>([]);
    const { toast } = useToast();
    const { user: authUser, loading: isAuthLoading } = useAuth();
    const [isDataLoading, setIsDataLoading] = React.useState(true);
    const { language, t } = useLanguage();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [dueDate, setDueDate] = React.useState<Date | undefined>();

    const targetUserId = authUser?.uid;

    React.useEffect(() => {
        const fetchDebts = async () => {
            if (!targetUserId) {
                setIsDataLoading(false);
                return;
            }
            
            setIsDataLoading(true);
            try {
              const debtsCollectionRef = collection(db, 'users', targetUserId, 'debts');
              const q = query(debtsCollectionRef, where("departmentId", "==", departmentId));
              const querySnapshot = await getDocs(q);
              const fetchedDebts: DebtItem[] = [];

              for (const docRef of querySnapshot.docs) {
                const data = docRef.data();
                const paymentsCollectionRef = collection(db, 'users', targetUserId, 'debts', docRef.id, 'payments');
                const paymentsSnapshot = await getDocs(paymentsCollectionRef);
                const payments: Payment[] = paymentsSnapshot.docs.map(pDoc => ({
                  id: pDoc.id,
                  ...pDoc.data(),
                })) as Payment[];
                
                fetchedDebts.push({
                  id: docRef.id,
                  creditor: data.creditor,
                  amount: data.amount,
                  dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : undefined,
                  status: data.status,
                  payments: payments,
                  departmentId: data.departmentId,
                });
              }
              setDebts(fetchedDebts.sort((a,b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0) ));
            } catch (e) {
                console.error("Error fetching debts: ", e);
                toast({ variant: "destructive", title: t('error'), description: "Failed to load debts data." });
            } finally {
                setIsDataLoading(false);
            }
        };

        if (targetUserId) {
            fetchDebts();
        } else if (!isAuthLoading) {
            setIsDataLoading(false);
            setDebts([]);
        }
    }, [targetUserId, departmentId, isAuthLoading, toast, t]);


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!targetUserId) {
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

        const newDebtData = {
            creditor: data.creditor,
            amount: data.amount,
            status: 'unpaid',
            payments: [],
            dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
            departmentId: departmentId,
        };

        try {
            const debtsCollectionRef = collection(db, 'users', targetUserId, 'debts');
            const docRef = await addDoc(debtsCollectionRef, {
                creditor: newDebtData.creditor,
                amount: newDebtData.amount,
                status: newDebtData.status,
                dueDate: newDebtData.dueDate,
                departmentId: newDebtData.departmentId,
            });

            const newDebt: DebtItem = {
              ...data,
              id: docRef.id,
              status: 'unpaid',
              payments: [],
              departmentId,
            };

            setDebts(prev => [...prev, newDebt].sort((a,b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0)));
            formRef.current?.reset();
            setDueDate(undefined);
            toast({ title: t('debtAddedSuccess') });

        } catch (e) {
            console.error("Error adding document: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save debt." });
        }
    }

    async function deleteDebt(debtId: string) {
        if (!targetUserId) return;
        
        const debtDocRef = doc(db, 'users', targetUserId, 'debts', debtId);
        
        try {
            const batch = writeBatch(db);
            // Delete all payments in the subcollection first
            const paymentsRef = collection(debtDocRef, 'payments');
            const paymentsSnapshot = await getDocs(paymentsRef);
            paymentsSnapshot.forEach(paymentDoc => {
                batch.delete(paymentDoc.ref);
            });

            // Then delete the main debt document
            batch.delete(debtDocRef);

            await batch.commit();

            setDebts(prev => prev.filter(item => item.id !== debtId));
            toast({ variant: "destructive", title: t('debtDeleted') });
        } catch (e) {
            console.error("Error deleting document: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to delete debt." });
        }
    }

    async function handleEditDebt(id: string, data: Partial<DebtItem>) {
        if (!targetUserId) return;
        try {
            const debtRef = doc(db, 'users', targetUserId, 'debts', id);
            await updateDoc(debtRef, {
                ...data,
                dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null
            });
            setDebts(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
            toast({ title: t('debtUpdatedSuccess') });
        } catch (e) {
            console.error("Error updating debt: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to update debt." });
        }
    }


    async function handlePayment(debtId: string, paymentAmount: number) {
        if (!targetUserId) return;
        
        const debt = debts.find(d => d.id === debtId);
        if (!debt) return;
        
        try {
            const batch = writeBatch(db);
            
            const newPaymentRef = doc(collection(db, 'users', targetUserId, 'debts', debtId, 'payments'));
            batch.set(newPaymentRef, {
                amount: paymentAmount,
                date: Timestamp.fromDate(new Date()),
            });

            const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0) + paymentAmount;
            let newStatus: DebtItem['status'] = totalPaid >= debt.amount ? 'paid' : 'partially-paid';

            const debtDocRef = doc(db, 'users', targetUserId, 'debts', debtId);
            batch.update(debtDocRef, { status: newStatus });
            
            await batch.commit();
            
            setDebts(prevDebts => prevDebts.map(d => {
                if (d.id === debtId) {
                    const newPayment: Payment = {
                        id: newPaymentRef.id,
                        amount: paymentAmount,
                        date: new Date().toISOString(),
                    };
                    return { ...d, payments: [...d.payments, newPayment], status: newStatus };
                }
                return d;
            }));
            
            toast({ title: t('paymentRecordedSuccess'), className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" });
        } catch(e) {
            console.error("Error processing payment: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to record payment." });
        }
    }

    const getPaidAmount = (debt: DebtItem) => {
        return debt.payments.reduce((sum, p) => sum + p.amount, 0);
    }
    
    const getRemainingAmount = (debt: DebtItem) => {
        const totalPaid = getPaidAmount(debt);
        return debt.amount - totalPaid;
    }
    
    const totalUnpaidDebts = debts.filter(d => d.status !== 'paid').reduce((sum, item) => {
        return sum + getRemainingAmount(item);
    }, 0);

    if (isAuthLoading) {
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
                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Landmark className="h-5 w-5 sm:h-6 sm:w-6" />{t('debtManagement')}</CardTitle>
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
                            <Input id="creditor" name="creditor" placeholder={t('creditorNamePlaceholder')} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="amount">{t('amountInDinar')}</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" />
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
            
            {isDataLoading ? (
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            ) : debts.length > 0 ? (
            <Card>
                <CardHeader><CardTitle className="text-xl sm:text-2xl">{t('debtList')}</CardTitle></CardHeader>
                <CardContent>
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
                                        <TableCell>{item.dueDate ? format(item.dueDate, "PPP", { locale: language === 'ar' ? arSA : enUS }) : t('noDueDate')}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === 'paid' ? 'default' : (item.status === 'partially-paid' ? 'secondary' : 'destructive')} className={item.status === 'paid' ? 'bg-green-600 hover:bg-green-600/80' : ''}>
                                                {t(`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}` as any)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`flex gap-2 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                                                {item.status !== 'paid' && <PaymentDialog debt={item} onConfirm={handlePayment} />}
                                                <EditDebtDialog debt={item} onSave={handleEditDebt}>
                                                     <Button variant="ghost" size="icon" title={t('edit')}><Pencil className="h-4 w-4" /></Button>
                                                </EditDebtDialog>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" title={t('delete')}><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                                            <AlertDialogDescription>{t('confirmDeleteTopicDesc', { topicName: item.creditor })}</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteDebt(item.id)}>{t('confirmDelete')}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            ) : null}
        </div>
    );
}

    