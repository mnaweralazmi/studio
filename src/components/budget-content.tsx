
"use client"

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
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


// Schemas
const agricultureSalesSchema = z.object({
  product: z.string({ required_error: 'Please select a vegetable type.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  weightPerUnit: z.coerce.number().min(0.1, 'Weight must be at least 0.1 kg.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
});

const livestockSalesSchema = z.object({
  animalType: z.string({ required_error: 'Please select an animal type.' }),
  purpose: z.string({ required_error: 'Please select the purpose of sale.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
  age: z.coerce.number().min(0, 'Age cannot be negative.').optional(),
  weight: z.coerce.number().min(0, 'Weight cannot be negative.').optional(),
  gender: z.enum(['male', 'female']).optional(),
});

const poultrySalesSchema = z.object({
  poultryType: z.string({ required_error: 'Please select a poultry type.' }),
  purpose: z.string({ required_error: 'Please select the purpose of sale.' }),
  unit: z.enum(['piece', 'tray'], { required_error: 'Please select a unit.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
  age: z.coerce.number().min(0, 'Age cannot be negative.').optional(),
  weight: z.coerce.number().min(0, 'Weight cannot be negative.').optional(),
}).refine(data => data.unit === 'tray' ? data.weight === undefined || data.weight === null || data.weight === 0 : true, {
    message: "Weight is not applicable for trays.",
    path: ["weight"],
});

const fishSalesSchema = z.object({
  fishType: z.string({ required_error: 'Please select a fish type.' }),
  unit: z.enum(['kg', 'piece'], { required_error: 'Please select a unit.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
});

// Discriminated union for all sales types
const salesFormSchema = z.discriminatedUnion('departmentId', [
    z.object({ departmentId: z.literal('agriculture'), ...agricultureSalesSchema.shape }),
    z.object({ departmentId: z.literal('livestock'), ...livestockSalesSchema.shape }),
    z.object({ departmentId: z.literal('poultry'), ...poultrySalesSchema.shape }),
    z.object({ departmentId: z.literal('fish'), ...fishSalesSchema.shape }),
]);

export type SalesFormValues = z.infer<typeof salesFormSchema>;

export type SalesItem = SalesFormValues & {
  id: string;
  total: number;
  date: Date;
};

// Lists of options
const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;
const livestockListAr = ["خروف", "بقرة", "ناقة"] as const;
const livestockListEn = ["Sheep", "Cow", "Camel"] as const;
const poultryListAr = ["دجاج", "بط", "حمام", "رومي", "وز", "نعام"] as const;
const poultryListEn = ["Chicken", "Duck", "Pigeon", "Turkey", "Goose", "Ostrich"] as const;
const fishListAr = ["بلطي", "سيباس", "روبيان"] as const;
const fishListEn = ["Tilapia", "Sea Bass", "Shrimp"] as const;
const salePurposeAr = ["للذبح", "للتكاثر", "للحليب"] as const;
const salePurposeEn = ["For Slaughter", "For Breeding", "For Milk"] as const;
const poultryPurposeAr = ["للحم", "للبيض", "للتكاثر"] as const;
const poultryPurposeEn = ["For Meat", "For Eggs", "For Breeding"] as const;
const fishPurposeAr = ["للأكل", "للزينة"] as const;
const fishPurposeEn = ["For Eating", "For Decoration"] as const;

interface BudgetContentProps {
    departmentId: 'agriculture' | 'livestock' | 'poultry' | 'fish';
}

export function BudgetContent({ departmentId }: BudgetContentProps) {
  const [salesItems, setSalesItems] = React.useState<SalesItem[]>([]);
  const { toast } = useToast();
  const { user, loading: isAuthLoading } = useAuth();
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const { language, t } = useLanguage();
  const [editingSale, setEditingSale] = React.useState<SalesItem | null>(null);

  // Dynamic lists based on language
  const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;
  const livestockList = language === 'ar' ? livestockListAr : livestockListEn;
  const poultryList = language === 'ar' ? poultryListAr : poultryListEn;
  const fishList = language === 'ar' ? fishListAr : fishListEn;
  const salePurposeList = language === 'ar' ? salePurposeAr : salePurposeEn;
  const poultryPurposeList = language === 'ar' ? poultryPurposeAr : poultryPurposeEn;
  const fishPurposeList = language === 'ar' ? fishPurposeAr : fishPurposeEn;

  const currentSchema = React.useMemo(() => {
    switch (departmentId) {
        case 'livestock': return livestockSalesSchema;
        case 'poultry': return poultrySalesSchema;
        case 'fish': return fishSalesSchema;
        case 'agriculture':
        default:
            return agricultureSalesSchema;
    }
  }, [departmentId]);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { departmentId: departmentId },
  });

  React.useEffect(() => {
    form.reset({ departmentId: departmentId });
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

  const handleUpdateItem = async (id: string, data: SalesFormValues) => {
    // This function would need to be built out similarly to onSubmit
    // For now, we'll just show a success toast
    toast({ title: "Update functionality not fully implemented yet." });
  };

  async function onSubmit(data: SalesFormValues) {
    if (!user) {
        toast({ variant: "destructive", title: t('error'), description: "You must be logged in to add sales."});
        return;
    }
    
    const total = data.quantity * data.price;
    const submissionData = {
        ...data,
        total,
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
        
        form.reset({ departmentId: departmentId });
        
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

  const getDepartmentConfig = () => {
    switch (departmentId) {
        case 'livestock':
            return {
                title: t('livestockSales'),
                description: t('livestockSalesDesc'),
                formFields: (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name="animalType" render={({ field }) => ( <FormItem><FormLabel>{t('animalType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectAnimalType')} /></SelectTrigger></FormControl><SelectContent>{livestockList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="purpose" render={({ field }) => ( <FormItem><FormLabel>{t('purposeOfSale')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectPurpose')} /></SelectTrigger></FormControl><SelectContent>{salePurposeList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>{t('quantityInHead')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>{t('pricePerHead')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="age" render={({ field }) => ( <FormItem><FormLabel>{t('animalAge')} ({t('optional')})</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>{t('animalWeight')} ({t('optional')})</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem><FormLabel>{t('animalGender')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectGender')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">{t('male')}</SelectItem><SelectItem value="female">{t('female')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                     </div>
                ),
                tableHeaders: <><TableHead>{t('animalType')}</TableHead><TableHead>{t('quantityInHead')}</TableHead><TableHead>{t('pricePerHead')}</TableHead><TableHead>{t('tableTotal')}</TableHead><TableHead className="text-right">{t('tableActions')}</TableHead></>,
                tableRows: salesItems.map(item => item.departmentId === 'livestock' && <TableRow key={item.id}><TableCell>{item.animalType}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell><TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell><TableCell className="text-right">{renderActions(item)}</TableCell></TableRow>)
            };
        case 'poultry':
             const selectedUnit = form.watch('unit');
            return {
                title: t('poultrySales'),
                description: t('poultrySalesDesc'),
                formFields: (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name="poultryType" render={({ field }) => ( <FormItem><FormLabel>{t('poultryType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectPoultryType')} /></SelectTrigger></FormControl><SelectContent>{poultryList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="purpose" render={({ field }) => ( <FormItem><FormLabel>{t('purposeOfSale')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectPurpose')} /></SelectTrigger></FormControl><SelectContent>{poultryPurposeList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="unit" render={({ field }) => ( <FormItem><FormLabel>{t('unit')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectUnit')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="piece">{t('piece')}</SelectItem><SelectItem value="tray">{t('tray')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>{t('quantity')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>{t('unitPrice')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="age" render={({ field }) => ( <FormItem><FormLabel>{t('animalAge')} ({t('optional')})</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        {selectedUnit === 'piece' && <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>{t('animalWeight')} ({t('optional')})</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />}
                     </div>
                ),
                tableHeaders: <><TableHead>{t('poultryType')}</TableHead><TableHead>{t('quantity')}</TableHead><TableHead>{t('unit')}</TableHead><TableHead>{t('unitPrice')}</TableHead><TableHead>{t('tableTotal')}</TableHead><TableHead className="text-right">{t('tableActions')}</TableHead></>,
                tableRows: salesItems.map(item => item.departmentId === 'poultry' && <TableRow key={item.id}><TableCell>{item.poultryType}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{t(item.unit)}</TableCell><TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell><TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell><TableCell className="text-right">{renderActions(item)}</TableCell></TableRow>)
            };
        case 'fish':
            return {
                title: t('fishSales'),
                description: t('fishSalesDesc'),
                formFields: (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={form.control} name="fishType" render={({ field }) => ( <FormItem><FormLabel>{t('fishType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectFishType')} /></SelectTrigger></FormControl><SelectContent>{fishList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="unit" render={({ field }) => ( <FormItem><FormLabel>{t('unit')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectUnit')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="kg">{t('kg')}</SelectItem><SelectItem value="piece">{t('piece')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>{t('quantity')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>{t('unitPrice')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                ),
                tableHeaders: <><TableHead>{t('fishType')}</TableHead><TableHead>{t('quantity')}</TableHead><TableHead>{t('unit')}</TableHead><TableHead>{t('unitPrice')}</TableHead><TableHead>{t('tableTotal')}</TableHead><TableHead className="text-right">{t('tableActions')}</TableHead></>,
                tableRows: salesItems.map(item => item.departmentId === 'fish' && <TableRow key={item.id}><TableCell>{item.fishType}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{t(item.unit)}</TableCell><TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell><TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell><TableCell className="text-right">{renderActions(item)}</TableCell></TableRow>)
            };
        case 'agriculture':
        default:
            return {
                title: t('vegetableSalesTracker'),
                description: t('vegetableSalesTrackerDesc'),
                formFields: (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="product" render={({ field }) => ( <FormItem><FormLabel>{t('vegetableType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('selectVegetable')} /></SelectTrigger></FormControl><SelectContent>{vegetableList.map(veg => <SelectItem key={veg} value={veg}>{veg}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>{t('quantityInCartons')}</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="weightPerUnit" render={({ field }) => ( <FormItem><FormLabel>{t('weightPerCartonInKg')}</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>{t('pricePerCartonInDinar')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                ),
                tableHeaders: <><TableHead>{t('tableProduct')}</TableHead><TableHead>{t('tableQuantityCarton')}</TableHead><TableHead>{t('tableCartonPrice')}</TableHead><TableHead>{t('tableTotal')}</TableHead><TableHead className="text-right">{t('tableActions')}</TableHead></>,
                tableRows: salesItems.map(item => item.departmentId === 'agriculture' && <TableRow key={item.id}><TableCell>{item.product}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell><TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell><TableCell className="text-right">{renderActions(item)}</TableCell></TableRow>)
            };
    }
  };

  const { title, description, formFields, tableHeaders, tableRows } = getDepartmentConfig();
  
  if (isAuthLoading) {
      return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
  }

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6"/>
              {title}
            </CardTitle>
            <CardDescription>
             {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 {formFields}
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('add')}
                    </Button>
                </div>
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
                        {tableHeaders}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows}
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
    </div>
  );
}
