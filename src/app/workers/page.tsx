
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2, PlusCircle, Award, ArrowDownCircle, DollarSign } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const workerFormSchema = z.object({
  name: z.string().min(3, "اسم العامل يجب أن يكون 3 أحرف على الأقل."),
  baseSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون رقمًا إيجابيًا."),
});

type WorkerFormValues = z.infer<typeof workerFormSchema>;

export interface Worker extends WorkerFormValues {
  id: string;
  transactions: Transaction[];
}

export interface Transaction {
    id: string;
    type: 'salary' | 'bonus' | 'deduction';
    amount: number;
    date: string;
    description: string;
}

export default function WorkersPage() {
    const [workers, setWorkers] = React.useState<Worker[]>([]);
    const { toast } = useToast();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const workersKey = `workers_${parsedUser.username}`;
            const storedWorkers = localStorage.getItem(workersKey);
            if (storedWorkers) {
                setWorkers(JSON.parse(storedWorkers));
            }
        }
    }, []);

    React.useEffect(() => {
        if (user) {
            const workersKey = `workers_${user.username}`;
            localStorage.setItem(workersKey, JSON.stringify(workers));
        }
    }, [workers, user]);
    
    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerFormSchema),
        defaultValues: {
            name: "",
            baseSalary: 0,
        },
    });

    function addWorker(data: WorkerFormValues) {
        const workerExists = workers.some(w => w.name.toLowerCase() === data.name.toLowerCase());
        if (workerExists) {
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "عامل بهذا الاسم موجود بالفعل."
            });
            return;
        }

        const newWorker: Worker = {
            id: crypto.randomUUID(),
            name: data.name,
            baseSalary: data.baseSalary,
            transactions: [],
        };
        setWorkers(prev => [...prev, newWorker]);
        form.reset();
        toast({ title: "تمت إضافة العامل بنجاح!" });
    }

    function deleteWorker(workerId: string) {
        setWorkers(prev => prev.filter(w => w.id !== workerId));
        toast({ variant: "destructive", title: "تم حذف العامل." });
    }
  
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users />
                    إدارة العمالة والرواتب
                </CardTitle>
                <CardDescription>
                    أضف العمال، تتبع رواتبهم، وقم بإدارة المكافآت والخصومات.
                </CardDescription>
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>إضافة عامل جديد</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(addWorker)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم العامل</FormLabel>
                                    <FormControl>
                                        <Input placeholder="أدخل اسم العامل..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="baseSalary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الراتب الأساسي (دينار)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button type="submit" className="self-end">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            إضافة عامل
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        {workers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>قائمة العمال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العامل</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{worker.baseSalary.toFixed(2)} دينار</TableCell>
                        <TableCell className="text-left flex gap-2">
                            <Button variant="outline" size="sm">
                                <DollarSign className="h-4 w-4 ml-1" />
                                استلام راتب
                            </Button>
                            <Button variant="secondary" size="sm">
                                <Award className="h-4 w-4 ml-1" />
                                مكافأة
                            </Button>
                            <Button variant="secondary" size="sm">
                               <ArrowDownCircle className="h-4 w-4 ml-1" />
                                خصم
                            </Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" title="حذف العامل">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيؤدي هذا الإجراء إلى حذف العامل ({worker.name}) بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteWorker(worker.id)}>
                                    نعم، حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </main>
  );
}
