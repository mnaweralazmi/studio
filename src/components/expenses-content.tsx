
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Repeat, Trash2, PlusCircle, TrendingUp, Pencil } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, Timestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { EditExpenseDialog } from './expenses/edit-expense-dialog';


const initialExpenseCategoriesAr: Record<string, string[]> = {
  "فواتير": ["كهرباء", "ماء", "انترنت", "هاتف"],
  "مستلزمات زراعية": ["بذور", "أسمدة", "تربة", "مبيدات", "أدوات"],
  "صيانة": ["معدات", "مباني"],
  "وقود ومركبات": ["بنزين", "ديزل", "صيانة مركبة"],
  "عمالة": ["رواتب", "أعمال يومية"],
  "نثريات": ["إدارية", "طعام وشراب", "طوارئ"],
};

const initialExpenseCategoriesEn: Record<string, string[]> = {
    "Bills": ["Electricity", "Water", "Internet", "Phone"],
    "Farming Supplies": ["Seeds", "Fertilizers", "Soil", "Pesticides", "Tools"],
    "Maintenance": ["Equipment", "Buildings"],
    "Fuel & Vehicles": ["Gasoline", "Diesel", "Vehicle Maintenance"],
    "Labor": ["Salaries", "Daily Wages"],
    "Miscellaneous": ["Admin", "Food & Drink", "Emergencies"],
};

