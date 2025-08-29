
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
import { Badge } from '@/components/ui/badge';
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

  React.useEffect(() => {
    if (user && !loading) {
        const userTasksKey = `calendarTasks_${user.uid}`;
        localStorage.setItem(userTasksKey, JSON.stringify(tasks));
    }
  }, [tasks, user, loading]);

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    toast({
      variant: "destructive",
      title: t('taskDeleted'),
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    setTasks(updatedTasks);
    const targetTask = updatedTasks.find(t => t.id === taskId);
    toast({
      title: targetTask?.isCompleted ? t('taskCompleted') : t('taskUpdated'),
      description: targetTask?.isCompleted ? t('taskCompletedDesc') : t('taskNotCompletedDesc'),
    });
  };

  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';
  const upcomingTasksForSelectedDate = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    if (!isValid(taskDate)) return false;
    return format(taskDate, 'yyyy-MM-dd') === selectedDateString && !task.isCompleted;
  });
  
  const allUpcomingTasks = tasks
    .filter(task => {
        const taskDate = new Date(task.dueDate);
        return isValid(taskDate) && (isFuture(taskDate) || isToday(taskDate)) && !task.isCompleted;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const allCompletedTasks = tasks
    .filter(task => task.isCompleted)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
                 <Card>
                    <CardContent className="p-0">
                        <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        locale={language === 'ar' ? arSA : enUS}
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                            day_today: "bg-accent text-accent-foreground",
                        }}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays />
                            {t('tasksForDay')} {date ? format(date, 'd MMMM yyyy', { locale: language === 'ar' ? arSA : enUS }) : t('pleaseSelectDay')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingTasksForSelectedDate.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingTasksForSelectedDate.map(task => (
                                <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg border bg-background transition-all">
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium">{task.title}</p>
                                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant='default' size="icon" onClick={() => toggleTaskCompletion(task.id)} title={t('completeTask')}>
                                        <CheckCircle className="h-5 w-5" />
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => deleteTask(task.id)} title={t('deleteTask')}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                <p>{t('noUpcomingTasksForDay')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Forward />
                        {t('allUpcomingTasks')}
                    </CardTitle>
                    <CardDescription>{t('allUpcomingTasksDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {allUpcomingTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {allUpcomingTasks.map(task => (
                            <div key={task.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-background transition-all">
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">{task.title}</p>
                                        <Badge variant="outline">{format(new Date(task.dueDate), 'd MMM', { locale: language === 'ar' ? arSA : enUS })}</Badge>
                                    </div>
                                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                                </div>
                                <div className="flex items-center gap-2 self-end mt-2">
                                    <Button variant='default' size="icon" onClick={() => toggleTaskCompletion(task.id)} title={t('completeTask')}>
                                        <CheckCircle className="h-5 w-5" />
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => deleteTask(task.id)} title={t('deleteTask')}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-4">
                            <p>{t('noUpcomingTasks')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History />
                    {t('completedTasksLog')}
                </CardTitle>
                <CardDescription>{t('completedTasksLogDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {allCompletedTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {allCompletedTasks.map(task => (
                        <div key={task.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/50 transition-all">
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                                <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                                <Badge variant="secondary">{format(new Date(task.dueDate), 'd MMM', { locale: language === 'ar' ? arSA : enUS })}</Badge>
                            </div>
                            {task.description && <p className="text-sm line-through text-muted-foreground/80 mt-1">{task.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 self-end mt-2">
                            <Button variant='secondary' size="icon" onClick={() => toggleTaskCompletion(task.id)} title={t('uncompleteTask')}>
                                <CheckCircle className="h-5 w-5" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => deleteTask(task.id)} title={t('deleteTask')}>
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                    <p>{t('noCompletedTasks')}</p>
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
