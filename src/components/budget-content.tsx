
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

// --- Start of schemas and types ---

const baseSalesSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
});

const agricultureSalesSchema = baseSalesSchema.extend({
  product: z.string({ required_error: 'Product selection is required.' }),
  weightPerUnit: z.coerce.number().min(0.1, 'Weight must be at least 0.1 kg.'),
  unit: z.literal('carton'),
});

const livestockSalesSchema = baseSalesSchema.extend({
  animalType: z.string({ required_error: "Animal type is required." }),
  purpose: z.string({ required_error: "Purpose is required." }),
  age: z.coerce.number().min(0, "Age cannot be negative."),
  weight: z.coerce.number().min(1, "Weight must be positive."),
  gender: z.enum(['male', 'female']),
  unit: z.literal('head'),
});

const poultrySalesSchema = baseSalesSchema.extend({
  poultryType: z.string({ required_error: "Poultry type is required." }),
  purpose: z.string({ required_error: "Purpose is required." }),
  unit: z.enum(['piece', 'tray']),
  weight: z.coerce.number().optional(), // Optional for eggs
});

const fishSalesSchema = baseSalesSchema.extend({
  fishType: z.string({ required_error: "Fish type is required." }),
  unit: z.enum(['kg', 'piece']),
});

const salesFormSchema = z.discriminatedUnion("departmentId", [
    z.object({ departmentId: z.literal('agriculture'), ...agricultureSalesSchema.shape }),
    z.object({ departmentId: z.literal('livestock'), ...livestockSalesSchema.shape }),
    z.object({ departmentId: z.literal('poultry'), ...poultrySalesSchema.shape }),
    z.object({ departmentId: z.literal('fish'), ...fishSalesSchema.shape }),
]);

type AgricultureSalesForm = z.infer<typeof agricultureSalesSchema>;
type LivestockSalesForm = z.infer<typeof livestockSalesSchema>;
type PoultrySalesForm = z.infer<typeof poultrySalesSchema>;
type FishSalesForm = z.infer<typeof fishSalesSchema>;

export type SalesFormValues = z.infer<typeof salesFormSchema>;

export type SalesItem = {
  id: string;
  total: number;
  date: Date;
} & (
  | AgricultureSalesForm & { departmentId: 'agriculture', pricePerKilo?: number, totalWeight?: number, }
  | LivestockSalesForm & { departmentId: 'livestock' }
  | PoultrySalesForm & { departmentId: 'poultry' }
  | FishSalesForm & { departmentId: 'fish' }
);


interface DepartmentConfig {
  titleKey: string;
  descriptionKey: string;
  formFields: React.ReactNode;
  tableHeaders: string[];
  renderRow: (item: SalesItem) => React.ReactNode;
  getCalculations: (data: any) => Partial<SalesItem>;
  validationSchema: z.ZodObject<any, any, any>;
}

