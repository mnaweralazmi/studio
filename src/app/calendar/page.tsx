"use client"

import * as React from "react"
import NextLink from 'next/link';
import { useSearchParams } from "next/navigation";
import { isSameDay } from 'date-fns';
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
  const searchParams = useSearchParams()

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
        id: Date.now(),
        title,
        taskType,
        description: description || undefined,
        date: newTaskDate,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      // Set calendar to the new task's date
      setDate(newTaskDate);
      // Clear query params after adding task to avoid re-adding on refresh
      window.history.replaceState(null, '', '/calendar');
    }
  }, [searchParams]);

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  const repeatTask = (task: Task) => {
    const repeatedTask: Task = { ...task, id: Date.now(), title: `${task.title} (مكرر)` };
    setTasks(prevTasks => [...prevTasks, repeatedTask]);
  };

  const getTaskIcon = (taskType: string) => {
    const Icon = taskIcons[taskType] || CalendarIcon;
    return <Icon className="h-4 w-4" />;
  };
  
  const filteredTasks = tasks.filter(task => date && isSameDay(task.date, date));

  const linkDate = date ? date.toISOString() : new Date().toISOString();

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
                <Button asChild>
                  <NextLink href={`/calendar/add-task?date=${linkDate}`}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة مهمة
                  </NextLink>
                </Button>
                
                {filteredTasks.length > 0 && (
                  <div className="w-full max-w-4xl mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>قائمة المهام</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>المهمة</TableHead>
                              <TableHead>النوع</TableHead>
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
