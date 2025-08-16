"use client"

import * as React from "react"
import NextLink from 'next/link';
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Calendar as CalendarIcon, Plus, Trash2, Repeat, Spray, Sprout, TestTube, Droplets as DropletsIcon } from 'lucide-react'
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
};

const taskIcons: { [key: string]: React.ElementType } = {
  "رش": Spray,
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
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const title = searchParams.get('title');
    const taskType = searchParams.get('taskType');
    const description = searchParams.get('description');

    if (title && taskType) {
      const newTask: Task = {
        id: Date.now(),
        title,
        taskType,
        description: description || undefined,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
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
                />
                <Button asChild>
                  <NextLink href="/calendar/add-task">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة مهمة
                  </NextLink>
                </Button>
                
                {tasks.length > 0 && (
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
                            {tasks.map((task) => (
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
