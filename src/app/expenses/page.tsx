
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
import { CreditCard, Repeat, Trash2, PlusCircle, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

const initialExpenseCategories: Record<string, string[]> = {
  "فواتير": ["فاتورة كهرباء", "فاتورة ماء", "فاتورة انترنت", "فاتورة هاتف"],
  "مستلزمات زراعية": ["بذور", "أسمدة", "تربة", "مبيدات", "أدوات زراعية"],
  "صيانة": ["صيانة المعدات", "صيانة المباني"],
  "وقود ومركبات": ["بنزين", "ديزل", "صيانة مركبة"],
  "عمالة": ["رواتب", "أعمال يومية"],
  "نثريات": ["مصروفات إدارية", "طعام وشراب", "طوارئ"],
};

const initialExpenseCategoriesEn: Record<string, string[]> = {
    "Bills": ["Electricity Bill", "Water Bill", "Internet Bill", "Phone Bill"],
    "Farming Supplies": ["Seeds", "Fertilizers", "Soil", "Pesticides", "Farming Tools"],
    "Maintenance": ["Equipment Maintenance", "Building Maintenance"],
    "Fuel & Vehicles": ["Gasoline", "Diesel", "Vehicle Maintenance"],
    "Labor": ["Salaries", "Daily Wages"],
    "Miscellaneous": ["Administrative Expenses", "Food & Drink", "Emergencies"],
};

type Category = keyof typeof initialExpenseCategories;

const expenseFormSchema = z.object({
  type: z.enum(['fixed', 'variable'], { required_error: "الرجاء تحديد نوع المصروف." }),
  category: z.custom<string>((val) => typeof val === "string" && (val in initialExpenseCategories || val in initialExpenseCategoriesEn), {
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

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

type ExpenseItem = Omit<ExpenseFormValues, 'newItemName'> & {
  id: number;
  date: Date;
};

function ExpensesContent() {
    const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
    const { language, t } = useLanguage();
    const [expenseCategories, setExpenseCategories] = React.useState(language === 'ar' ? initialExpenseCategories : initialExpenseCategoriesEn);
    const { toast } = useToast();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        setExpenseCategories(language === 'ar' ? initialExpenseCategories : initialExpenseCategoriesEn);
    }, [language]);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            const expensesKey = `expenses_${parsedUser.username}`;
            const storedExpenses = localStorage.getItem(expensesKey);
            if (storedExpenses) {
                setExpenses(JSON.parse(storedExpenses).map((e: any) => ({...e, date: new Date(e.date)})));
            }

            const categoriesKey = `expenseCategories_${parsedUser.username}_${language}`;
            const storedCategories = localStorage.getItem(categoriesKey);
            if (storedCategories) {
                setExpenseCategories(JSON.parse(storedCategories));
            }
        }
    }, [language]);

    React.useEffect(() => {
        if (user) {
            localStorage.setItem(`expenses_${user.username}`, JSON.stringify(expenses));
            localStorage.setItem(`expenseCategories_${user.username}_${language}`, JSON.stringify(expenseCategories));
        }
    }, [expenses, expenseCategories, user, language]);
    
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

    function onSubmit(data: ExpenseFormValues) {
        let finalItemName = data.item;

        if (data.item === 'add_new_item' && data.newItemName) {
            finalItemName = data.newItemName;
            setExpenseCategories(prev => {
                const newCategories: Record<string, string[]> = { ...prev };
                if (data.category && !newCategories[data.category].includes(data.newItemName!)) {
                    newCategories[data.category] = [...newCategories[data.category], data.newItemName!];
                }
                return newCategories;
            });
        }

        const newExpense: ExpenseItem = {
            id: Date.now(),
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
    }

    function deleteExpense(id: number) {
        setExpenses(prev => prev.filter(item => item.id !== id));
        toast({ variant: "destructive", title: t('expenseDeleted') });
    }

    const fixedExpenses = expenses.filter(e => e.type === 'fixed');
    const variableExpenses = expenses.filter(e => e.type === 'variable');

    const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, item) => sum + item.amount, 0);

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
                                        <Select onValueChange={(value: Category) => {
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
                                                {expenseCategories[selectedCategory as Category]?.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
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
            
            <div className="grid md:grid-cols-2 gap-6">
                {fixedExpenses.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Repeat className="h-5 w-5" />{t('fixedMonthlyExpenses')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>{t('tableCategory')}</TableHead><TableHead>{t('tableItem')}</TableHead><TableHead>{t('tableAmount')}</TableHead><TableHead className="text-right">{t('tableAction')}</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {fixedExpenses.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell className="font-medium">
                                                {item.item}
                                            </TableCell>
                                            <TableCell>{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="destructive" size="icon" onClick={() => deleteExpense(item.id)} title={t('delete')}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                )}

                {variableExpenses.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5" />{t('variableExpenses')}</CardTitle></CardHeader>
                    <CardContent>
                         <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>{t('tableCategory')}</TableHead><TableHead>{t('tableItem')}</TableHead><TableHead>{t('tableAmount')}</TableHead><TableHead>{t('tableDate')}</TableHead><TableHead className="text-right">{t('tableAction')}</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {variableExpenses.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell className="font-medium">
                                                {item.item}
                                            </TableCell>
                                            <TableCell>{item.amount.toFixed(2)} {t('dinar')}</TableCell>
                                            <TableCell>{new Date(item.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="destructive" size="icon" onClick={() => deleteExpense(item.id)} title={t('delete')}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                )}
            </div>
        </div>
    );
}


export default function ExpensesPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <ExpensesContent />
      </div>
    </main>
  );
}
