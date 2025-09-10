
"use client";

import * as React from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Timestamp, doc, collection, writeBatch, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, CalendarDays, CheckCircle, Repeat, Bell, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/language-context';
import { useAppContext } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import type { Task, ArchivedTask } from '@/lib/types';


const TaskItem = ({ task, onComplete, language, t }: { task: Task | ArchivedTask, onComplete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => {
    const dueDate = task.dueDate;
    const hasTime = task.dueDate.getHours() !== 0 || task.dueDate.getMinutes() !== 0;
    
    const getIconWithBg = (Icon: React.ElementType, colorClass: string) => (
        <div className={`p-1 rounded-full ${colorClass}`}>
            <Icon className="h-3.5 w-3.5 text-white" />
        </div>
    )
    
    return (
        <div className="flex items-start justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-all border">
            <div className="flex items-center gap-3 flex-1">
                 <div className="flex flex-col gap-2 text-xs text-muted-foreground self-start pt-1">
                    {onComplete && !task.isCompleted && (
                        <button onClick={() => onComplete(task.id)} title={t('completeTask')} className="group">
                           <CheckCircle className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                        </button>
                    )}
                    {task.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                </div>
                
                <div className="flex-1">
                    <span className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                    {task.description && (
                        <p className={`text-sm text-muted-foreground mt-1 ${task.isCompleted ? 'line-through' : ''}`}>
                            {task.description}
                        </p>
                    )}
                     <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                         <div className='flex items-center gap-2'>
                            {getIconWithBg(CalendarDays, 'bg-blue-500')}
                            <span>{format(dueDate, "PPP", { locale: language === 'ar' ? arSA : enUS })}</span>
                        </div>
                        {hasTime && <div className='flex items-center gap-2'>{getIconWithBg(Clock, 'bg-orange-500')}<span>{format(dueDate, "p", { locale: language === 'ar' ? arSA : enUS })}</span></div>}
                        {task.isRecurring && <div className='flex items-center gap-2'>{getIconWithBg(Repeat, 'bg-purple-500')}<span>{t('rememberTask')}</span></div>}
                        {task.reminderDays && task.reminderDays > 0 && <div className='flex items-center gap-2'>{getIconWithBg(Bell, 'bg-yellow-500')}<span>{t('remindMeBeforeXDays', {days: task.reminderDays}) as string}</span></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};


const TaskList = ({ tasks, onComplete, language, t }: { tasks: (Task | ArchivedTask)[], onComplete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => (
    <div className="space-y-3">
        {tasks.map(task => (
            <TaskItem key={task.id} task={task} onComplete={onComplete} language={language} t={t} />
        ))}
    </div>
);

const TaskSection = ({ title, tasks, ...props }: { title: string, tasks: Task[], onComplete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => (
    <Card className="flex flex-col h-full">
        <CardHeader>
            <CardTitle>{title} ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pr-2">
             {tasks.length > 0 ? (
                <div className="space-y-4">
                    <TaskList tasks={tasks} {...props} />
                </div>
            ) : (
                 <p className="text-center text-muted-foreground py-4">{props.t('noUpcomingTasksForDay')}</p>
            )}
        </CardContent>
    </Card>
);

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const { user, tasks, loading, completedTasks } = useAppContext();
  const { language, t } = useLanguage();

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    
    const taskList = Array.isArray(tasks) ? tasks : [];
    const taskToComplete = taskList.find(t => t.id === taskId);
    if (!taskToComplete) return;

    try {
        if (taskToComplete.isRecurring) {
            const nextDueDate = addDays(taskToComplete.dueDate, 7);
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, { dueDate: Timestamp.fromDate(nextDueDate) });
        } else {
            const batch = writeBatch(db);
            const originalTaskRef = doc(db, 'tasks', taskId);
            const archiveRef = doc(collection(db, 'completed_tasks'));
            
            const archivedTaskData: Omit<ArchivedTask, 'id'> = {
                title: taskToComplete.title,
                description: taskToComplete.description,
                dueDate: taskToComplete.dueDate,
                isCompleted: true,
                isRecurring: taskToComplete.isRecurring,
                reminderDays: taskToComplete.reminderDays,
                ownerId: user.uid,
                completedAt: new Date(),
            };
            
            const finalArchivedData = {
                ...archivedTaskData,
                dueDate: Timestamp.fromDate(archivedTaskData.dueDate),
                completedAt: Timestamp.fromDate(archivedTaskData.completedAt),
            }

            batch.set(archiveRef, finalArchivedData);
            batch.delete(originalTaskRef);
            await batch.commit();
        }
        
        toast({ title: t('taskCompleted'), description: t('taskCompletedDesc') });
    } catch (e) {
        console.error("Failed to complete task:", e);
        toast({ variant: 'destructive', title: t('error'), description: 'Failed to update task.' });
    }
  };
  
  const upcomingTasks = (Array.isArray(tasks) ? tasks : [])
    .filter(task => !task.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const selectedDayTasks = upcomingTasks.filter(task => date && isSameDay(task.dueDate, date));

  const recentCompletedTasks = (Array.isArray(completedTasks) ? completedTasks : [])
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, 10);
  
  if (loading) {
    return (
        <main className="flex flex-1 flex-col p-4 sm:p-6 md:p-8">
             <div className="w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
                    <div>
                        <Skeleton className="h-9 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-10 w-28" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{gridTemplateRows: 'auto auto'}}>
                     <Skeleton className="h-[298px] w-full" />
                     <Skeleton className="h-[400px] w-full" />
                     <Skeleton className="h-[400px] w-full" />
                     <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
         <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{gridTemplateRows: 'auto auto'}}>
            <Card className="row-span-1">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-0"
                    classNames={{
                        root: "w-full",
                        months: "w-full",
                        month: "w-full",
                        table: "w-full",
                        head_row: "w-full",
                        row: "w-full",
                    }}
                    locale={language === 'ar' ? arSA : enUS}
                />
            </Card>

            <TaskSection 
                title={t('tasksForDay')} 
                tasks={selectedDayTasks} 
                onComplete={handleCompleteTask} 
                language={language} t={t}
            />
            
            <TaskSection 
                title={t('allUpcomingTasks')} 
                tasks={upcomingTasks} 
                onComplete={handleCompleteTask} 
                language={language} t={t} 
            />

            <Card>
                <CardHeader>
                    <CardTitle>{t('completedTasksLog')}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-96 pr-2">
                    {recentCompletedTasks.length > 0 ? (
                        <>
                        <TaskList tasks={recentCompletedTasks} language={language} t={t} />
                         <p className="text-center text-sm text-muted-foreground py-4 mt-4">
                            {t('completedTasksLogDesc')}
                            <Link href="/archive" className="text-primary hover:underline font-semibold mx-1">
                                {t('archivePageTitle')}
                            </Link>
                            .
                        </p>
                        </>
                    ) : (
                         <p className="text-center text-muted-foreground py-4">{t('noCompletedTasks')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
