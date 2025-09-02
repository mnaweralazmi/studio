
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Repeat, Trash2, PlusCircle, TrendingUp, Pencil } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, Timestamp, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';

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

export function ExpensesContent({ departmentId }: ExpensesContentProps) {
    const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
    const { language, t } = useLanguage();
    const [expenseCategories, setExpenseCategories] = React.useState<Record<string, string[]>>({});
    const [isDataLoading, setIsDataLoading] = React.useState(true);
    const { toast } = useToast();
    const { user: authUser } = useAuth();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [selectedCategory, setSelectedCategory] = React.useState<string>('');

    const targetUserId = authUser?.uid;

    React.useEffect(() => {
        const fetchExpensesAndCategories = async () => {
            if (!targetUserId || !departmentId) {
                setExpenses([]);
                setExpenseCategories(getInitialCategories(language, departmentId || 'agriculture'));
                setIsDataLoading(false);
                return;
            }

            setIsDataLoading(true);
            setExpenses([]);
            setExpenseCategories({});
            setSelectedCategory('');
            
            try {
                // For simplicity, we'll manage categories in the frontend for now.
                // A more robust solution would save custom categories to Firestore.
                setExpenseCategories(getInitialCategories(language, departmentId));

                const expensesCollectionRef = collection(db, 'users', targetUserId, 'expenses');
                const q = query(expensesCollectionRef, where("departmentId", "==", departmentId));
                const expensesSnapshot = await getDocs(q);
                const fetchedExpenses = expensesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: (doc.data().date as Timestamp).toDate()
                })) as ExpenseItem[];
                setExpenses(fetchedExpenses);

            } catch (e) {
                console.error("Error fetching data: ", e);
                setExpenseCategories(getInitialCategories(language, departmentId));
            } finally {
                setIsDataLoading(false);
            }
        };

        if (departmentId) {
            fetchExpensesAndCategories();
        }
    }, [targetUserId, language, departmentId]);
    
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

            setExpenses(prev => [...prev, newExpense]);
            formRef.current?.reset();
            setSelectedCategory('');
            toast({ title: t('expenseAddedSuccess') });
        } catch(e) {
            console.error("Error adding expense: ", e);
            toast({ variant: "destructive", title: t('error'), description: "Failed to save expense." });
        }
    }

    async function deleteExpense(id: string) {
        if (!targetUserId) return;
        try {
            await deleteDoc(doc(db, 'users', targetUserId, 'expenses', id));
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

    if (!targetUserId) {
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
            ) : null}
        </>
    );
}
