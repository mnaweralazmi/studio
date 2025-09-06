
"use client";

import * as React from 'react';
import { addDoc, getDocs, doc, Timestamp, deleteDoc, collection, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Repeat, PlusCircle, TrendingUp, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { db } from '@/lib/firebase';

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

export type ExpenseItem = {
  id: string;
  date: Date;
  type: 'fixed' | 'variable';
  category: string;
  item: string;
  amount: number;
  ownerId?: string;
};

export type ExpenseItemData = Omit<ExpenseItem, 'id'>;


async function addExpense(userId: string, departmentId: string, data: ExpenseItemData): Promise<string> {
    const collectionName = `${departmentId}_expenses`;
    const expensesCollectionRef = collection(db, 'users', userId, collectionName);
    const docRef = await addDoc(expensesCollectionRef, {
        ...data,
        date: Timestamp.fromDate(data.date),
    });
    return docRef.id;
}

async function archiveExpense(userId: string, departmentId: string, expense: ExpenseItem): Promise<void> {
    const batch = writeBatch(db);

    const originalExpenseRef = doc(db, 'users', userId, `${departmentId}_expenses`, expense.id);
    batch.delete(originalExpenseRef);

    const archiveCollectionName = `archive_expenses`;
    const archiveExpenseRef = doc(collection(db, 'users', userId, archiveCollectionName));
    const archivedExpenseData = {
        ...expense,
        archivedAt: Timestamp.now(),
        departmentId: departmentId,
    };
    delete (archivedExpenseData as any).id;
    batch.set(archiveExpenseRef, archivedExpenseData);

    await batch.commit();
}

interface ExpensesContentProps {
    departmentId: string;
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

    React.useEffect(() => {
        setExpenseCategories(getInitialCategories(language, departmentId));
        setSelectedCategory('');
    }, [language, departmentId]);

    React.useEffect(() => {
        if (!authUser) {
          if(!isAuthLoading) {
            setIsDataLoading(false);
            setExpenses([]);
          }
          return;
        }

        setIsDataLoading(true);
        const collectionName = `${departmentId}_expenses`;
        const q = query(
            collection(db, 'users', authUser.uid, collectionName),
            where("ownerId", "==", authUser.uid)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: (doc.data().date as Timestamp).toDate()
            }) as ExpenseItem);
            setExpenses(data.sort((a,b) => b.date.getTime() - a.date.getTime()));
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching expenses: ", error);
            toast({ variant: "destructive", title: t('error'), description: "Failed to load expenses data." });
            setIsDataLoading(false);
        });

        return () => unsubscribe();

    }, [authUser, departmentId, isAuthLoading, toast, t]);
    
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!authUser) {
             toast({ variant: "destructive", title: t('error'), description: "You must be logged in to add expenses."});
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
        
        const newExpenseData: ExpenseItemData = {
            date: new Date(),
            type: data.type,
            category: data.category,
            item: data.item,
            amount: data.amount,
            ownerId: authUser.uid,
        };

        try {
            await addExpense(authUser.uid, departmentId, newExpenseData);
            formRef.current?.reset();
            setSelectedCategory('');
            toast({ title: t('expenseAddedSuccess') });
        } catch(e) {
            console.error("Error adding expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save expense." });
        }
    }

    const handleDelete = async (expenseId: string) => {
        if (!authUser) return;
        const expenseToArchive = expenses.find(item => item.id === expenseId);
        if (!expenseToArchive) return;
        try {
            await archiveExpense(authUser.uid, departmentId, expenseToArchive);
            toast({ title: t('itemArchived'), description: t('itemArchivedDesc') });
        } catch(e) {
            console.error("Error archiving expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to archive expense." });
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
        <div className="space-y-6">
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
                                <Select name="category" onValueChange={setSelectedCategory} value={selectedCategory}>
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
                                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
                                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
        </div>
    );
}

    