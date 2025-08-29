
"use client";

import * as React from 'react';
import { format, isValid, isFuture, isToday, addDays, parseISO, isTomorrow, endOfWeek, startOfDay } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, CalendarDays, CheckCircle, Forward, Repeat, Bell, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string
  isCompleted: boolean;
  isRecurring: boolean;
  reminderDays?: number;
}

const TaskItem = ({ task, onComplete, onDelete, language, t }: { task: Task, onComplete?: (id: string) => void, onDelete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => (
    <div className="flex items-start justify-between p-4 rounded-lg bg-background hover:bg-muted/50 transition-all">
        <div className="flex-1">
            <div className="flex items-center gap-3">
                <span className="font-medium">{task.title}</span>
                 {task.isCompleted && <Badge variant="default" className="bg-green-600 hover:bg-green-600/80">{t('statusPaid')}</Badge>}
            </div>
            {task.description && (
                <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                 <div className='flex items-center gap-1'><CalendarDays className="h-3 w-3" /><span>{format(parseISO(task.dueDate), "PPP", { locale: language === 'ar' ? arSA : enUS })}</span></div>
                {task.isRecurring && 
                    <div className='flex items-center gap-1'><Repeat className="h-3 w-3" /><span>{t('rememberTask')}</span></div>
                }
                {task.reminderDays && task.reminderDays > 0 && 
                    <div className='flex items-center gap-1'><Bell className="h-3 w-3" /><span>{t('remindMeBeforeXDays', {days: task.reminderDays})}</span></div>
                }
            </div>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
             {onComplete && (
                 <Button onClick={() => onComplete(task.id)} size="icon" variant="ghost" className="text-green-600 border-green-600/20 hover:bg-green-500/10 hover:text-green-700 h-8 w-8">
                    <CheckCircle className="h-4 w-4" />
                </Button>
            )}
            {onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('confirmDeleteTopicDesc', { topicName: task.title })}</AlertDialogDescription>
                        </AlertDialogHeader>
                         <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(task.id)}>{t('confirmDelete')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    </div>
);

const TaskList = ({ tasks, ...props }: { tasks: Task[], onComplete?: (id: string) => void, onDelete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => (
    <div className="space-y-2">
        {tasks.map(task => (
            <TaskItem key={task.id} task={task} {...props} />
        ))}
    </div>
);


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

  const handleCompleteTask = (taskId: string) => {
    if (!user) return;
    
    let newTasks = [...tasks];
    const taskIndex = newTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToComplete = newTasks[taskIndex];

    if (taskToComplete.isRecurring) {
        taskToComplete.isCompleted = true;
        taskToComplete.isRecurring = false; 

        const nextDueDate = addDays(new Date(taskToComplete.dueDate), 7);
        const newTask: Task = {
            ...taskToComplete,
            id: crypto.randomUUID(),
            dueDate: nextDueDate.toISOString(),
            isCompleted: false,
            isRecurring: true, 
        };
        newTasks.push(newTask);
    } else {
        taskToComplete.isCompleted = true;
    }
    
    setTasks(newTasks);
    const userTasksKey = `calendarTasks_${user.uid}`;
    localStorage.setItem(userTasksKey, JSON.stringify(newTasks));
    toast({ title: t('taskCompleted'), description: t('taskCompletedDesc') });
  };
  
  const handleDeleteTask = (taskId: string) => {
    if (!user) return;
    
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    
    const userTasksKey = `calendarTasks_${user.uid}`;
    localStorage.setItem(userTasksKey, JSON.stringify(newTasks));
    toast({ variant: "destructive", title: t('taskDeleted') });
  }


  const selectedDayStart = startOfDay(date || new Date());
  
  const upcomingTasks = tasks.filter(task => {
    const taskDate = parseISO(task.dueDate);
    return isValid(taskDate) && !task.isCompleted && taskDate >= selectedDayStart;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const tasksForSelectedDate = upcomingTasks.filter(task => format(parseISO(task.dueDate), 'yyyy-MM-dd') === format(selectedDayStart, 'yyyy-MM-dd'));
  
  const otherUpcomingTasks = upcomingTasks.filter(task => format(parseISO(task.dueDate), 'yyyy-MM-dd') !== format(selectedDayStart, 'yyyy-MM-dd'));
  

  const allCompletedTasks = tasks
    .filter(task => task.isCompleted)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  
  if (loading) {
    return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
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
            </div>
            
            <div className="md:col-span-2 space-y-6">
                 <section>
                    <h2 className="text-lg font-semibold mb-2">{t('tasksForDay')} ({date ? format(date, 'd MMM', { locale: language === 'ar' ? arSA : enUS }) : ''})</h2>
                     {tasksForSelectedDate.length > 0 ? (
                        <TaskList tasks={tasksForSelectedDate} onComplete={handleCompleteTask} onDelete={handleDeleteTask} language={language} t={t} />
                    ) : (
                        <p className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">{t('noUpcomingTasksForDay')}</p>
                    )}
                </section>

                <Separator />
                
                <section>
                    <h2 className="text-lg font-semibold mb-4">{t('allUpcomingTasks')}</h2>
                    {otherUpcomingTasks.length > 0 ? (
                         <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                             <TaskList tasks={otherUpcomingTasks} onComplete={handleCompleteTask} onDelete={handleDeleteTask} language={language} t={t} />
                         </div>
                    ) : (
                         <p className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">{t('noUpcomingTasks')}</p>
                    )}
                </section>
                
                <Separator />
                
                <Collapsible>
                    <CollapsibleTrigger className="flex justify-between items-center w-full text-lg font-semibold">
                       <span>{t('completedTasksLog')} ({allCompletedTasks.length})</span>
                       <ChevronDown className="h-5 w-5 transition-transform [&[data-state=open]]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                        {allCompletedTasks.length > 0 ? (
                             <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {allCompletedTasks.slice(0,20).map(task => (
                                <TaskItem key={task.id} task={task} language={language} t={t} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">{t('noCompletedTasks')}</p>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
      </div>
    </main>
  );
}

