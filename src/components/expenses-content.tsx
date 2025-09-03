
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Repeat, PlusCircle, TrendingUp, Pencil } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { collection, addDoc, getDocs, doc, Timestamp, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ExpenseItem = {
  id: string;
  date: Date;
  type: 'fixed' | 'variable';
  category: string;
  item: string;
  amount: number;
  departmentId: string;
};

const getInitialCategories = (language: 'ar' | 'en', departmentId: string): Record<string, string[]> => {
    if (language === 'ar') {
        switch (departmentId) {
            case 'agriculture': return { "مستلزمات زراعية": ["بذور", "أسمدة", "تربة", "مبيدات", "أدوات"], "خدمات": ["كهرباء", "ماء"], "صيانة": ["معدات", "مباني"] };
            case 'livestock': return { "تغذية": ["أعلاف", "ماء"], "رعاية صحية": ["أدوية", "فيتامينات", "تطعيمات"], "بنية تحتية": ["صيانة حظائر"] };
            case 'poultry': return { "تغذية": ["أعلاف", "ماء"], "رعاية صحية": ["أدوية", "تحصينات"], "بنية تحتية": ["صيانة حظائر"] };
            case 'fish': return { "تغذية": ["أعلاف أسماك"], "صيانة": ["صيانة أحواض", "أنظمة ترشيح"], "خدمات": ["كهرباء", "أكسجين"] };
            default: return {};
        }
    } else {
         switch (departmentId) {
            case 'agriculture': return { "Farming Supplies": ["Seeds", "Fertilizers", "Soil", "Pesticides", "Tools"], "Utilities": ["Electricity", "Water"], "Maintenance": ["Equipment", "Buildings"] };
            case 'livestock': return { "Feed": ["Fodder", "Water"], "Healthcare": ["Medicine", "Vitamins", "Vaccinations"], "Infrastructure": ["Barn Maintenance"] };
            case 'poultry': return { "Feed": ["Fodder", "Water"], "Healthcare": ["Medicine", "Vaccinations"], "Infrastructure": ["Coop Maintenance"] };
            case 'fish': return { "Feed": ["Fish Feed"], "Maintenance": ["Tank Maintenance", "Filtration Systems"], "Utilities": ["Electricity", "Oxygen"] };
            default: return {};
        }
    }
};

interface ExpensesContentProps {
    departmentId: string;
}

function EditExpenseDialog({ expense, onSave, children, categories }: { expense: ExpenseItem, onSave: (id: string, data: Partial<ExpenseItem>) => void, children: React.ReactNode, categories: Record<string, string[]> }) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState(expense.category);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const type = formData.get('type') as 'fixed' | 'variable';
        const category = formData.get('category') as string;
        const item = formData.get('item') as string;
        const amount = Number(formData.get('amount'));

        if (!type || !category || !item || amount <= 0) return;

        onSave(expense.id, { type, category, item, amount });
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editExpense')}</DialogTitle>
                </DialogHeader>
                 <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">{t('expenseType')}</Label>
                        <Select name="type" defaultValue={expense.type}>
                            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixed">{t('expenseTypeFixed')}</SelectItem>
                                <SelectItem value="variable">{t('expenseTypeVariable')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">{t('category')}</Label>
                        <Select name="category" defaultValue={expense.category} onValueChange={setSelectedCategory}>
                            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(categories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="item">{t('item')}</Label>
                        <Select name="item" defaultValue={expense.item} disabled={!selectedCategory}>
                            <SelectTrigger id="item"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories[selectedCategory]?.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t('amountInDinar')}</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={expense.amount} required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit">{t('saveChanges')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function ExpensesContent({ departmentId }: ExpensesContentProps) {
    const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
    const { language, t } = useLanguage();
    const [expenseCategories, setExpenseCategories] = React.useState<Record<string, string[]>>({});
    const [isDataLoading, setIsDataLoading] = React.useState(true);
    const { toast } = useToast();
    const { user: authUser, loading: isAuthLoading } = useAuth();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [selectedCategory, setSelectedCategory] = React.useState<string>('');

    const targetUserId = authUser?.uid;

    React.useEffect(() => {
        const fetchExpensesAndCategories = async () => {
            if (!targetUserId) {
                setIsDataLoading(false);
                return;
            }

            setIsDataLoading(true);
            
            try {
                setExpenseCategories(getInitialCategories(language, departmentId));

                const expensesCollectionRef = collection(db, 'users', targetUserId, 'expenses');
                const q = query(expensesCollectionRef, where("departmentId", "==", departmentId));
                const expensesSnapshot = await getDocs(q);
                const fetchedExpenses = expensesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: (doc.data().date as Timestamp).toDate()
                })) as ExpenseItem[];
                setExpenses(fetchedExpenses.sort((a,b) => b.date.getTime() - a.date.getTime()));

            } catch (e) {
                console.error("Error fetching data: ", e);
                setExpenseCategories(getInitialCategories(language, departmentId));
            } finally {
                setIsDataLoading(false);
            }
        };

        if (targetUserId) {
            fetchExpensesAndCategories();
        } else if (!isAuthLoading) {
            setExpenses([]);
            setExpenseCategories(getInitialCategories(language, departmentId || 'agriculture'));
            setIsDataLoading(false);
        }
    }, [targetUserId, language, departmentId, isAuthLoading]);
    
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!targetUserId) {
             toast({ variant: "destructive", title: t('error'), description: "You cannot add expenses for this user."});
            return;
        }

        const formData = new FormData(event.currentTarget);
        const data = {
            type: formData.get('type') as 'fixed' | 'variable',
            category: formData.get('category') as string,
            item: formData.get('item') as string,
            amount: Number(formData.get('amount')),
        };

        if (!data.type || !data.category || !data.item || data.amount <= 0) {
            toast({ variant: "destructive", title: t('error'), description: "Please fill all fields correctly."});
            return;
        }
        
        const newExpenseData = {
            date: Timestamp.fromDate(new Date()),
            type: data.type,
            category: data.category,
            item: data.item,
            amount: data.amount,
            departmentId,
        };

        try {
            const expensesCollectionRef = collection(db, 'users', targetUserId, 'expenses');
            const docRef = await addDoc(expensesCollectionRef, newExpenseData);
            
            const newExpense: ExpenseItem = {
              id: docRef.id,
              date: new Date(),
              ...data,
              departmentId,
            };

            setExpenses(prev => [...prev, newExpense].sort((a,b) => b.date.getTime() - a.date.getTime()));
            formRef.current?.reset();
            setSelectedCategory('');
            toast({ title: t('expenseAddedSuccess') });
        } catch(e) {
            console.error("Error adding expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save expense." });
        }
    }

    async function handleEditExpense(id: string, data: Partial<ExpenseItem>) {
        if (!targetUserId) return;
        try {
            const expenseRef = doc(db, 'users', targetUserId, 'expenses', id);
            await updateDoc(expenseRef, data);
            setExpenses(prev => prev.map(item => item.id === id ? { ...item, ...data } as ExpenseItem : item));
            toast({ title: t('expenseUpdatedSuccess') });
        } catch(e) {
             console.error("Error updating expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to update expense." });
        }
    }

    const fixedExpenses = expenses.filter(e => e.type === 'fixed');
    const variableExpenses = expenses.filter(e => e.type === 'variable');

    const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, item) => sum + item.amount, 0);

    if (isAuthLoading) {
        return (
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-16 w-full" /></CardHeader></Card>
                <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
                <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        )
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
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">{t('expenseType')}</Label>
                                <Select name="type">
                                    <SelectTrigger id="type"><SelectValue placeholder={t('selectType')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">{t('expenseTypeFixed')}</SelectItem>
                                        <SelectItem value="variable">{t('expenseTypeVariable')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="category">{t('category')}</Label>
                                <Select name="category" onValueChange={setSelectedCategory}>
                                    <SelectTrigger id="category"><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(expenseCategories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="item">{t('item')}</Label>
                                <Select name="item" disabled={!selectedCategory}>
                                    <SelectTrigger id="item"><SelectValue placeholder={t('selectItem')} /></SelectTrigger>
                                    <SelectContent>
                                        {expenseCategories[selectedCategory]?.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">{t('amountInDinar')}</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />{t('add')}</Button>
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
            ) : (fixedExpenses.length > 0 || variableExpenses.length > 0) ? (
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
                                                        <EditExpenseDialog expense={item} onSave={handleEditExpense} categories={expenseCategories}>
                                                            <Button variant="ghost" size="icon" title={t('edit')}><Pencil className="h-4 w-4" /></Button>
                                                        </EditExpenseDialog>
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
                                                        <EditExpenseDialog expense={item} onSave={handleEditExpense} categories={expenseCategories}>
                                                            <Button variant="ghost" size="icon" title={t('edit')}><Pencil className="h-4 w-4" /></Button>
                                                        </EditExpenseDialog>
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
            ) : null}
        </>
    );
}
