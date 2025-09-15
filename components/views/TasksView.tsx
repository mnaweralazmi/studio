'use client';

import {
  Plus,
  Loader2,
  CalendarIcon
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
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
import { Textarea } from '@/components/ui/textarea';
import { isSameDay, format, isToday, startOfToday } from 'date-fns';
import { ar } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function AddTaskDialog({ onAddTask, isAdding }: { onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void; isAdding: boolean; }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reminder, setReminder] = useState('12:00');
  const [open, setOpen] = useState(false);

  const handleAddTask = () => {
    if (!title || !date || isAdding) return;
    onAddTask({ title, description, date: date.toISOString(), reminder });
    setTitle('');
    setDescription('');
    setDate(new Date());
    setReminder('12:00');
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 ml-2" />
                إضافة مهمة
            </Button>
        </DialogTrigger>
        <DialogContent>
             <DialogHeader>
                <DialogTitle>إضافة مهمة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="task-title">عنوان المهمة</Label>
                    <Input id="task-title" placeholder="مثال: ري قسم البطاطس" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="task-description">وصف المهمة (اختياري)</Label>
                    <Textarea id="task-description" placeholder="تفاصيل إضافية عن المهمة" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 flex flex-col">
                        <Label>تاريخ المهمة</Label>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border self-center"
                            locale={ar}
                            />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="task-time">وقت التذكير</Label>
                        <Input type="time" id="task-time" value={reminder} onChange={(e) => setReminder(e.target.value)} />
                    </div>
                 </div>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">إلغاء</Button>
                </DialogClose>
                <Button onClick={handleAddTask} disabled={isAdding || !title || !date}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="mr-2">{isAdding ? 'جاري الإضافة...' : 'إضافة'}</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}


export default function TasksView() {
  const [user, loadingUser] = useAuthState(auth);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksCollection = user ? collection(db, 'users', user.uid, 'tasks') : null;
  
  const [allTasksSnapshot, loadingTasks] = useCollection(
    tasksCollection ? query(tasksCollection, orderBy('date', 'asc')) : null
  );

  const { upcomingTasks, todayTasks, selectedDayTasks, completedTasks, taskDates } = useMemo(() => {
    const allTasks: Task[] = allTasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) || [];

    const upcoming: Task[] = [];
    const today: Task[] = [];
    const selected: Task[] = [];
    const completed: Task[] = [];
    const dates: Date[] = [];
    
    const todayDate = startOfToday();

    allTasks.forEach(task => {
      const taskDate = task.date ? (task.date instanceof Timestamp ? task.date.toDate() : new Date(task.date)) : null;

      if (task.completed) {
        completed.push(task);
      } else if (taskDate) {
        dates.push(taskDate);
        if (isToday(taskDate)) {
          today.push(task);
        } else if (taskDate > todayDate) {
           upcoming.push(task);
        }
        if (selectedDate && isSameDay(taskDate, selectedDate)) {
          selected.push(task);
        }
      }
    });

    const allUpcoming = [...today, ...upcoming];
    allUpcoming.sort((a,b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());
    
    completed.sort((a,b) => {
        const dateA = a.createdAt ? (a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return { 
        upcomingTasks: allUpcoming, 
        todayTasks: today, 
        selectedDayTasks: selected, 
        completedTasks: completed, 
        taskDates: dates 
    };
  }, [allTasksSnapshot, selectedDate]);
  
  const modifiers = { hasTask: taskDates };
  const modifiersClassNames = { hasTask: 'has-task' };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    if (!tasksCollection) return;
    setIsAdding(true);
    try {
      await addDoc(tasksCollection, {
        ...taskData,
        completed: false,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error adding task: ", error);
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    try {
      await updateDoc(taskRef, { completed: currentStatus });
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
     const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
     try {
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  }
  
  const loading = loadingUser || loadingTasks;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-foreground">التقويم والمهام</h1>
            <p className="mt-1 text-muted-foreground">
                عرض وإدارة المهام المجدولة لمزرعتك.
            </p>
        </div>
        <AddTaskDialog onAddTask={handleAddTask} isAdding={isAdding} />
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
      <div>
        <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
              <TabsTrigger value="calendar" className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />التقويم</TabsTrigger>
              <TabsTrigger value="today">مهام اليوم ({todayTasks.length})</TabsTrigger>
              <TabsTrigger value="all">كل المهام ({upcomingTasks.length})</TabsTrigger>
              <TabsTrigger value="completed">المنجزة ({completedTasks.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-0 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="inline-block"
                                locale={ar}
                                modifiers={modifiers}
                                modifiersClassNames={modifiersClassNames}
                            />
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                            <CardTitle>مهام {selectedDate && isToday(selectedDate) ? 'اليوم' : 'اليوم المحدد'} ({selectedDayTasks.length})</CardTitle>
                            <CardDescription>
                                {selectedDate ? format(selectedDate, 'eeee, d MMMM', {locale: ar}) : 'الرجاء تحديد يوم لعرض مهامه.'}
                            </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TaskList tasks={selectedDayTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="today" className="mt-6">
                <Card>
                <CardHeader>
                    <CardTitle>المهام القادمة لهذا اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskList tasks={todayTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />
                </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-6">
                <Card>
                <CardHeader>
                    <CardTitle>كل المهام القادمة</CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskList tasks={upcomingTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} showDate={true} />
                </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
                <Card>
                <CardHeader>
                    <CardTitle>سجل المهام المنجزة</CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskList tasks={completedTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} showDate={true} />
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
      )}
    </div>
  );
}
