
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
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
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const taskTitlesAr = [ "سقي", "تسميد", "تقليم", "مكافحة حشرات", "حصاد", "تعشيب", "فحص النباتات", "مهمة أخرى" ] as const;
const taskTitlesEn = [ "Watering", "Fertilizing", "Pruning", "Pest Control", "Harvesting", "Weeding", "Plant Inspection", "Other Task" ] as const;

const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;

const fruitListAr = [ "فراولة", "توت", "تين", "عنب", "بطيخ", "شمام", "رمان", "مانجو", "موز", "تفاح", "برتقال", "ليمون" ] as const;
const fruitListEn = [ "Strawberry", "Berry", "Fig", "Grape", "Watermelon", "Melon", "Pomegranate", "Mango", "Banana", "Apple", "Orange", "Lemon" ] as const;


const taskFormSchema = z.object({
  title: z.string({ required_error: "الرجاء اختيار عنوان للمهمة." }),
  vegetable: z.string().optional(),
  fruit: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب.", }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function AddTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { user, loading } = useAuth();
  
  const taskTitles = language === 'ar' ? taskTitlesAr : taskTitlesEn;
  const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;
  const fruitList = language === 'ar' ? fruitListAr : fruitListEn;

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
        if (!form.getValues('description')) {
            form.setValue('description', selectedVegetable);
        }
    }
  }, [selectedVegetable, form]);

  React.useEffect(() => {
    if (selectedFruit) {
        form.setValue('vegetable', '');
        if (!form.getValues('description')) {
            form.setValue('description', selectedFruit);
        }
    }
  }, [selectedFruit, form]);


  async function onSubmit(data: TaskFormValues) {
    if (loading || !user) {
        toast({ variant: "destructive", title: t('error'), description: "يجب تسجيل الدخول لحفظ المهام." });
        return;
    }
    try {
        const userRef = doc(db, 'users', user.uid);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }

            const currentBadges = userDoc.data().badges || [];
            let newPoints = userDoc.data().points || 0;
            let newBadges = [...currentBadges];
            let badgeAwarded = false;

            if (!currentBadges.includes('planner')) {
                newPoints += 20; // Points for first task
                newBadges.push('planner');
                badgeAwarded = true;
            } else {
                newPoints += 2; // Points for subsequent tasks
            }

            const newLevel = Math.floor(newPoints / 100) + 1;
            transaction.update(userRef, { points: newPoints, level: newLevel, badges: newBadges });

            if (badgeAwarded) {
                toast({ title: t('badgeEarned'), description: t('badgePlannerDesc') });
            }
        });


        const userTasksKey = `calendarTasks_${user.uid}`;
        
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
            title: t('taskAddedSuccess'),
            description: t('taskAddedDesc'),
        });

        router.push('/calendar');
    } catch (error) {
        console.error("Failed to save task", error);
        toast({
            variant: "destructive",
            title: t('error'),
            description: t('taskSaveFailed'),
        });
    }
  }
  
  if (loading || !user) {
    return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
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
                        {t('addNewTask')}
                    </CardTitle>
                    <CardDescription>
                        {t('addNewTaskDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('taskTitle')}</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('selectTask')} />
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
                                    <FormLabel>{t('selectVegetableOptional')}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectVegetable')} />
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
                                    <FormLabel>{t('selectFruitOptional')}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectFruit')} />
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
                            <FormLabel>{t('description')}</FormLabel>
                            <FormControl>
                                <Textarea placeholder={t('taskDescriptionPlaceholder')} {...field} />
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
                                <FormLabel>{t('dueDate')}</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground",
                                        language === 'ar' ? 'pr-3' : 'pl-3'
                                        )}
                                    >
                                        <CalendarIcon className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                                        {field.value ? (
                                        format(field.value, "PPP", { locale: language === 'ar' ? arSA : enUS })
                                        ) : (
                                        <span>{t('pickDate')}</span>
                                        )}
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                        locale={language === 'ar' ? arSA : enUS}
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
                        {t('cancel')}
                    </Button>
                    <Button type="submit">
                        <PlusCircle className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                        {t('addTask')}
                    </Button>
                </CardFooter>
                </Card>
            </form>
        </Form>
      </div>
    </main>
  );
}
