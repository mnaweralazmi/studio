'use client';

import {
  CalendarIcon,
  Plus,
  ListTodo,
  History,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { TaskList, type Task } from '@/components/task-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function CalendarView({ tasks }: { tasks: Task[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const taskDates = tasks
    .map(task => {
        if (!task.date) return null;
        if (task.date instanceof Timestamp) return task.date.toDate();
        return new Date(task.date);
    })
    .filter((d): d is Date => d !== null);

  const modifiers = {
    hasTask: taskDates,
  };

  const modifiersClassNames = {
    hasTask: 'has-task',
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground sr-only">التقويم</h1>
      <Card>
        <CardContent className="p-0 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="inline-block"
            dir="rtl"
            locale={ar}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AddTaskView({ onAddTask, isAdding }: { onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void; isAdding: boolean; }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [reminder, setReminder] = useState('');

  const handleAddTask = () => {
    if (!title || !date || isAdding) return;
    onAddTask({ title, date, reminder });
    setTitle('');
    setDate(undefined);
    setReminder('');
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground sr-only">إضافة مهمة جديدة</h1>
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">عنوان المهمة</Label>
            <Input id="task-title" placeholder="مثال: ري قسم البطاطس" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
              <Label>تاريخ المهمة</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-right font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {date ? (
                      format(date, 'PPP', { locale: ar })
                    ) : (
                      <span>اختر تاريخًا</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    dir="rtl"
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>
           <div className="space-y-2">
              <Label htmlFor="task-reminder">تذكير قبل المهمة</Label>
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger id="task-reminder">
                  <SelectValue placeholder="اختر وقت التذكير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="قبل يوم">قبل يوم</SelectItem>
                  <SelectItem value="قبل يومين">قبل يومين</SelectItem>
                  <SelectItem value="قبل 3 أيام">قبل 3 أيام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          <Button className="w-full" onClick={handleAddTask} disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة المهمة'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TasksListContent({ tasks, onToggleTask, loading, title, description }: { tasks: Task[], onToggleTask?: (id: string) => void, loading: boolean, title: string, description: string }) {
  return (
     <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TaskList tasks={tasks} onToggleTask={onToggleTask} />
          )}
        </CardContent>
      </Card>
  )
}


export default function TasksView() {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isAdding, setIsAdding] = useState(false);

  const tasksCollection = user ? collection(db, 'users', user.uid, 'tasks') : null;
  
  const [upcomingTasksSnapshot, upcomingLoading] = useCollection(
    tasksCollection ? query(tasksCollection, where('completed', '==', false), orderBy('date', 'asc')) : null
  );
  
  const [pastTasksSnapshot, pastLoading] = useCollection(
    tasksCollection ? query(tasksCollection, where('completed', '==', true), orderBy('date', 'desc')) : null
  );

  const upcomingTasks: Task[] = upcomingTasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) || [];
  const pastTasks: Task[] = pastTasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) || [];

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    if (!tasksCollection) return;
    setIsAdding(true);
    try {
      await addDoc(tasksCollection, {
        ...taskData,
        completed: false,
        createdAt: new Date(),
      });
      setActiveTab('upcoming');
    } catch (error) {
      console.error("Error adding task: ", error);
      // Here you could show an error toast to the user
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleToggleTask = async (taskId: string) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    try {
      await updateDoc(taskRef, { completed: true });
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">التقويم والمهام</h1>
        <p className="mt-1 text-muted-foreground">
          جدول مهامك اليومية والأسبوعية.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming"><ListTodo className="h-4 w-4 ml-2" />قادمة</TabsTrigger>
          <TabsTrigger value="past"><History className="h-4 w-4 ml-2" />سابقة</TabsTrigger>
          <TabsTrigger value="add"><Plus className="h-4 w-4 ml-2" />إضافة</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarIcon className="h-4 w-4 ml-2" />التقويم</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6">
          <TasksListContent 
            tasks={upcomingTasks} 
            onToggleTask={handleToggleTask}
            loading={upcomingLoading}
            title="قادمة"
            description="مهامك التي لم يتم إنجازها بعد."
          />
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          <TasksListContent 
            tasks={pastTasks} 
            loading={pastLoading}
            title="سابقة"
            description="مهامك التي تم إنجازها."
          />
        </TabsContent>
        <TabsContent value="add" className="mt-6">
          <AddTaskView onAddTask={handleAddTask} isAdding={isAdding} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <CalendarView tasks={[...upcomingTasks, ...pastTasks]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
