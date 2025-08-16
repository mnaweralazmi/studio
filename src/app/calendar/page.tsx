
"use client"

import * as React from "react"
import NextLink from 'next/link';
import { useSearchParams, useRouter } from "next/navigation";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Calendar as CalendarIcon, Plus, Trash2, Repeat, SprayCan, Sprout, TestTube, Droplets as DropletsIcon, Apple, Carrot } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";

type Task = {
  id: string;
  title: string;
  taskType: string;
  description?: string;
  vegetable?: string;
  fruit?: string;
  date: Date;
};

const taskIcons: { [key: string]: React.ElementType } = {
  "رش": SprayCan,
  "ري": DropletsIcon,
  "زراعة": Sprout,
  "تسميد": TestTube,
};

// Helper function to get tasks from localStorage
const getTasksFromStorage = (): Task[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const tasksJson = localStorage.getItem('calendarTasks');
  if (!tasksJson) return [];
  try {
    const parsedTasks = JSON.parse(tasksJson);
    // Revive dates
    return parsedTasks.map((task: any) => ({
      ...task,
      date: new Date(task.date),
    }));
  } catch (error) {
    console.error("Failed to parse tasks from localStorage", error);
    return [];
  }
};

// Helper function to set tasks in localStorage
const setTasksInStorage = (tasks: Task[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('calendarTasks', JSON.stringify(tasks));
};


export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load tasks from storage ONCE on component mount.
  React.useEffect(() => {
    setTasks(getTasksFromStorage());
  }, []);

  // Handle adding a new task from query params.
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const title = params.get('title');
    const taskType = params.get('taskType');
    
    // Only proceed if the essential params are present.
    if (title && taskType) {
      const description = params.get('description');
      const vegetable = params.get('vegetable');
      const fruit = params.get('fruit');
      const dateStr = params.get('date');
      const newTaskDate = dateStr ? new Date(dateStr) : new Date();

      const newTask: Task = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        taskType,
        description: description || undefined,
        vegetable: vegetable || undefined,
        fruit: fruit || undefined,
        date: newTaskDate,
      };

      // **CRITICAL FIX**: Read the latest from storage, update, then set state and storage.
      // This prevents overwriting previous tasks.
      const existingTasks = getTasksFromStorage();
      const updatedTasks = [...existingTasks, newTask];
      setTasksInStorage(updatedTasks);
      setTasks(updatedTasks);
      setDate(newTaskDate);

      // Clear query params immediately to prevent re-triggering.
      router.replace('/calendar', {scroll: false});
    }
    // This effect should only run when the component mounts and the initial searchParams are read.
    // The router.replace will not trigger it again because the dependency is on the searchParams object itself, not its content.
    // However, to be absolutely safe and explicit, we can disable the dependency warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Set initial date on client to avoid hydration mismatch
   React.useEffect(() => {
    if(!date) {
      setDate(new Date());
    }
  }, [date]);


  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasksInStorage(updatedTasks);
    setTasks(updatedTasks);
  };
  
  const repeatTask = (task: Task) => {
    const repeatedTask: Task = { ...task, id: `${Date.now()}-${Math.random()}`, title: `${task.title} (مكرر)` };
    // Read from storage before updating to ensure we have the latest list
    const existingTasks = getTasksFromStorage();
    const updatedTasks = [...existingTasks, repeatedTask];
    setTasksInStorage(updatedTasks);
    setTasks(updatedTasks);
  };

  const getTaskIcon = (taskType: string) => {
    const Icon = taskIcons[taskType] || CalendarIcon;
    return <Icon className="h-4 w-4" />;
  };
  
  const filteredTasks = tasks.filter(task => {
    if (!date) return false;
    const taskDate = new Date(task.date);
    const selectedDate = new Date(date);
    return taskDate.getDate() === selectedDate.getDate() &&
           taskDate.getMonth() === selectedDate.getMonth() &&
           taskDate.getFullYear() === selectedDate.getFullYear();
  });

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
          <Card className="w-full flex justify-center">
            <div className="flex flex-col items-center w-full p-4">
              <CardHeader className="items-center text-center">
                  <CardTitle className="flex items-center gap-2">
                      <CalendarIcon />
                      التقويم والمهام
                  </CardTitle>
                  <CardDescription>
                      هنا يمكنك إدارة مهامك ومواعيدك الزراعية.
                  </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 w-full">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  disabled={!date}
                />
                {date && (
                  <Button asChild>
                    <NextLink href={`/calendar/add-task?date=${date.toISOString()}`}>
                      <Plus className="ml-2 h-4 w-4" />
                      إضافة مهمة
                    </NextLink>
                  </Button>
                )}
                
                {date && filteredTasks.length > 0 && (
                  <div className="w-full max-w-4xl mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>قائمة المهام لـ {format(date, "PPP", { locale: arSA })}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>المهمة</TableHead>
                              <TableHead>النوع</TableHead>
                              <TableHead>التفاصيل</TableHead>
                              <TableHead>التاريخ</TableHead>
                              <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                   <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                    {getTaskIcon(task.taskType)}
                                    <span>{task.taskType}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                      {task.vegetable && (
                                          <Badge variant="outline" className="flex items-center gap-1">
                                              <Carrot className="h-3 w-3" />
                                              {task.vegetable}
                                          </Badge>
                                      )}
                                      {task.fruit && (
                                           <Badge variant="outline" className="flex items-center gap-1">
                                              <Apple className="h-3 w-3" />
                                              {task.fruit}
                                          </Badge>
                                      )}
                                  </div>
                                </TableCell>
                                <TableCell>{format(task.date, "P", { locale: arSA })}</TableCell>
                                <TableCell className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => repeatTask(task)} title="تكرار المهمة">
                                    <Repeat className="h-4 w-4" />
                                  </Button>
                                  <Button variant="destructive" size="icon" onClick={() => deleteTask(task.id)} title="حذف المهمة">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}

              </CardContent>
            </div>
          </Card>
      </div>
    </main>
  );
}
