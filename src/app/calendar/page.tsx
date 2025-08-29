
"use client";

import * as React from 'react';
import { format, isValid, isFuture, isToday } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Trash2, CalendarDays, CheckCircle, ListTodo, History, Forward } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  isCompleted: boolean;
}

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();

  React.useEffect(() => {
    if (user && !loading) {
      const userTasksKey = `calendarTasks_${user.uid}`;
      const storedTasks = localStorage.getItem(userTasksKey);
      if (storedTasks) {
          try {
              setTasks(JSON.parse(storedTasks));
          } catch(e) {
              console.error("Failed to parse tasks, resetting.", e);
              localStorage.removeItem(userTasksKey);
          }
      }
    }
  }, [user, loading]);


  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';
  
  const tasksForSelectedDate = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    if (!isValid(taskDate)) return false;
    return format(taskDate, 'yyyy-MM-dd') === selectedDateString && !task.isCompleted;
  });
  
  const allUpcomingTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return isValid(taskDate) && (isFuture(taskDate) || isToday(taskDate)) && !task.isCompleted;
    });

  const allCompletedTasks = tasks.filter(task => task.isCompleted);
  
  if (loading) {
    return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
         <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-bold">{t('calendarAndTasks')}</h1>
                <p className="text-muted-foreground">{t('tasksForDayDesc')}</p>
            </div>
            <Button asChild>
                <Link href="/calendar/add-task">
                    <PlusCircle className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('addTask')}
                </Link>
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-2">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-0"
                    classNames={{
                        months: "p-4",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                        day_today: "bg-accent text-accent-foreground",
                    }}
                    locale={language === 'ar' ? arSA : enUS}
                />
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('tasksForDay')}</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tasksForSelectedDate.length}</div>
                    <p className="text-xs text-muted-foreground">
                        {date ? format(date, 'd MMM yyyy', { locale: language === 'ar' ? arSA : enUS }) : ''}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('allUpcomingTasks')}</CardTitle>
                    <Forward className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{allUpcomingTasks.length}</div>
                    <p className="text-xs text-muted-foreground">{t('allUpcomingTasksDesc')}</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {t('completedTasksLog')}
                    </CardTitle>
                    <CardDescription>{t('completedTasksLogDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {allCompletedTasks.length > 0 ? (
                         <ul className="space-y-2">
                            {allCompletedTasks.slice(0, 5).map(task => (
                                <li key={task.id} className="text-sm text-muted-foreground line-through">
                                    {task.title}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('noCompletedTasks')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );

  