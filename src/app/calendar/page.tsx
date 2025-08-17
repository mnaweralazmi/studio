
"use client";

import * as React from 'react';
import { format, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Trash2, CalendarDays, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';

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

  React.useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('calendarTasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Failed to parse tasks from localStorage", error);
      // Handle corrupted data by clearing it
      localStorage.removeItem('calendarTasks');
    }
  }, []);

  const saveTasks = (updatedTasks: Task[]) => {
    localStorage.setItem('calendarTasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
    toast({
      variant: "destructive",
      title: "تم حذف المهمة بنجاح!",
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    saveTasks(updatedTasks);
    toast({
      title: updatedTasks.find(t => t.id === taskId)?.isCompleted ? "أحسنت!" : "تم تحديث المهمة",
      description: updatedTasks.find(t => t.id === taskId)?.isCompleted ? "تم إنجاز المهمة بنجاح." : "المهمة غير مكتملة.",
    });
  };

  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';
  const tasksForSelectedDate = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    if (!isValid(taskDate)) return false;
    return format(taskDate, 'yyyy-MM-dd') === selectedDateString;
  });

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
                locale={arSA}
                classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                    day_today: "bg-accent text-accent-foreground",
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card className="min-h-[380px]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays />
                        مهام يوم: {date ? format(date, 'd MMMM yyyy', { locale: arSA }) : 'الرجاء تحديد يوم'}
                    </CardTitle>
                    <CardDescription>عرض وإدارة المهام المجدولة لهذا اليوم.</CardDescription>
                </div>
                 <Button asChild>
                    <Link href="/calendar/add-task">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة مهمة
                    </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasksForSelectedDate.length > 0 ? (
                <ul className="space-y-3">
                  {tasksForSelectedDate.map(task => (
                    <li key={task.id} className={`flex items-start gap-4 p-3 rounded-lg border transition-all ${task.isCompleted ? 'bg-muted/50' : 'bg-background'}`}>
                      <div className="flex-1 space-y-1">
                        <p className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className={`text-sm ${task.isCompleted ? 'line-through text-muted-foreground/80' : 'text-muted-foreground'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant={task.isCompleted ? 'secondary' : 'default'} size="icon" onClick={() => toggleTaskCompletion(task.id)} title={task.isCompleted ? 'إلغاء الإنجاز' : 'إنجاز المهمة'}>
                           <CheckCircle className="h-5 w-5" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => deleteTask(task.id)} title="حذف المهمة">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <p>لا توجد مهام مجدولة لهذا اليوم.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
