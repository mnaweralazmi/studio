"use client"

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Wallet, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const vegetableList = [
  "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء"
] as const;

const budgetFormSchema = z.object({
  vegetable: z.enum(vegetableList, { required_error: 'الرجاء اختيار نوع الخضار.' }),
  quantity: z.coerce.number().min(1, { message: 'يجب أن تكون الكمية 1 على الأقل.' }),
  price: z.coerce.number().min(0.1, { message: 'يجب أن يكون السعر إيجابياً.' }),
});

type BudgetItem = z.infer<typeof budgetFormSchema> & {
  id: number;
  total: number;
};

export default function BudgetPage() {
  const [budgetItems, setBudgetItems] = React.useState<BudgetItem[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof budgetFormSchema>>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      vegetable: undefined,
      quantity: 1,
      price: 0.0,
    },
  });

  function onSubmit(data: z.infer<typeof budgetFormSchema>) {
    const newItem: BudgetItem = {
      ...data,
      id: Date.now(),
      total: data.quantity * data.price,
    };
    setBudgetItems(prevItems => [...prevItems, newItem]);
    form.reset();
    toast({
      title: "تمت إضافة البند بنجاح!",
      description: `تمت إضافة "${data.vegetable}" إلى الميزانية.`,
    })
  }
  
  function deleteItem(id: number) {
    setBudgetItems(prevItems => prevItems.filter(item => item.id !== id));
    toast({
      variant: "destructive",
      title: "تم حذف البند.",
    })
  }

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet />
              الميزانية
            </CardTitle>
            <CardDescription>
              هنا يمكنك تتبع ميزانية الخضروات والأسعار.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="vegetable"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>نوع الخضار</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الخضار..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vegetableList.map(veg => (
                            <SelectItem key={veg} value={veg}>{veg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية (كيلو)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (للكيلو)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="md:col-start-4">
                  <PlusCircle className="ml-2 h-4 w-4" />
                  إضافة
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {budgetItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>قائمة الميزانية</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الخضار</TableHead>
                    <TableHead>الكمية (كيلو)</TableHead>
                    <TableHead>سعر الكيلو</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.vegetable}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.price.toFixed(2)} ريال</TableCell>
                      <TableCell>{item.total.toFixed(2)} ريال</TableCell>
                      <TableCell className="text-left">
                        <Button variant="destructive" size="icon" onClick={() => deleteItem(item.id)} title="حذف البند">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t text-lg font-bold flex justify-between">
                <span>إجمالي الميزانية:</span>
                <span>{totalBudget.toFixed(2)} ريال</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
