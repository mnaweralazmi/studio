
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
import { PlusCircle, Trash2, Wallet } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const vegetableList = [
  "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء"
] as const;

const salesFormSchema = z.object({
  vegetable: z.enum(vegetableList, { 
    required_error: 'الرجاء اختيار نوع الخضار.' 
  }),
  quantity: z.coerce.number().min(1, 'يجب أن تكون الكمية 1 على الأقل.'),
  weightPerCarton: z.coerce.number().min(0.1, 'يجب أن يكون الوزن 0.1 كيلو على الأقل.'),
  price: z.coerce.number().min(0.01, 'يجب أن يكون السعر إيجابياً.'),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

type SalesItem = SalesFormValues & {
  id: number;
  total: number;
  pricePerKilo: number;
  totalWeight: number;
};

export default function SalesPage() {
  const [salesItems, setSalesItems] = React.useState<SalesItem[]>([]);
  const { toast } = useToast();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const userSalesKey = `salesItems_${parsedUser.username}`;
      const storedSales = localStorage.getItem(userSalesKey);
      if (storedSales) {
        setSalesItems(JSON.parse(storedSales));
      }
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      const userSalesKey = `salesItems_${user.username}`;
      localStorage.setItem(userSalesKey, JSON.stringify(salesItems));
    }
  }, [salesItems, user]);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      quantity: 1,
      weightPerCarton: 1,
      price: 0.1,
      vegetable: undefined,
    },
  });

  function onSubmit(data: SalesFormValues) {
    const newItem: SalesItem = {
      ...data,
      id: Date.now(),
      total: data.quantity * data.price,
      totalWeight: data.quantity * data.weightPerCarton,
      pricePerKilo: data.price / data.weightPerCarton,
    };
    setSalesItems(prevItems => [...prevItems, newItem]);
    
    form.reset({
      vegetable: undefined,
      quantity: 1,
      weightPerCarton: 1,
      price: 0.1,
    });
    
    toast({
      title: "تمت إضافة المبيع بنجاح!",
      description: `تمت إضافة "${data.vegetable}" إلى قائمة المبيعات.`,
    });
  }
  
  function deleteItem(id: number) {
    setSalesItems(prevItems => prevItems.filter(item => item.id !== id));
    toast({
      variant: "destructive",
      title: "تم حذف البند.",
    });
  }

  const totalSales = salesItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet />
              متتبع مبيعات الخضروات
            </CardTitle>
            <CardDescription>
              أضف مبيعاتك من الخضروات لتتبع الأرباح وإدارة عملياتك بكفاءة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="vegetable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الخضار</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية (كرتون)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weightPerCarton"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوزن (للكرتون بالكيلو)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
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
                      <FormLabel>السعر (للكرتون بالدينار)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="md:col-start-5">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  إضافة
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {salesItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>قائمة المبيعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الخضار</TableHead>
                      <TableHead>الكمية (كرتون)</TableHead>
                      <TableHead>وزن الكرتون (كيلو)</TableHead>
                      <TableHead>الوزن الإجمالي (كيلو)</TableHead>
                      <TableHead>سعر الكرتون</TableHead>
                      <TableHead>سعر الكيلو</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.vegetable}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.weightPerCarton.toFixed(1)}</TableCell>
                        <TableCell>{item.totalWeight.toFixed(1)}</TableCell>
                        <TableCell>{item.price.toFixed(2)} دينار</TableCell>
                        <TableCell>{item.pricePerKilo.toFixed(2)} دينار</TableCell>
                        <TableCell>{item.total.toFixed(2)} دينار</TableCell>
                        <TableCell className="text-left">
                          <Button variant="destructive" size="icon" onClick={() => deleteItem(item.id)} title="حذف البند">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t text-lg font-bold flex justify-between">
                <span>إجمالي المبيعات:</span>
                <span>{totalSales.toFixed(2)} دينار</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
