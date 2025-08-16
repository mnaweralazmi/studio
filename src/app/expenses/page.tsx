"use client";

import * as React from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Landmark, DollarSign, Trash2, PlusCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const expenseCategories = ["فواتير", "طعام", "وقود", "صيانة", "بذور وأسمدة", "عمالة", "أخرى"] as const;

const expenseFormSchema = z.object({
  category: z.enum(expenseCategories, { required_error: "الرجاء اختيار الفئة." }),
  description: z.string().min(2, "يجب أن يكون الوصف حرفين على الأقل."),
  amount: z.coerce.number().min(0.01, "يجب أن يكون المبلغ إيجابياً."),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

type ExpenseItem = ExpenseFormValues & {
  id: number;
  date: Date;
};

function ExpensesContent() {
    const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
    const { toast } = useToast();

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema),
        defaultValues: {
            description: "",
            amount: 0.01,
        },
    });

    function onSubmit(data: ExpenseFormValues) {
        const newExpense: ExpenseItem = {
            ...data,
            id: Date.now(),
            date: new Date(),
        };
        setExpenses(prev => [...prev, newExpense]);
        form.reset({ description: "", amount: 0.01, category: undefined });
        toast({ title: "تمت إضافة المصروف بنجاح!" });
    }

    function deleteExpense(id: number) {
        setExpenses(prev => prev.filter(item => item.id !== id));
        toast({ variant: "destructive", title: "تم حذف المصروف." });
    }

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
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
                        <CardTitle className="text-sm font-medium">إجمالي الديون</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.00 ريال</div>
                        <p className="text-xs text-muted-foreground">سيتم تفعيلها قريباً</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">صافي الرصيد</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.00 ريال</div>
                        <p className="text-xs text-muted-foreground">سيتم تفعيلها قريباً</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>إضافة مصروف جديد</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الفئة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="اختر فئة..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>الوصف</FormLabel>
                                    <FormControl><Input placeholder="مثال: فاتورة كهرباء شهر مايو" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                           <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المبلغ (ريال)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="md:col-start-4"><PlusCircle className="mr-2 h-4 w-4" /> إضافة</Button>
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
                                <TableHead>الوصف</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>إجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="font-medium">{item.description}</TableCell>
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

function DebtsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>صفحة الديون</CardTitle>
                <CardDescription>
                    هنا يمكنك تتبع وإدارة جميع ديونك. سيتم بناء هذه الصفحة قريباً.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>محتوى صفحة الديون قيد الإنشاء حاليًا.</p>
            </CardContent>
        </Card>
    );
}

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') === 'debts' ? 'debts' : 'expenses';

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <Tabs value={activeTab} className="w-full">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
               <TabsTrigger value="expenses" asChild>
                  <NextLink href="/expenses" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    المصروفات
                  </NextLink>
               </TabsTrigger>
               <TabsTrigger value="debts" asChild>
                  <NextLink href="/expenses?tab=debts" className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    الديون
                  </NextLink>
               </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="expenses" className="mt-6">
            <ExpensesContent />
          </TabsContent>
          <TabsContent value="debts" className="mt-6">
            <DebtsContent />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
