"use client"

import * as React from "react"
import NextLink from 'next/link';
import { useSearchParams, useRouter } from "next/navigation";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Calendar as CalendarIcon, Plus, Trash2, Repeat, SprayCan, Sprout, TestTube, Droplets as DropletsIcon } from 'lucide-react'
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
  id: number;
  title: string;
  taskType: string;
  description?: string;
  date: Date;
};

const taskIcons: { [key: string]: React.ElementType } = {
  "رش": SprayCan,
  "ري": DropletsIcon,
  "زراعة": Sprout,
  "تسميد": TestTube,
};

const taskTypeTranslations: { [key: string]: string } = {
    "رش": "رش",
    "ري": "ري",
    "زراعة": "زراعة",
    "تسميد": "تسميد",
};


export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    // Set initial date on client to avoid hydration mismatch
    if (date === undefined) {
      setDate(new Date());
    }
  }, [date]);

  React.useEffect(() => {
    const title = searchParams.get('title');
    const taskType = searchParams.get('taskType');
    const description = searchParams.get('description');
    const dateStr = searchParams.get('date');

    if (title && taskType && dateStr) {
      const newTaskDate = new Date(dateStr);
      const newTask: Task = {
        id: Date.now(), // Use a simpler ID for the check
        title,
        taskType,
        description: description || undefined,
        date: newTaskDate,
      };
      
      // Clear query params immediately to prevent re-triggering
      // This is the most important part of the fix
      router.replace('/calendar', {scroll: false});

      setTasks(prevTasks => {
        // Prevent adding duplicate tasks by checking if a similar task was just added
        const taskExists = prevTasks.some(
          (task) =>
            task.title === newTask.title &&
            task.date.getTime() === newTask.date.getTime()
        );

        if (taskExists) {
            return prevTasks;
        }
        
        return [...prevTasks, { ...newTask, id: Date.now() + Math.random() }]; // Add with a more unique ID
      });

      // Set calendar to the new task's date
      setDate(newTaskDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  const repeatTask = (task: Task) => {
    const repeatedTask: Task = { ...task, id: Date.now() + Math.random(), title: `${task.title} (مكرر)` };
    setTasks(prevTasks => [...prevTasks, repeatedTask]);
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
                
                {filteredTasks.length > 0 && (
                  <div className="w-full max-w-4xl mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>قائمة المهام لـ {format(date!, "PPP", { locale: arSA })}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>المهمة</TableHead>
                              <TableHead>النوع</TableHead>
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
                                    <span>{taskTypeTranslations[task.taskType]}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>{format(task.date, "PPP", { locale: arSA })}</TableCell>
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
