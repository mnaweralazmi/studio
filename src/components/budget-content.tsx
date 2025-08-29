
"use client"

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PlusCircle, Trash2, Wallet } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

// Simplified Schema for Agriculture only
const salesFormSchema = z.object({
  product: z.string({ required_error: 'Please select a vegetable type.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  weightPerUnit: z.coerce.number().min(0.1, 'Weight must be at least 0.1 kg.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
});

export type SalesFormValues = z.infer<typeof salesFormSchema>;

export type SalesItem = SalesFormValues & {
  id: string;
  total: number;
  date: Date;
  departmentId: string;
};

// Lists of options
const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;

interface BudgetContentProps {
    departmentId: 'agriculture' | 'livestock' | 'poultry' | 'fish';
}

export function BudgetContent({ departmentId }: BudgetContentProps) {
  const [salesItems, setSalesItems] = React.useState<SalesItem[]>([]);
  const { toast } = useToast();
  const { user, loading: isAuthLoading } = useAuth();
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const { language, t } = useLanguage();

  const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
  });

  React.useEffect(() => {
    form.reset();
  }, [departmentId, form]);

  React.useEffect(() => {
    const fetchSales = async () => {
      if (user) {
        setIsDataLoading(true);
        try {
            const salesCollectionRef = collection(db, 'users', user.uid, 'departments', departmentId, 'sales');
            const querySnapshot = await getDocs(salesCollectionRef);
            const sales: SalesItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                sales.push({
                    ...data,
                    id: doc.id,
                    date: (data.date as Timestamp).toDate(),
                } as SalesItem);
            });
            setSalesItems(sales.sort((a,b) => b.date.getTime() - a.date.getTime()));
        } catch(e) {
            console.error("Error fetching sales: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to load sales data." });
        } finally {
            setIsDataLoading(false);
        }
      } else if (!isAuthLoading) {
          setSalesItems([]);
          setIsDataLoading(false);
      }
    };

    fetchSales();
  }, [user, toast, t, isAuthLoading, departmentId]);

  async function onSubmit(data: SalesFormValues) {
    if (!user) {
        toast({ variant: "destructive", title: t('error'), description: "You must be logged in to add sales."});
        return;
    }
    
    const total = data.quantity * data.price;
    const submissionData = {
        ...data,
        total,
        departmentId,
        date: Timestamp.fromDate(new Date()),
    };

    try {
        const userRef = doc(db, 'users', user.uid);
        const salesCollectionRef = collection(db, 'users', user.uid, 'departments', departmentId, 'sales');

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            
            const currentBadges = userDoc.data().badges || [];
            let newPoints = userDoc.data().points || 0;
            let newBadges = [...currentBadges];
            let badgeAwarded = false;

            if (!currentBadges.includes('trader')) {
                newPoints += 25;
                newBadges.push('trader');
                badgeAwarded = true;
            } else {
                newPoints += 5;
            }
            
            const newLevel = Math.floor(newPoints / 100) + 1;
            transaction.update(userRef, { points: newPoints, level: newLevel, badges: newBadges });

            const docRef = doc(salesCollectionRef);
            transaction.set(docRef, submissionData);

            const newItem: SalesItem = {
              ...(submissionData as any),
              id: docRef.id,
              date: new Date(),
            };
            setSalesItems(prevItems => [newItem, ...prevItems]);
            
            if(badgeAwarded) {
                toast({ title: t('badgeEarned'), description: t('badgeTraderDesc') });
            }
        });
        
        form.reset();
        
        toast({
          title: t('salesAddedSuccess'),
        });

    } catch (e) {
        console.error("Error adding document: ", e);
        toast({ variant: "destructive", title: t('error'), description: "Failed to save sale."});
    }
  }
  
  async function deleteItem(id: string) {
    if (!user) return;
    try {
        const saleDocRef = doc(db, 'users', user.uid, 'departments', departmentId, 'sales', id);
        await deleteDoc(saleDocRef);
        setSalesItems(prevItems => prevItems.filter(item => item.id !== id));
        toast({
            variant: "destructive",
            title: t('itemDeleted'),
        });
    } catch(e) {
        console.error("Error deleting document: ", e);
        toast({ variant: "destructive", title: t('error'), description: "Failed to delete sale."});
    }
  }

  const renderActions = (item: SalesItem) => (
      <div className="flex gap-2 justify-end">
        <Button variant="destructive" size="icon" onClick={() => deleteItem(item.id)} title={t('deleteItem')}>
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>
  );

  const totalSales = salesItems.reduce((sum, item) => sum + item.total, 0);

  const renderFormFields = () => {
    switch(departmentId) {
        case 'agriculture':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="product" render={({ field }) => ( <FormItem><FormLabel>{t('vegetableType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectVegetable')} /></SelectTrigger></FormControl><SelectContent>{vegetableList.map(veg => <SelectItem key={veg} value={veg}>{veg}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>{t('quantityInCartons')}</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="weightPerUnit" render={({ field }) => ( <FormItem><FormLabel>{t('weightPerCartonInKg')}</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>{t('pricePerCartonInDinar')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            )
        default:
             return <p>{t('salesTrackingNotAvailable')}</p>
    }
  }

  const renderTable = () => {
     switch(departmentId) {
        case 'agriculture':
            return (
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead>{t('tableProduct')}</TableHead>
                        <TableHead>{t('tableQuantityCarton')}</TableHead>
                        <TableHead>{t('tableCartonPrice')}</TableHead>
                        <TableHead>{t('tableTotal')}</TableHead>
                        <TableHead className="text-right">{t('tableActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {salesItems.map(item => (
                         <TableRow key={item.id}>
                             <TableCell>{item.product}</TableCell>
                             <TableCell>{item.quantity}</TableCell>
                             <TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell>
                             <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
                             <TableCell className="text-right">{renderActions(item)}</TableCell>
                         </TableRow>
                     ))}
                  </TableBody>
                </Table>
            )
        default:
            return null;
     }
  }
  
  if (isAuthLoading) {
      return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
  }

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6"/>
              {t('vegetableSalesTracker')}
            </CardTitle>
            <CardDescription>
             {t('vegetableSalesTrackerDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 {renderFormFields()}
                 {departmentId === 'agriculture' && 
                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('add')}
                        </Button>
                    </div>
                 }
              </form>
            </Form>
          </CardContent>
        </Card>

        {isDataLoading ? (
            <Card>
                <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        ) : salesItems.length > 0 && departmentId === 'agriculture' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">{t('salesList')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {renderTable()}
              </div>
              <div className="mt-4 pt-4 border-t text-lg font-bold flex justify-between">
                <span>{t('totalSales')}:</span>
                <span>{totalSales.toFixed(2)} {t('dinar')}</span>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
    