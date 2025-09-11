'use client';

import { CalendarIcon, ListChecks, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from '@/components/task-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Sub-page Components

function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground">التقويم</h1>
      <Card>
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="w-full"
            dir="rtl"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TasksListView() {
  const upcomingTasks = [
    { time: '١١:٠٠ ص', title: 'تسميد أشجار الليمون', completed: false },
    { time: '٠٢:٠٠ م', title: 'فحص الفخاخ الحشرية', completed: false },
  ];

  const pastTasks = [
    { time: '٠٨:٠٠ ص', title: 'ري قسم البطاطس', completed: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">قائمة المهام</h1>
      <Card>
        <CardHeader>
          <CardTitle>المهام</CardTitle>
          <CardDescription>
            نظرة سريعة على مهامك القادمة والسابقة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">قادمة</TabsTrigger>
              <TabsTrigger value="past">سابقة</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <TaskList tasks={upcomingTasks} />
            </TabsContent>
            <TabsContent value="past">
              <TaskList tasks={pastTasks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function AddTaskView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">إضافة مهمة جديدة</h1>
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">عنوان المهمة</Label>
            <Input id="task-title" placeholder="مثال: ري قسم البطاطس" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-time">وقت المهمة</Label>
            <Input id="task-time" type="time" dir="ltr" />
          </div>
           <div className="space-y-2">
            <Label>تاريخ المهمة</Label>
            <Calendar
                mode="single"
                selected={new Date()}
                className="rounded-md border"
                dir="rtl"
              />
          </div>
          <Button className="w-full">
            <Plus className="h-4 w-4 ml-2" />
            إضافة المهمة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const tasksTabs: {
  id: 'calendar' | 'list' | 'add';
  title: string;
  icon: React.ElementType;
  component: ReactNode;
}[] = [
  {
    id: 'calendar',
    title: 'التقويم',
    icon: CalendarIcon,
    component: <CalendarView />,
  },
  {
    id: 'list',
    title: 'المهام',
    icon: ListChecks,
    component: <TasksListView />,
  },
  { id: 'add', title: 'إضافة مهمة', icon: Plus, component: <AddTaskView /> },
];

export default function TasksPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'calendar';
  const activeTab = tasksTabs.find((t) => t.id === tab) || tasksTabs[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">التقويم والمهام</h1>
        <p className="mt-1 text-muted-foreground">
          جدول مهامك اليومية والأسبوعية.
        </p>
      </header>

      <div className="mt-6">{activeTab.component}</div>
    </div>
  );
}
