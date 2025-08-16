
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
import { CreditCard, DollarSign, Trash2, PlusCircle, ArrowDownCircle } from 'lucide-react';

const expenseCategories = {
  "فواتير": ["فاتورة كهرباء", "فاتورة ماء", "فاتورة انترنت", "فاتورة هاتف"],
  "طعام": ["تسوق بقالة", "مطاعم", "توصيل"],
  "وقود": ["بنزين", "ديزل"],
  "صيانة": ["صيانة سيارة", "صيانة منزل", "أدوات"],
  "بذور وأسمدة": ["بذور", "أسمدة", "تربة"],
  "عمالة": ["راتب عامل", "أعمال يومية"],
  "أخرى": ["مصروفات شخصية", "ترفيه", "طوارئ"],
} as const;

type Category = keyof typeof expenseCategories;

const expenseFormSchema = z.object({
  category: z.custom<Category>((val) => typeof val === "string" && val in expenseCategories, {
    required_error: "الرجاء اختيار الفئة.",
  }),
  item: z.string({ required_error: "الرجاء اختيار البند." }),
  amount: z.coerce.number().min(0.01, "يجب أن يكون المبلغ إيجابياً."),
  workerName: z.string().optional(),
  newWorkerName: z.string().optional(),
}).refine(data => {
    if (data.item === "راتب عامل" && data.workerName === 'add_new_worker') {
        return !!data.newWorkerName && data.newWorkerName.length > 2;
    }
    if (data.item === "راتب عامل") {
        return !!data.workerName;
    }
    return true;
}, {
    message: "الرجاء تحديد عامل أو إضافة عامل جديد (3 أحرف على الأقل).",
    path: ['workerName'],
});


type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

type ExpenseItem = Omit<ExpenseFormValues, 'newWorkerName'> & {
  id: number;
  date: Date;
};

function ExpensesContent() {
    const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
    const [workers, setWorkers] = React.useState<string[]>([]);
    const { toast } = useToast();
    
    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema),
        defaultValues: {
            amount: 0.01,
            workerName: '',
            newWorkerName: '',
        },
    });

    const selectedCategory = form.watch("category");
    const selectedItem = form.watch("item");
    const selectedWorker = form.watch("workerName");

    function onSubmit(data: ExpenseFormValues) {
        let finalWorkerName = data.workerName;

        if (data.item === 'راتب عامل') {
            if (data.workerName === 'add_new_worker' && data.newWorkerName) {
                finalWorkerName = data.newWorkerName;
                if (!workers.includes(data.newWorkerName)) {
                    setWorkers(prev => [...prev, data.newWorkerName]);
                }
            }
        } else {
            finalWorkerName = undefined;
        }

        const newExpense: ExpenseItem = {
            id: Date.now(),
            date: new Date(),
            category: data.category,
            item: data.item,
            amount: data.amount,
            workerName: finalWorkerName,
        };

        setExpenses(prev => [...prev, newExpense]);
        form.reset({
             category: undefined,
             item: undefined,
             amount: 0.01,
             workerName: '',
             newWorkerName: '',
        });
        form.clearErrors();
        toast({ title: "تمت إضافة المصروف بنجاح!" });
    }

    function deleteExpense(id: number) {
        setExpenses(prev => prev.filter(item => item.id !== id));
        toast({ variant: "destructive", title: "تم حذف المصروف." });
    }

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard />
                        إدارة المصروفات
                    </CardTitle>
                    <CardDescription>
                        أضف وتتبع نفقاتك الزراعية للحفاظ على ميزانيتك.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} ريال</div>
                        <p className="text-xs text-muted-foreground">مجموع كل النفقات المسجلة</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">عدد بنود المصروفات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{expenses.length}</div>
                        <p className="text-xs text-muted-foreground">إجمالي عدد البنود المسجلة</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>إضافة مصروف جديد</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الفئة</FormLabel>
                                        <Select onValueChange={(value: Category) => {
                                            field.onChange(value);
                                            form.setValue("item", "");
                                            form.setValue("workerName", "");
                                            form.setValue("newWorkerName", "");
                                        }} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="اختر فئة..." /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.keys(expenseCategories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="item" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>البند</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder={selectedCategory ? "اختر بندًا..." : "اختر الفئة أولاً"} /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {selectedCategory && expenseCategories[selectedCategory].map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {selectedItem === 'راتب عامل' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="workerName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>اسم العامل</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="اختر عاملاً أو أضف جديدًا..." /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {workers.map(worker => <SelectItem key={worker} value={worker}>{worker}</SelectItem>)}
                                                    <SelectItem value="add_new_worker">إضافة عامل جديد...</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    {selectedWorker === 'add_new_worker' && (
                                         <FormField control={form.control} name="newWorkerName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>اسم العامل الجديد</FormLabel>
                                                <FormControl><Input placeholder="أدخل اسم العامل هنا" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    )}
                                </div>
                            )}

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المبلغ (ريال)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> إضافة</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {expenses.length > 0 && (
            <Card>
                <CardHeader><CardTitle>قائمة المصروفات</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الفئة</TableHead>
                                <TableHead>البند</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>إجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="font-medium">
                                        {item.item}
                                        {item.workerName && item.item === 'راتب عامل' && (
                                            <span className="text-muted-foreground text-xs mr-2">({item.workerName})</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{item.amount.toFixed(2)} ريال</TableCell>
                                    <TableCell>{new Date(item.date).toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell>
                                        <Button variant="destructive" size="icon" onClick={() => deleteExpense(item.id)} title="حذف">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            )}
        </div>
    );
}


export default function ExpensesPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <ExpensesContent />
      </div>
    </main>
  );
}
