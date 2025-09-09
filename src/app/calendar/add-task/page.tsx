
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { addDoc, Timestamp, runTransaction, doc, collection } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, CalendarIcon, Repeat, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import type { TaskData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const taskTitlesAr = [ "سقي", "تسميد", "تقليم", "مكافحة حشرات", "حصاد", "تعشيب", "فحص النباتات", "مهمة أخرى" ] as const;
const taskTitlesEn = [ "Watering", "Fertilizing", "Pruning", "Pest Control", "Harvesting", "Weeding", "Plant Inspection", "Other Task" ] as const;

const vegetableListAr = [ "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء", "ملفوف", "شمندر", "فجل" ] as const;
const vegetableListEn = [ "Tomato", "Cucumber", "Potato", "Onion", "Carrot", "Bell Pepper", "Eggplant", "Zucchini", "Lettuce", "Broccoli", "Spinach", "Cauliflower", "Okra", "Green Beans", "Peas", "Cabbage", "Beetroot", "Radish" ] as const;

const fruitListAr = [ "فراولة", "توت", "تين", "عنب", "بطيخ", "شمام", "رمان", "مانجو", "موز", "تفاح", "برتقال", "ليمون" ] as const;
const fruitListEn = [ "Strawberry", "Berry", "Fig", "Grape", "Watermelon", "Melon", "Pomegranate", "Mango", "Banana", "Apple", "Orange", "Lemon" ] as const;

async function addTask(data: TaskData): Promise<string> {
    const tasksCollectionRef = collection(db, 'tasks');
    const docRef = await addDoc(tasksCollectionRef, {
        ...data,
        dueDate: Timestamp.fromDate(data.dueDate),
    });
    return docRef.id;
}


export default function AddTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { user, loading } = useAuth();
  
  const taskTitles = language === 'ar' ? taskTitlesAr : taskTitlesEn;
  const vegetableList = language === 'ar' ? vegetableListAr : vegetableListEn;
  const fruitList = language === 'ar' ? fruitListAr : fruitListEn;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dueDate, setDueDate] = React.useState<Date | undefined>(new Date());
  const [dueTime, setDueTime] = React.useState('09:00');
  const [vegetable, setVegetable] = React.useState('');
  const [fruit, setFruit] = React.useState('');
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [reminderDays, setReminderDays] = React.useState(0);
  
  const isOtherTask = title === 'مهمة أخرى' || title === 'Other Task';
  const showDescriptionInput = isOtherTask || (!vegetable && !fruit);


  React.useEffect(() => {
    if (vegetable) {
        setDescription(vegetable);
    } else if (fruit) {
        setDescription(fruit);
    } else {
        setDescription('');
    }
  }, [vegetable, fruit]);


  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!title || !dueDate) {
        toast({ variant: "destructive", title: t('error'), description: "Please fill in the required fields." });
        return;
    }

    if (loading || !user) {
        toast({ variant: "destructive", title: t('error'), description: "You must be logged in to save tasks." });
        return;
    }
    try {
        const finalDueDate = new Date(dueDate);
        if (dueTime) {
            const [hours, minutes] = dueTime.split(':').map(Number);
            finalDueDate.setHours(hours, minutes);
        }

        const taskData: TaskData = {
            title: title,
            description: description,
            dueDate: finalDueDate,
            isCompleted: false,
            isRecurring: isRecurring,
            reminderDays: reminderDays,
            ownerId: user.uid,
        };

        await addTask(taskData);

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
  
  if (loading) {
    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
             <div className="w-full max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-24 ml-auto" />
                    </CardFooter>
                </Card>
             </div>
        </main>
    )
  }

  if (!user) {
    return (
        <main className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('error')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t('userProfileDesc')}</p>
                        <Button onClick={() => router.push('/login')} className="mt-4">{t('login')}</Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={onSubmit}>
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
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label>{t('taskTitle')}</Label>
                        <Select onValueChange={(val) => { setTitle(val); setFruit(''); setVegetable(''); }} value={title}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectTask')} />
                          </SelectTrigger>
                          <SelectContent>
                            {taskTitles.map(taskTitle => (
                              <SelectItem key={taskTitle} value={taskTitle}>{taskTitle}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    
                    {!isOtherTask && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{t('selectVegetableOptional')}</Label>
                                    <Select onValueChange={(val) => { setVegetable(val); setFruit(''); }} value={vegetable}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectVegetable')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vegetableList.map(veg => (
                                            <SelectItem key={veg} value={veg}>{veg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('selectFruitOptional')}</Label>
                                    <Select onValueChange={(val) => { setFruit(val); setVegetable(''); }} value={fruit}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectFruit')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fruitList.map(fruitItem => (
                                            <SelectItem key={fruitItem} value={fruitItem}>{fruitItem}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}
                    
                     {showDescriptionInput && (
                        <div className="space-y-2">
                            <Label htmlFor='description'>{t('description')}</Label>
                            <Textarea id="description" placeholder={t('taskDescriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                     )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>{t('dueDate')}</Label>
                             <div className="flex gap-2">
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "flex-1 justify-start text-left font-normal",
                                        !dueDate && "text-muted-foreground",
                                        language === 'ar' ? 'pr-3' : 'pl-3'
                                        )}
                                    >
                                        <CalendarIcon className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                                        {dueDate ? (
                                        format(dueDate, "PPP", { locale: language === 'ar' ? arSA : enUS })
                                        ) : (
                                        <span>{t('pickDate')}</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={setDueDate}
                                        initialFocus
                                        locale={language === 'ar' ? arSA : enUS}
                                    />
                                </PopoverContent>
                                </Popover>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="pl-10" />
                                </div>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>{t('remindMeBefore')}</Label>
                            <Select onValueChange={(value) => setReminderDays(Number(value))} defaultValue={String(reminderDays)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('noReminder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">{t('noReminder')}</SelectItem>
                                    <SelectItem value="1">{t('oneDayBefore')}</SelectItem>
                                    <SelectItem value="2">{t('twoDaysBefore')}</SelectItem>
                                    <SelectItem value="3">{t('threeDaysBefore')}</SelectItem>
                                    <SelectItem value="7">{t('oneWeekBefore')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base flex items-center gap-2">
                                <Repeat />
                                {t('rememberTask')}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t('rememberTaskDesc')}
                            </p>
                        </div>
                        <Switch
                            checked={isRecurring}
                            onCheckedChange={setIsRecurring}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-6">
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
      </div>
    </main>
  );
}

    