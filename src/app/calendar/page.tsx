
"use client";

import * as React from 'react';
import { format, isValid, addDays, parseISO, startOfDay, isToday, isTomorrow, isWithinInterval, endOfWeek, endOfMonth } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, CalendarDays, CheckCircle, Repeat, Bell, Trash2, ChevronDown, Clock, GripVertical } from 'lucide-react';
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

const TaskItem = ({ task, onComplete, onDelete, language, t }: { task: Task, onComplete?: (id: string) => void, onDelete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => {
    const dueDate = parseISO(task.dueDate);
    const hasTime = !!task.dueDate.match(/T\d{2}:\d{2}/);
    
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

                    {onDelete && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <button title={t('deleteTask')} className="group">
                                    <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-destructive transition-colors" />
                                </button>
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
                        {task.reminderDays && task.reminderDays > 0 && <div className='flex items-center gap-2'>{getIconWithBg(Bell, 'bg-yellow-500')}<span>{t('remindMeBeforeXDays', {days: task.reminderDays})}</span></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};


const TaskList = ({ tasks, onComplete, onDelete, language, t }: { tasks: Task[], onComplete?: (id: string) => void, onDelete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => (
    <div className="space-y-3">
        {tasks.map(task => (
            <TaskItem key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} language={language} t={t} />
        ))}
    </div>
);

const TaskSection = ({ title, tasks, ...props }: { title: string, tasks: Task[], onComplete?: (id: string) => void, onDelete?: (id: string) => void, language: 'ar' | 'en', t: (key: any, params?: any) => string }) => (
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
              const parsedTasks: Task[] = JSON.parse(storedTasks);
              const validTasks = parsedTasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)));
              setTasks(validTasks);
          } catch(e) {
              console.error("Failed to parse tasks, resetting.", e);
              localStorage.removeItem(userTasksKey);
          }
      }
    }
  }, [user, loading]);
  
  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    if(user) {
        const userTasksKey = `calendarTasks_${user.uid}`;
        localStorage.setItem(userTasksKey, JSON.stringify(newTasks));
    }
  }

  const handleCompleteTask = (taskId: string) => {
    let newTasks = [...tasks];
    const taskIndex = newTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToComplete = newTasks[taskIndex];

    if (taskToComplete.isRecurring) {
        taskToComplete.isCompleted = true;
        
        const nextDueDate = addDays(new Date(taskToComplete.dueDate), 7);
        const newTask: Task = {
            ...taskToComplete,
            id: crypto.randomUUID(),
            dueDate: nextDueDate.toISOString(),
            isCompleted: false,
        };
        newTasks.push(newTask);
    } else {
        taskToComplete.isCompleted = true;
    }
    
    updateTasks(newTasks);
    toast({ title: t('taskCompleted'), description: t('taskCompletedDesc') });
  };
  
  const handleDeleteTask = (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    updateTasks(newTasks);
    toast({ variant: "destructive", title: t('taskDeleted') });
  }
  
  const today = startOfDay(new Date());

  const upcomingTasks = tasks.filter(task => !task.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const todayTasks = upcomingTasks.filter(task => isToday(parseISO(task.dueDate)));
  
  const allCompletedTasks = tasks
    .filter(task => task.isCompleted)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  
  if (loading) {
    return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>
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
            title={t('upcomingTasksForDay')} 
            tasks={upcomingTasks} 
            onComplete={handleCompleteTask} 
            onDelete={handleDeleteTask} 
            language={language} t={t} 
          />
          
          <TaskSection 
            title={t('tasksForDay')} 
            tasks={todayTasks} 
            onComplete={handleCompleteTask} 
            onDelete={handleDeleteTask} 
            language={language} t={t}
          />

          <Card>
            <CardHeader>
                <CardTitle>{t('completedTasksLog')} ({allCompletedTasks.length})</CardTitle>
            </CardHeader>
             <CardContent className="overflow-y-auto max-h-96 pr-2">
                {allCompletedTasks.length > 0 ? (
                        <div className="space-y-3">
                        {allCompletedTasks.slice(0,20).map(task => (
                            <TaskItem key={task.id} task={task} language={language} t={t} onDelete={handleDeleteTask} />
                        ))}
                    </div>
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