// --- End of schemas and types ---


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

  // --- Start of Department Specific Data ---

  const departmentLists = {
    agriculture: {
      product: language === 'ar' ? ["طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل", "ورود"] : ["Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish", "Roses"],
    },
    livestock: {
      animalType: language === 'ar' ? ["خروف", "بقرة", "ناقة"] : ["Sheep", "Cow", "Camel"],
      purpose: language === 'ar' ? ["للذبح", "للتكاثر", "للحليب"] : ["For Slaughter", "For Breeding", "For Milk"],
      gender: language === 'ar' ? [{label: "ذكر", value: "male"}, {label: "أنثى", value: "female"}] : [{label: "Male", value: "male"}, {label: "Female", value: "female"}],
    },
    poultry: {
        poultryType: language === 'ar' ? ["دجاج", "بط", "حمام", "رومي", "نعام"] : ["Chicken", "Duck", "Pigeon", "Turkey", "Ostrich"],
        purpose: language === 'ar' ? ["للحم", "للبيض", "للتكاثر"] : ["For Meat", "For Eggs", "For Breeding"],
        unit: language === 'ar' ? [{label: "حبة", value: 'piece'}, {label: "طبق", value: 'tray'}] : [{label: "Piece", value: 'piece'}, {label: "Tray", value: 'tray'}],
    },
    fish: {
        fishType: language === 'ar' ? ["بلطي", "سيباس", "روبيان"] : ["Tilapia", "Sea Bass", "Shrimp"],
        unit: language === 'ar' ? [{label: "كيلو", value: 'kg'}, {label: "حبة", value: 'piece'}] : [{label: "Kg", value: 'kg'}, {label: "Piece", value: 'piece'}],
    }
  };

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
        departmentId: departmentId,
        // @ts-ignore
        quantity: 1,
        price: 0.1,
    }
  });
  
  const selectedPoultryUnit = form.watch('unit', 'piece');

  React.useEffect(() => {
    form.reset({
        departmentId: departmentId,
        // @ts-ignore
        quantity: 1,
        price: 0.1,
    });
  }, [departmentId, form]);

  const departmentConfig: Record<typeof departmentId, DepartmentConfig> = {
    agriculture: {
        titleKey: "vegetableSalesTracker",
        descriptionKey: "vegetableSalesTrackerDesc",
        validationSchema: agricultureSalesSchema,
        getCalculations: (data: AgricultureSalesForm) => {
            const total = data.quantity * data.price;
            const totalWeight = data.quantity * data.weightPerUnit;
            const pricePerKilo = totalWeight > 0 ? data.price / data.weightPerUnit : 0;
            return { total, totalWeight, pricePerKilo };
        },
        formFields: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="product" render={({ field }) => ( <FormItem> <FormLabel>{t('product')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder={t('selectProduct')} /> </SelectTrigger> </FormControl> <SelectContent> {departmentLists.agriculture.product.map(p => ( <SelectItem key={p} value={p}>{p}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem> <FormLabel>{t('quantityInCartons')}</FormLabel> <FormControl> <Input type="number" step="1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="weightPerUnit" render={({ field }) => ( <FormItem> <FormLabel>{t('weightPerCartonInKg')}</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>{t('pricePerCartonInDinar')}</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            </div>
        ),
        tableHeaders: [t('tableProduct'), t('tableQuantityCarton'), t('tableCartonWeightKg'), t('tableTotalWeightKg'), t('tableCartonPrice'), t('tableKiloPrice'), t('tableTotal'), t('tableActions')],
        renderRow: (item) => {
            if (item.departmentId !== 'agriculture') return null;
            return (
                <TableRow key={item.id}>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.weightPerUnit.toFixed(1)}</TableCell>
                    <TableCell>{(item.totalWeight ?? 0).toFixed(1)}</TableCell>
                    <TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell>{(item.pricePerKilo ?? 0).toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}> {renderActions(item)} </TableCell>
                </TableRow>
            );
        }
    },
    livestock: {
        titleKey: "livestockSales",
        descriptionKey: "livestockSalesDesc",
        validationSchema: livestockSalesSchema,
        getCalculations: (data: LivestockSalesForm) => ({ total: data.quantity * data.price }),
        formFields: (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="animalType" render={({ field }) => ( <FormItem> <FormLabel>{t('animalType')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectAnimalType')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.livestock.animalType.map(p => ( <SelectItem key={p} value={p}>{p}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="purpose" render={({ field }) => ( <FormItem> <FormLabel>{t('purposeOfSale')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectPurpose')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.livestock.purpose.map(p => ( <SelectItem key={p} value={p}>{p}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem> <FormLabel>{t('quantityInHead')}</FormLabel> <FormControl> <Input type="number" step="1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>{t('pricePerHead')}</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="age" render={({ field }) => ( <FormItem> <FormLabel>{t('animalAge')}</FormLabel> <FormControl> <Input type="number" step="1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem> <FormLabel>{t('animalWeight')}</FormLabel> <FormControl> <Input type="number" step="1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem> <FormLabel>{t('animalGender')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectGender')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.livestock.gender.map(g => ( <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
            </div>
        ),
        tableHeaders: [t('animalType'), t('purposeOfSale'), t('quantity'), t('pricePerHead'), t('animalAge'), t('animalWeight'), t('animalGender'), t('tableTotal'), t('tableActions')],
        renderRow: (item) => {
            if (item.departmentId !== 'livestock') return null;
            return (
                <TableRow key={item.id}>
                    <TableCell>{item.animalType}</TableCell>
                    <TableCell>{item.purpose}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell>{item.age}</TableCell>
                    <TableCell>{item.weight} kg</TableCell>
                    <TableCell>{t(item.gender as any)}</TableCell>
                    <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}> {renderActions(item)} </TableCell>
                </TableRow>
            )
        }
    },
    poultry: {
        titleKey: "poultrySales",
        descriptionKey: "poultrySalesDesc",
        validationSchema: poultrySalesSchema,
        getCalculations: (data: PoultrySalesForm) => ({ total: data.quantity * data.price }),
        formFields: (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="poultryType" render={({ field }) => ( <FormItem> <FormLabel>{t('poultryType')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectPoultryType')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.poultry.poultryType.map(p => ( <SelectItem key={p} value={p}>{p}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="purpose" render={({ field }) => ( <FormItem> <FormLabel>{t('purposeOfSale')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectPurpose')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.poultry.purpose.map(p => ( <SelectItem key={p} value={p}>{p}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="unit" render={({ field }) => ( <FormItem> <FormLabel>{t('unit')}</FormLabel> <Select onValueChange={(val) => { field.onChange(val); if(val === 'tray') form.setValue('weight', undefined);}} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectUnit')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.poultry.unit.map(u => ( <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem> <FormLabel>{t('quantity')}</FormLabel> <FormControl> <Input type="number" step="1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>{t('unitPrice')}</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                {selectedPoultryUnit === 'piece' && (
                    <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('animalWeight')}</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        ),
        tableHeaders: [t('poultryType'), t('purposeOfSale'), t('quantity'), t('unit'), t('unitPrice'), t('animalWeight'), t('tableTotal'), t('tableActions')],
        renderRow: (item) => {
            if (item.departmentId !== 'poultry') return null;
            return (
                <TableRow key={item.id}>
                    <TableCell>{item.poultryType}</TableCell>
                    <TableCell>{item.purpose}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{t(item.unit as any)}</TableCell>
                    <TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell>{item.weight ? `${item.weight} kg` : 'N/A'}</TableCell>
                    <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}> {renderActions(item)} </TableCell>
                </TableRow>
            )
        }
    },
    fish: {
        titleKey: "fishSales",
        descriptionKey: "fishSalesDesc",
        validationSchema: fishSalesSchema,
        getCalculations: (data: FishSalesForm) => ({ total: data.quantity * data.price }),
        formFields: (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="fishType" render={({ field }) => ( <FormItem> <FormLabel>{t('fishType')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectFishType')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.fish.fishType.map(f => ( <SelectItem key={f} value={f}>{f}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="unit" render={({ field }) => ( <FormItem> <FormLabel>{t('unit')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger><SelectValue placeholder={t('selectUnit')} /></SelectTrigger> </FormControl> <SelectContent> {departmentLists.fish.unit.map(u => ( <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem> <FormLabel>{t('quantity')}</FormLabel> <FormControl> <Input type="number" step="1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>{t('unitPrice')}</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            </div>
        ),
        tableHeaders: [t('fishType'), t('quantity'), t('unit'), t('unitPrice'), t('tableTotal'), t('tableActions')],
        renderRow: (item) => {
            if (item.departmentId !== 'fish') return null;
            return (
                <TableRow key={item.id}>
                    <TableCell>{item.fishType}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{t(item.unit as any)}</TableCell>
                    <TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
                    <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}> {renderActions(item)} </TableCell>
                </TableRow>
            )
        }
    },
  };
  
  const currentConfig = departmentConfig[departmentId];

  // --- End of Department Specific Data ---

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
                    departmentId: departmentId,
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

  const handleUpdateItem = async (id: string, data: any) => {
    if (!user) return;

    const calculations = currentConfig.getCalculations(data);
    
    try {
        const saleDocRef = doc(db, 'users', user.uid, 'departments', departmentId, 'sales', id);
        const saleToUpdate = salesItems.find(s => s.id === id);
        if (!saleToUpdate) return;
        
        await setDoc(saleDocRef, {
            ...data,
            ...calculations,
            date: Timestamp.fromDate(saleToUpdate.date),
        });

        setSalesItems(prevItems => prevItems.map(item => item.id === id ? {
            ...item,
            ...data,
            ...calculations,
        } as SalesItem : item));
        
        toast({ title: t('salesUpdatedSuccess') });
        setEditingSale(null);

    } catch (e) {
        console.error("Error updating document: ", e);
        toast({ variant: "destructive", title: t('error'), description: "Failed to update sale."});
    }
  };


  async function onSubmit(data: any) {
    if (!user) {
        toast({ variant: "destructive", title: t('error'), description: "You must be logged in to add sales."});
        return;
    }
    
    const calculations = currentConfig.getCalculations(data);

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
             transaction.set(docRef, {
                ...data,
                ...calculations,
                date: Timestamp.fromDate(new Date()),
            });

            const newItem: SalesItem = {
              ...data,
              ...calculations,
              id: docRef.id,
              date: new Date(),
              departmentId: departmentId,
            } as SalesItem;

            setSalesItems(prevItems => [newItem, ...prevItems]);
            
            if(badgeAwarded) {
                toast({ title: t('badgeEarned'), description: t('badgeTraderDesc') });
            }
        });
        
        form.reset({
            departmentId: departmentId,
            // @ts-ignore
            quantity: 1,
            price: 0.1,
        });
        
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
        <Button variant="ghost" size="icon" onClick={() => setEditingSale(item)} title={t('edit')}>
            <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon" onClick={() => deleteItem(item.id)} title={t('deleteItem')}>
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>
  );

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
              {t(currentConfig.titleKey as any)}
            </CardTitle>
            <CardDescription>
             {t(currentConfig.descriptionKey as any)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {currentConfig.formFields}
                <div className="flex justify-end">
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
                      {currentConfig.tableHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesItems.map(item => currentConfig.renderRow(item))}
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
                // @ts-ignore
                sale={editingSale}
                onSave={handleUpdateItem}
            />
        )}
    </>
  );
}
