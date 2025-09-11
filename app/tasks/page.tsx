'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
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

export default function TasksPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const upcomingTasks = [
    { time: '١١:٠٠ ص', title: 'تسميد أشجار الليمون', completed: false },
    { time: '٠٢:٠٠ م', title: 'فحص الفخاخ الحشرية', completed: false },
  ];

  const pastTasks = [
    { time: '٠٨:٠٠ ص', title: 'ري قسم البطاطس', completed: true },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التقويم والمهام</h1>
          <p className="mt-1 text-muted-foreground">
            جدول مهامك اليومية والأسبوعية.
          </p>
        </div>
        <Button>
          <div className="p-1 rounded-md border bg-primary-foreground/20 mr-2">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </div>
          إضافة مهمة جديدة
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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

        <div className="lg:col-span-1">
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
      </div>
    </div>
  );
}
