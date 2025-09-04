
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { collection, addDoc, getDocs, doc, Timestamp, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Landmark, PlusCircle, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { PaymentDialog } from './debts/payment-dialog';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { db } from '@/lib/firebase';
import { userSubcollection } from '@/lib/firestore';

// --- Data Types ---
export type Payment = {
  id: string;
  amount: number;
  date: Date;
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

export type DebtItemData = Omit<DebtItem, 'id' | 'payments'>;

// --- Firestore API Functions ---
async function getDebts(departmentId: string): Promise<DebtItem[]> {
    const debtsCollectionRef = userSubcollection<Omit<DebtItem, 'id'>>('debts');
    const querySnapshot = await getDocs(debtsCollectionRef);
    
    const allDebts = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            dueDate: data.dueDate ? (data.dueDate as unknown as Timestamp).toDate() : undefined,
            payments: data.payments || [], // Assume payments are nested or need separate fetch
        } as DebtItem;
    });
    return allDebts.filter(debt => debt.departmentId === departmentId);
}

async function addDebt(data: DebtItemData): Promise<string> {
    const debtsCollectionRef = userSubcollection('debts');
    const docRef = await addDoc(debtsCollectionRef, {
        ...data,
        payments: [],
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
    });
    return docRef.id;
}


async function addDebtPayment(debtId: string, paymentData: Omit<Payment, 'id'|'date'> & { date: Date }) {
    const { uid } = auth.currentUser!;
    const paymentCollectionRef = collection(db, "users", uid, "debts", debtId, "payments");
    await addDoc(paymentCollectionRef, {
      amount: paymentData.amount,
      date: Timestamp.fromDate(paymentData.date)
    });
}


interface DebtsContentProps {
    departmentId: string;
}

export function DebtsContent({ departmentId }: DebtsContentProps) {
    const [debts, setDebts] = React.useState<DebtItem[]>([]);
    const { toast } = useToast();
    const { user: authUser, loading: isAuthLoading } = useAuth();
    const [isDataLoading, setIsDataLoading] = React.useState(true);
    const { language, t } = useLanguage();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [dueDate, setDueDate] = React.useState<Date | undefined>();

    React.useEffect(() => {
        const fetchDebtsData = async () => {
            if (!authUser) {
                setIsDataLoading(false);
                return;
            }
            
            setIsDataLoading(true);
            try {
              const fetchedDebts = await getDebts(departmentId);
              setDebts(fetchedDebts.sort((a,b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0) ));
            } catch (e) {
                console.error("Error fetching debts: ", e);
                toast({ variant: "destructive", title: t('error'), description: "Failed to load debts data." });
            } finally {
                setIsDataLoading(false);
            }
        };

        if (authUser) {
            fetchDebtsData();
        } else if (!isAuthLoading) {
            setIsDataLoading(false);
            setDebts([]);
        }
    }, [authUser, departmentId, isAuthLoading, toast, t]);


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!authUser) {
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
            status: 'unpaid',
            dueDate: data.dueDate,
            departmentId: departmentId,
        };

        try {
            const docId = await addDebt(newDebtData);
            const newDebt: DebtItem = {
              ...newDebtData,
              id: docId,
              payments: [],
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

    async function handlePayment(debtId: string, paymentAmount: number) {
        if (!authUser) return;
        
        const debt = debts.find(d => d.id === debtId);
        if (!debt) return;
        
        try {
            const paymentData = {
                amount: paymentAmount,
                date: new Date(),
            };

            await addDebtPayment(debtId, paymentData);
            
            // Refetch all data to get the latest status
            const fetchedDebts = await getDebts(departmentId);
            setDebts(fetchedDebts.sort((a,b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0) ));
            
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
