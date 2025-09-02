
"use client"

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PlusCircle, Trash2, Wallet, Pencil } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, where, writeBatch, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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


// Simplified type, no Zod
export type SalesItem = {
  id: string;
  product: string;
  quantity: number;
  weightPerUnit?: number;
  price: number;
  total: number;
  date: Date;
  departmentId: string;
};

// Data lists
const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;

const livestockListAr = ["خروف", "بقرة", "جمل", "ماعز"];
const livestockListEn = ["Sheep", "Cow", "Camel", "Goat"];

const poultryListAr = ["دجاج لاحم", "دجاج بياض", "بيض"];
const poultryListEn = ["Broiler Chicken", "Layer Chicken", "Eggs"];

const fishListAr = ["سبيطي", "هامور", "شعم"];
const fishListEn = ["Spgre", "Hamour", "Sheim"];


interface BudgetContentProps {
    departmentId: 'agriculture' | 'livestock' | 'poultry' | 'fish';
}

function EditSaleDialog({ sale, onSave, children }: { sale: SalesItem, onSave: (id: string, data: Partial<SalesItem>) => void, children: React.ReactNode }) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const quantity = Number(formData.get('quantity'));
        const price = Number(formData.get('price'));

        if (quantity <= 0 || price <= 0) {
            return;
        }

        const updatedData: Partial<SalesItem> = {
            quantity,
            price,
            total: quantity * price
        };
        onSave(sale.id, updatedData);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editSale')}</DialogTitle>
                    <DialogDescription>{t('editSaleDesc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">{t('quantity')}</Label>
                        <Input id="quantity" name="quantity" type="number" step="1" defaultValue={sale.quantity} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">{t('unitPrice')}</Label>
                        <Input id="price" name="price" type="number" step="0.01" defaultValue={sale.price} required />
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

export function BudgetContent({ departmentId }: BudgetContentProps) {
  const [salesItems, setSalesItems] = React.useState<SalesItem[]>([]);
  const { toast } = useToast();
  const { user: authUser, loading: isAuthLoading } = useAuth();
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const { language, t } = useLanguage();
  const formRef = React.useRef<HTMLFormElement>(null);
  
  const targetUserId = authUser?.uid;

  const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;
  const livestockList = language === 'ar' ? livestockListAr : livestockListEn;
  const poultryList = language === 'ar' ? poultryListAr : poultryListEn;
  const fishList = language === 'ar' ? fishListAr : fishListEn;

  const fetchSales = React.useCallback(async () => {
    if (!targetUserId) return;
      
    setIsDataLoading(true);
    try {
        const salesCollectionRef = collection(db, 'users', targetUserId, 'sales');
        const q = query(salesCollectionRef, where("departmentId", "==", departmentId));
        const querySnapshot = await getDocs(q);
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
  }, [targetUserId, departmentId, toast, t]);

  React.useEffect(() => {
    if (targetUserId) {
        fetchSales();
    } else {
        setIsDataLoading(false);
        setSalesItems([]);
    }
  }, [departmentId, fetchSales, targetUserId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetUserId) {
        toast({ variant: "destructive", title: t('error'), description: "You cannot add sales for this user."});
        return;
    }
    
    const formData = new FormData(event.currentTarget);
    const product = formData.get('product') as string;
    const quantity = Number(formData.get('quantity'));
    const price = Number(formData.get('price'));
    const weightPerUnit = formData.has('weightPerUnit') ? Number(formData.get('weightPerUnit')) : undefined;

    if (!product || quantity <= 0 || price <= 0) {
        toast({ variant: "destructive", title: t('error'), description: "Please fill all fields correctly."});
        return;
    }

    const total = quantity * price;
    const submissionData = {
        product,
        quantity,
        price,
        total,
        departmentId,
        date: Timestamp.fromDate(new Date()),
        ...(weightPerUnit !== undefined && { weightPerUnit }),
    };

    try {
        const userRef = doc(db, 'users', targetUserId);
        const salesCollectionRef = collection(db, 'users', targetUserId, 'sales');

        const docRef = await addDoc(salesCollectionRef, submissionData);

        const newItem: SalesItem = {
          ...(submissionData as any),
          id: docRef.id,
          date: new Date(),
        };
        setSalesItems(prevItems => [newItem, ...prevItems].sort((a,b) => b.date.getTime() - a.date.getTime()));

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            
            const currentBadges = userDoc.data().badges || [];
            if (!currentBadges.includes('trader')) {
                let newPoints = userDoc.data().points || 0;
                let newBadges = [...currentBadges];
                newPoints += 25;
                newBadges.push('trader');
                const newLevel = Math.floor(newPoints / 100) + 1;
                transaction.update(userRef, { points: newPoints, level: newLevel, badges: newBadges });
                toast({ title: t('badgeEarned'), description: t('badgeTraderDesc') });
            }
        });
        
        formRef.current?.reset();
        
        toast({
          title: t('salesAddedSuccess'),
        });

    } catch (e) {
        console.error("Error adding document: ", e);
        toast({ variant: "destructive", title: t('error'), description: "Failed to save sale."});
    }
  }
  
  async function deleteItem(id: string) {
    if (!targetUserId) return;
    try {
        const saleDocRef = doc(db, 'users', targetUserId, 'sales', id);
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

  async function handleSave(id: string, data: Partial<SalesItem>) {
    if (!targetUserId) return;
    try {
        const saleDocRef = doc(db, 'users', targetUserId, 'sales', id);
        await updateDoc(saleDocRef, data);
        setSalesItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
        toast({ title: t('salesUpdatedSuccess') });
    } catch (e) {
        console.error("Error updating document: ", e);
        toast({ variant: "destructive", title: t('error'), description: "Failed to update sale." });
    }
  }

  const renderActions = (item: SalesItem) => (
      <div className="flex gap-2 justify-end">
        <EditSaleDialog sale={item} onSave={handleSave}>
            <Button variant="ghost" size="icon" title={t('edit')}><Pencil className="h-4 w-4" /></Button>
        </EditSaleDialog>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" title={t('deleteItem')}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('confirmDeleteTopicDesc', { topicName: item.product })}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteItem(item.id)}>{t('confirmDelete')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
  );

  const totalSales = salesItems.reduce((sum, item) => sum + item.total, 0);

  const renderFormFields = () => {
    const commonFields = (
        <>
            <div className="space-y-2">
                <Label htmlFor="quantity">{t('quantity')}</Label>
                <Input id="quantity" name="quantity" type="number" step="1" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="price">{t('unitPrice')}</Label>
                <Input id="price" name="price" type="number" step="0.01" required />
            </div>
        </>
    );

    switch(departmentId) {
        case 'agriculture':
            return (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="product">{t('vegetableType')}</Label>
                        <Select name="product" required>
                            <SelectTrigger id="product"><SelectValue placeholder={t('selectVegetable')} /></SelectTrigger>
                            <SelectContent>{vegetableList.map(veg => <SelectItem key={veg} value={veg}>{veg}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="quantity">{t('quantityInCartons')}</Label>
                        <Input id="quantity" name="quantity" type="number" step="1" required/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="weightPerUnit">{t('weightPerCartonInKg')}</Label>
                        <Input id="weightPerUnit" name="weightPerUnit" type="number" step="0.1" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="price">{t('pricePerCartonInDinar')}</Label>
                        <Input id="price" name="price" type="number" step="0.01" required/>
                    </div>
                </div>
            )
        case 'livestock':
             return (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="product">{t('animalType')}</Label>
                        <Select name="product" required>
                            <SelectTrigger id="product"><SelectValue placeholder={t('selectAnimalType')} /></SelectTrigger>
                            <SelectContent>{livestockList.map(animal => <SelectItem key={animal} value={animal}>{animal}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="quantity">{t('quantityInHead')}</Label>
                        <Input id="quantity" name="quantity" type="number" step="1" required/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="price">{t('pricePerHead')}</Label>
                        <Input id="price" name="price" type="number" step="0.01" required/>
                    </div>
                </div>
            )
        case 'poultry':
             return (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="product">{t('poultryType')}</Label>
                        <Select name="product" required>
                            <SelectTrigger id="product"><SelectValue placeholder={t('selectPoultryType')} /></SelectTrigger>
                            <SelectContent>{poultryList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {commonFields}
                </div>
            )
        case 'fish':
             return (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="product">{t('fishType')}</Label>
                        <Select name="product" required>
                            <SelectTrigger id="product"><SelectValue placeholder={t('selectFishType')} /></SelectTrigger>
                            <SelectContent>{fishList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quantity">{t('quantity')} ({t('kg')})</Label>
                        <Input id="quantity" name="quantity" type="number" step="0.1" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="price">{t('unitPrice')} ({t('dinar')}/{t('kg')})</Label>
                        <Input id="price" name="price" type="number" step="0.01" required />
                    </div>
                </div>
            )
    }
  }

  const renderTable = () => {
     return (
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead>{t('tableProduct')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                {departmentId === 'agriculture' && <TableHead>{t('tableCartonWeightKg')}</TableHead>}
                <TableHead>{t('unitPrice')}</TableHead>
                <TableHead>{t('tableTotal')}</TableHead>
                <TableHead className="text-right">{t('tableActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {salesItems.map(item => (
                 <TableRow key={item.id}>
                     <TableCell>{item.product}</TableCell>
                     <TableCell>{item.quantity}</TableCell>
                     {departmentId === 'agriculture' && <TableCell>{item.weightPerUnit || '-'}</TableCell>}
                     <TableCell>{item.price.toFixed(2)} {t('dinar')}</TableCell>
                     <TableCell>{item.total.toFixed(2)} {t('dinar')}</TableCell>
                     <TableCell className="text-right">{renderActions(item)}</TableCell>
                 </TableRow>
             ))}
          </TableBody>
        </Table>
    )
  }
  
  if (isAuthLoading) {
      return (
        <div className="space-y-6">
            <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
            <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      )
  }

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6"/>
              {t('sales')}
            </CardTitle>
            <CardDescription>
             {t(`${departmentId}SalesDesc` as any)}
            </CardDescription>
          </CardHeader>
          <CardContent>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                 {renderFormFields()}
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('add')}
                    </Button>
                </div>
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
        ) : salesItems.length > 0 ? (
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
        ) : null}
    </div>
  );
}
