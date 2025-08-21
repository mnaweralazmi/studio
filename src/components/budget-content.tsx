
"use client"

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PlusCircle, Trash2, Wallet, Pencil } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { EditSaleDialog } from './budget/edit-sale-dialog';

const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;


const salesFormSchema = z.object({
  vegetable: z.string({ 
    required_error: 'الرجاء اختيار نوع الخضار.' 
  }),
  quantity: z.coerce.number().min(1, 'يجب أن تكون الكمية 1 على الأقل.'),
  weightPerCarton: z.coerce.number().min(0.1, 'يجب أن يكون الوزن 0.1 كيلو على الأقل.'),
  price: z.coerce.number().min(0.01, 'يجب أن يكون السعر إيجابياً.'),
});

export type SalesFormValues = z.infer<typeof salesFormSchema>;

export type SalesItem = SalesFormValues & {
  id: string;
  total: number;
  pricePerKilo: number;
  totalWeight: number;
  date: Date;
};

interface BudgetContentProps {
    departmentId: string;
}

export function BudgetContent({ departmentId }: BudgetContentProps) {
  const [salesItems, setSalesItems] = React.useState<SalesItem[]>([]);
  const { toast } = useToast();
  const { user, loading: isAuthLoading } = useAuth();
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const { language, t } = useLanguage();
  const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;
  const [editingSale, setEditingSale] = React.useState<SalesItem | null>(null);


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
                    id: doc.id,
                    vegetable: data.vegetable,
                    quantity: data.quantity,
                    weightPerCarton: data.weightPerCarton,
                    price: data.price,
                    total: data.total,
                    pricePerKilo: data.pricePerKilo,
                    totalWeight: data.totalWeight,
                    date: (data.date as Timestamp).toDate(),
                });
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

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      quantity: 1,
      weightPerCarton: 1,
      price: 0.1,
      vegetable: undefined,
    },
  });

  const handleUpdateItem = async (id: string, data: SalesFormValues) => {
    if (!user) return;

    const total = data.quantity * data.price;
    const totalWeight = data.quantity * data.weightPerCarton;
    const pricePerKilo = data.price / data.weightPerCarton;
    
    try {
        const saleDocRef = doc(db, 'users', user.uid, 'departments', departmentId, 'sales', id);
        const saleToUpdate = salesItems.find(s => s.id === id);
        if (!saleToUpdate) return;
        
        await setDoc(saleDocRef, {
            ...data,
            total,
            totalWeight,
            pricePerKilo,
            date: Timestamp.fromDate(saleToUpdate.date),
        });

        setSalesItems(prevItems => prevItems.map(item => item.id === id ? {
            ...item,
            ...data,
            total,
            totalWeight,
            pricePerKilo,
        } : item));
        
        toast({ title: t('salesUpdatedSuccess') });
        setEditingSale(null);

    } catch (e) {
        console.error("Error updating document: ", e);
        toast({ variant: "destructive", title: t('error'), description: "Failed to update sale."});
    }
  };


  async function onSubmit(data: SalesFormValues) {
    if (!user) {
        toast({ variant: "destructive", title: t('error'), description: "You must be logged in to add sales."});
        return;
    }
    
    const total = data.quantity * data.price;
    const totalWeight = data.quantity * data.weightPerCarton;
    const pricePerKilo = data.price / data.weightPerCarton;

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
                newPoints += 25; // Points for first sale
                newBadges.push('trader');
                badgeAwarded = true;
            } else {
                newPoints += 5; // Points for subsequent sales
            }
            
            const newLevel = Math.floor(newPoints / 100) + 1;
            transaction.update(userRef, { points: newPoints, level: newLevel, badges: newBadges });

            const docRef = doc(salesCollectionRef);
             transaction.set(docRef, {
                ...data,
                total,
                totalWeight,
                pricePerKilo,
                date: Timestamp.fromDate(new Date()),
            });

            const newItem: SalesItem = {
              ...data,
              id: docRef.id,
              total,
              totalWeight,
              pricePerKilo,
              date: new Date(),
            };

            setSalesItems(prevItems => [newItem, ...prevItems]);
            
            if(badgeAwarded) {
                toast({ title: t('badgeEarned'), description: t('badgeTraderDesc') });
            }
        });
        
        form.reset({
          vegetable: undefined,
          quantity: 1,
          weightPerCarton: 1,
          price: 0.1,
        });
        
        toast({
          title: t('salesAddedSuccess'),
          description: `${t('salesAddedDesc')} "${data.vegetable}"`,
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

  const totalSales = salesItems.reduce((sum, item) => sum + item.total, 0);
  
  if (isAuthLoading) {
      return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
  }

  return (
    <>
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="vegetable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('vegetableType')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectVegetable')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vegetableList.map(veg => (
                              <SelectItem key={veg} value={veg}>{veg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quantityInCartons')}</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weightPerCarton"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('weightPerCartonInKg')}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pricePerCartonInDinar')}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="md:col-start-5">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('add')}
                </Button>
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
        ) : salesItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">{t('salesList')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('tableVegetable')}</TableHead>
                      <TableHead>{t('tableQuantityCarton')}</TableHead>
                      <TableHead>{t('tableCartonWeightKg')}</TableHead>
                      <TableHead>{t('tableTotalWeightKg')}</TableHead>
                      <TableHead>{t('tableCartonPrice')}</TableHead>
                      <TableHead>{t('tableKiloPrice')}</TableHead>
                      <TableHead>{t('tableTotal')}</TableHead>
                      <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>{t('tableActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.vegetable}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.weightPerCarton.toFixed(1)}</TableCell>
                        <TableCell>{item.totalWeight.toFixed(1)}</TableCell>
                        <TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell>
                        <TableCell>{item.pricePerKilo.toFixed(2)} {t('dinar')}</TableCell>
                        <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
                        <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}>
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => setEditingSale(item)} title={t('edit')}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => deleteItem(item.id)} title={t('deleteItem')}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t text-lg font-bold flex justify-between">
                <span>{t('totalSales')}:</span>
                <span>{totalSales.toFixed(2)} {t('dinar')}</span>
              </div>
            </CardContent>
          </Card>
        )}
        {editingSale && (
            <EditSaleDialog
                isOpen={!!editingSale}
                onClose={() => setEditingSale(null)}
                sale={editingSale}
                onSave={handleUpdateItem}
            />
        )}
    </>
  );
}
