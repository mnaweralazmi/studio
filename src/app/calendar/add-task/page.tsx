
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, CalendarIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Task } from '../page';

const taskTitles = [
    "سقي",
    "تسميد",
    "تقليم",
    "مكافحة حشرات",
    "حصاد",
    "تعشيب",
    "فحص النباتات",
    "مهمة أخرى"
] as const;

const vegetableList = [
  "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل"
] as const;

const fruitList = [
    "فراولة", "توت", "تين", "عنب", "بطيخ", "شمام", "رمان", "مانجو", "موز", "تفاح", "برتقال", "ليمون"
] as const;


const taskFormSchema = z.object({
  title: z.enum(taskTitles, {
    required_error: "الرجاء اختيار عنوان للمهمة."
  }),
  vegetable: z.string().optional(),
  fruit: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date({
    required_error: "تاريخ الاستحقاق مطلوب.",
  }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function AddTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: undefined,
      description: "",
      dueDate: new Date(),
      vegetable: "",
      fruit: ""
    },
  });

  const selectedVegetable = form.watch('vegetable');
  const selectedFruit = form.watch('fruit');

  React.useEffect(() => {
    if (selectedVegetable) {
        form.setValue('fruit', '');
        form.setValue('description', selectedVegetable);
    }
  }, [selectedVegetable, form]);

  React.useEffect(() => {
    if (selectedFruit) {
        form.setValue('vegetable', '');
        form.setValue('description', selectedFruit);
    }
  }, [selectedFruit, form]);


  function onSubmit(data: TaskFormValues) {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            throw new Error("User not found");
        }
        const user = JSON.parse(userStr);
        const userTasksKey = `calendarTasks_${user.username}`;
        
        const storedTasks = localStorage.getItem(userTasksKey);
        const tasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];
        
        const newTask: Task = {
            id: crypto.randomUUID(),
            title: data.title,
            description: data.description,
            dueDate: data.dueDate.toISOString(),
            isCompleted: false,
        };

        tasks.push(newTask);
        localStorage.setItem(userTasksKey, JSON.stringify(tasks));
        
        toast({
            title: "نجاح!",
            description: "تمت إضافة مهمتك الجديدة إلى التقويم.",
        });

        router.push('/calendar');
    } catch (error) {
        console.error("Failed to save task to localStorage", error);
        toast({
            variant: "destructive",
            title: "خطأ!",
            description: "لم نتمكن من حفظ المهمة. الرجاء المحاولة مرة أخرى.",
        });
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl mx-auto">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle />
                        إضافة مهمة جديدة
                    </CardTitle>
                    <CardDescription>
                        املأ التفاصيل أدناه لإضافة مهمة إلى تقويمك.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>عنوان المهمة</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المهمة..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {taskTitles.map(title => (
                                  <SelectItem key={title} value={title}>{title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="vegetable"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اختر الخضار (اختياري)</FormLabel>
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
                        <FormField
                            control={form.control}
                            name="fruit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اختر الفاكهة (اختياري)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر نوع الفاكهة..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {fruitList.map(fruit => (
                                            <SelectItem key={fruit} value={fruit}>{fruit}</SelectItem>
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
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>الوصف</FormLabel>
                            <FormControl>
                                <Textarea placeholder="أضف وصفًا موجزًا للمهمة..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>تاريخ الاستحقاق</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? (
                                        format(field.value, "PPP", { locale: arSA })
                                        ) : (
                                        <span>اختر تاريخًا</span>
                                        )}
                                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                        locale={arSA}
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        إلغاء
                    </Button>
                    <Button type="submit">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة المهمة
                    </Button>
                </CardFooter>
                </Card>
            </form>
        </Form>
      </div>
    </main>
  );
}

    