const expenseFormSchema = z.object({
  type: z.enum(['fixed', 'variable'], { required_error: "الرجاء تحديد نوع المصروف." }),
  category: z.string({
    required_error: "الرجاء اختيار الفئة.",
  }),
  item: z.string({ required_error: "الرجاء اختيار البند." }),
  newItemName: z.string().optional(),
  amount: z.coerce.number().min(0.01, "يجب أن يكون المبلغ إيجابياً."),
}).refine(data => {
    if (data.item === 'add_new_item') {
        return !!data.newItemName && data.newItemName.length > 2;
    }
    return true;
}, {
    message: "الرجاء إدخال اسم بند جديد (3 أحرف على الأقل).",
    path: ['newItemName'],
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export type ExpenseItem = Omit<ExpenseFormValues, 'newItemName'> & {
  id: string;
  date: Date;
};

export function ExpensesContent() {
    const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
    const { language, t } = useLanguage();
    const [expenseCategories, setExpenseCategories] = React.useState<Record<string, string[]>>({});
    const [isDataLoading, setIsDataLoading] = React.useState(true);
    const { toast } = useToast();
    const { user } = useAuth();
    const [editingExpense, setEditingExpense] = React.useState<ExpenseItem | null>(null);

    const getCategoriesKey = React.useCallback(() => {
        return user ? `expenseCategories_${user.uid}_${language}` : `expenseCategories_guest_${language}`;
    }, [user, language]);

    React.useEffect(() => {
        const fetchExpensesAndCategories = async () => {
            if (user) {
                setIsDataLoading(true);
                try {
                    // Fetch expenses
                    const expensesCollectionRef = collection(db, 'users', user.uid, 'expenses');
                    const expensesSnapshot = await getDocs(expensesCollectionRef);
                    const fetchedExpenses = expensesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: (doc.data().date as Timestamp).toDate()
                    })) as ExpenseItem[];
                    setExpenses(fetchedExpenses);

                    // Fetch categories
                    const categoriesDocRef = doc(db, 'users', user.uid, 'appData', `expenseCategories_${language}`);
                    const categoriesDoc = await getDoc(categoriesDocRef);
                     if (categoriesDoc.exists()) {
                         setExpenseCategories(categoriesDoc.data().categories);
                     } else {
                         setExpenseCategories(language === 'ar' ? initialExpenseCategoriesAr : initialExpenseCategoriesEn);
                     }

                } catch (e) {
                    console.error("Error fetching data: ", e);
                    toast({ variant: "destructive", title: t('error'), description: "Failed to load expenses data." });
                } finally {
                    setIsDataLoading(false);
                }
            } else {
                setExpenses([]);
                setExpenseCategories(language === 'ar' ? initialExpenseCategoriesAr : initialExpenseCategoriesEn);
                setIsDataLoading(false);
            }
        };
        fetchExpensesAndCategories();
    }, [user, language, toast, t]);
    
    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema),
        defaultValues: {
            amount: 0.01,
            newItemName: '',
            type: undefined,
            category: undefined,
            item: undefined,
        },
    });

    const selectedCategory = form.watch("category");
    const selectedItem = form.watch("item");

    async function updateCategoriesInDb(newCategories: Record<string, string[]>) {
        if (!user) return;
        try {
            const categoriesDocRef = doc(db, 'users', user.uid, 'appData', `expenseCategories_${language}`);
            await setDoc(categoriesDocRef, { categories: newCategories });
        } catch (e) {
            console.error("Error updating categories: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save new category."});
        }
    }

    async function handleUpdateExpense(id: string, data: ExpenseFormValues) {
        if (!user) return;

        let finalItemName = data.item;
        let finalCategories = expenseCategories;
        let categoriesChanged = false;

        if (data.item === 'add_new_item' && data.newItemName) {
            finalItemName = data.newItemName;
            const newCategories = { ...expenseCategories };
            if (data.category && !newCategories[data.category].includes(data.newItemName!)) {
                newCategories[data.category] = [...newCategories[data.category], data.newItemName!];
                finalCategories = newCategories;
                setExpenseCategories(finalCategories);
                categoriesChanged = true;
            }
        }
        
        const expenseToUpdate = expenses.find(e => e.id === id);
        if (!expenseToUpdate) return;
        
        try {
            const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
            const updatedData = {
                type: data.type,
                category: data.category,
                item: finalItemName,
                amount: data.amount,
                date: Timestamp.fromDate(expenseToUpdate.date),
            };
            await updateDoc(expenseDocRef, updatedData);
            
            if (categoriesChanged) {
                await updateCategoriesInDb(finalCategories);
            }

            setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updatedData, date: expenseToUpdate.date } : e));
            setEditingExpense(null);
            toast({ title: t('expenseUpdatedSuccess') });
        } catch(e) {
             console.error("Error updating expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to update expense." });
        }

    }


    async function onSubmit(data: ExpenseFormValues) {
        if (!user) {
             toast({ variant: "destructive", title: t('error'), description: "You must be logged in to add expenses."});
            return;
        }

        let finalItemName = data.item;
        let finalCategories = expenseCategories;

        if (data.item === 'add_new_item' && data.newItemName) {
            finalItemName = data.newItemName;
            const newCategories = { ...expenseCategories };
            if (data.category && !newCategories[data.category].includes(data.newItemName!)) {
                newCategories[data.category] = [...newCategories[data.category], data.newItemName!];
                finalCategories = newCategories;
                setExpenseCategories(finalCategories);
                await updateCategoriesInDb(finalCategories);
            }
        }

        const newExpenseData = {
            id: Date.now().toString(),
            date: Timestamp.fromDate(new Date()),
            type: data.type,
            category: data.category,
            item: finalItemName,
            amount: data.amount,
        };

        try {
            const expensesCollectionRef = collection(db, 'users', user.uid, 'expenses');
            const docRef = await addDoc(expensesCollectionRef, newExpenseData);
            
            const newExpense: ExpenseItem = {
              id: docRef.id,
              date: new Date(),
              type: data.type,
              category: data.category,
              item: finalItemName,
              amount: data.amount,
            };

            setExpenses(prev => [...prev, newExpense]);
            form.reset({
                 type: undefined,
                 category: undefined,
                 item: undefined,
                 amount: 0.01,
                 newItemName: '',
            });
            form.clearErrors();
            toast({ title: t('expenseAddedSuccess') });
        } catch(e) {
            console.error("Error adding expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save expense." });
        }
    }

    async function deleteExpense(id: string) {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
            setExpenses(prev => prev.filter(item => item.id !== id));
            toast({ variant: "destructive", title: t('expenseDeleted') });
        } catch(e) {
            console.error("Error deleting expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to delete expense." });
        }
    }

    const fixedExpenses = expenses.filter(e => e.type === 'fixed');
    const variableExpenses = expenses.filter(e => e.type === 'variable');

    const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, item) => sum + item.amount, 0);

    if (!user) {
      return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                        {t('expenseManagement')}
                    </CardTitle>
                    <CardDescription>
                        {t('expenseManagementDesc')}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalFixedExpenses')}</CardTitle>
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFixedExpenses.toFixed(2)} {t('dinar')}</div>
                        <p className="text-xs text-muted-foreground">{t('totalFixedExpensesDesc')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalVariableExpenses')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVariableExpenses.toFixed(2)} {t('dinar')}</div>
                        <p className="text-xs text-muted-foreground">{t('totalVariableExpensesDesc')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">{t('addNewExpense')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('expenseType')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder={t('selectType')} /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="fixed">{t('expenseTypeFixed')}</SelectItem>
                                                <SelectItem value="variable">{t('expenseTypeVariable')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('category')}</FormLabel>
                                        <Select onValueChange={(value) => {
                                            field.onChange(value);
                                            form.setValue("item", undefined);
                                        }} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.keys(expenseCategories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                {selectedCategory && (
                                <FormField control={form.control} name="item" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('item')}</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder={t('selectItem')} /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {expenseCategories[selectedCategory]?.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                                <SelectItem value="add_new_item">{t('addNewItem')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                )}
                            </div>

                            {selectedItem === 'add_new_item' && (
                                <FormField control={form.control} name="newItemName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('newItemName')}</FormLabel>
                                        <FormControl><Input placeholder={t('newItemNamePlaceholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}
                            
                             <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('amountInDinar')}</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <div className="flex justify-end pt-4">
                                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />{t('add')}</Button>
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
            ) : (fixedExpenses.length > 0 || variableExpenses.length > 0) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl">{t('expensesList')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        {fixedExpenses.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold mb-2"><Repeat className="h-5 w-5" />{t('fixedMonthlyExpenses')}</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow><TableHead>{t('tableCategory')}</TableHead><TableHead>{t('tableItem')}</TableHead><TableHead className="text-right">{t('tableAmount')}</TableHead><TableHead className="text-right">{t('tableAction')}</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {fixedExpenses.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.category}</TableCell>
                                                <TableCell className="font-medium">{item.item}</TableCell>
                                                <TableCell className="text-right">{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                                <TableCell className="text-right">
                                                     <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingExpense(item)} title={t('edit')}><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="destructive" size="icon" onClick={() => deleteExpense(item.id)} title={t('delete')}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        )}

                        {variableExpenses.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold mb-2"><TrendingUp className="h-5 w-5" />{t('variableExpenses')}</h3>
                             <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow><TableHead>{t('tableCategory')}</TableHead><TableHead>{t('tableItem')}</TableHead><TableHead>{t('tableDate')}</TableHead><TableHead className="text-right">{t('tableAmount')}</TableHead><TableHead className="text-right">{t('tableAction')}</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {variableExpenses.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.category}</TableCell>
                                                <TableCell className="font-medium">{item.item}</TableCell>
                                                <TableCell>{new Date(item.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</TableCell>
                                                <TableCell className="text-right">{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingExpense(item)} title={t('edit')}><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="destructive" size="icon" onClick={() => deleteExpense(item.id)} title={t('delete')}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
            )}
            {editingExpense && (
                <EditExpenseDialog
                    isOpen={!!editingExpense}
                    onClose={() => setEditingExpense(null)}
                    expense={editingExpense}
                    onSave={handleUpdateExpense}
                    expenseCategories={expenseCategories}
                />
            )}
        </>
    );
}
