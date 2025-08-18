
"use client";

import * as React from 'react';
import { format, isValid, isFuture, isToday } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Trash2, CalendarDays, CheckCircle, ListTodo, ListChecks, Forward, History } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const userTasksKey = `calendarTasks_${parsedUser.username}`;
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
  }, []);

  React.useEffect(() => {
    if (user) {
        const userTasksKey = `calendarTasks_${user.username}`;
        localStorage.setItem(userTasksKey, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    toast({
      variant: "destructive",
      title: "تم حذف المهمة بنجاح!",
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    setTasks(updatedTasks);
    toast({
      title: updatedTasks.find(t => t.id === taskId)?.isCompleted ? "أحسنت!" : "تم تحديث المهمة",
      description: updatedTasks.find(t => t.id === taskId)?.isCompleted ? "تم إنجاز المهمة بنجاح." : "المهمة غير مكتملة.",
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

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-start gap-8 flex-col lg:flex-row">
          <div className="w-full lg:w-auto flex justify-center">
            <Card>
              <CardContent className="p-0">
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
          <div className="flex-1 w-full space-y-8">
            <Card className="min-h-[405px]">
                <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays />
                            مهام يوم: {date ? format(date, 'd MMMM yyyy', { locale: arSA }) : 'الرجاء تحديد يوم'}
                        </CardTitle>
                        <CardDescription>عرض وإدارة المهام القادمة المجدولة لهذا اليوم.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/calendar/add-task">
                            <PlusCircle className="ml-2 h-4 w-4" />
                            إضافة مهمة
                        </Link>
                    </Button>
                </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-primary">
                            <ListTodo />
                            المهام القادمة لهذا اليوم
                        </h3>
                        {upcomingTasksForSelectedDate.length > 0 ? (
                            <ul className="space-y-3">
                            {upcomingTasksForSelectedDate.map(task => (
                                <li key={task.id} className="flex items-start gap-4 p-3 rounded-lg border bg-background transition-all">
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium">{task.title}</p>
                                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant='default' size="icon" onClick={() => toggleTaskCompletion(task.id)} title='إنجاز المهمة'>
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
                            <div className="text-center text-muted-foreground py-4">
                                <p>لا توجد مهام قادمة لهذا اليوم.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <Forward />
                          كل المهام القادمة
                      </CardTitle>
                      <CardDescription>نظرة عامة على جميع المهام المستقبلية غير المنجزة.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {allUpcomingTasks.length > 0 ? (
                          <ul className="space-y-3 max-h-96 overflow-y-auto">
                          {allUpcomingTasks.map(task => (
                              <li key={task.id} className="flex items-start gap-4 p-3 rounded-lg border bg-background transition-all">
                                  <div className="flex-1 space-y-1">
                                      <div className="flex justify-between items-center">
                                          <p className="font-medium">{task.title}</p>
                                          <Badge variant="outline">{format(new Date(task.dueDate), 'd MMM', { locale: arSA })}</Badge>
                                      </div>
                                      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Button variant='default' size="icon" onClick={() => toggleTaskCompletion(task.id)} title='إنجاز المهمة'>
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
                          <div className="text-center text-muted-foreground py-4">
                              <p>لا توجد لديك مهام قادمة. عظيم!</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History />
                        سجل المهام المنجزة
                    </CardTitle>
                    <CardDescription>جميع المهام التي أنجزتها، مرتبة من الأحدث للأقدم.</CardDescription>
                </CardHeader>
                <CardContent>
                    {allCompletedTasks.length > 0 ? (
                      <ul className="space-y-3 max-h-96 overflow-y-auto">
                        {allCompletedTasks.map(task => (
                          <li key={task.id} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/50 transition-all">
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                                  <Badge variant="secondary">{format(new Date(task.dueDate), 'd MMM', { locale: arSA })}</Badge>
                                </div>
                                {task.description && <p className="text-sm line-through text-muted-foreground/80 mt-1">{task.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant='secondary' size="icon" onClick={() => toggleTaskCompletion(task.id)} title='إلغاء الإنجاز'>
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
                      <div className="text-center text-muted-foreground py-4">
                        <p>لم تنجز أي مهام بعد.</p>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
