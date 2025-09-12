'use client';

import {
  CalendarIcon,
  Plus,
  Loader2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
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
import { cn } from '@/lib/utils';
import { isSameDay, format } from 'date-fns';
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


function AddTaskDialog({ onAddTask, isAdding }: { onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void; isAdding: boolean; }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reminder, setReminder] = useState('12:00');
  const [open, setOpen] = useState(false);

  const handleAddTask = () => {
    if (!title || !date || isAdding) return;
    onAddTask({ title, date, reminder });
    setTitle('');
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
                    <Label htmlFor="task-date">تاريخ المهمة</Label>
                    <Input type="date" id="task-date" value={date ? format(date, 'yyyy-MM-dd') : ''} onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="task-time">وقت التذكير</Label>
                    <Input type="time" id="task-time" value={reminder} onChange={(e) => setReminder(e.target.value)} />
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">إلغاء</Button>
                </DialogClose>
                <Button onClick={handleAddTask} disabled={isAdding}>
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

  const allTasks: Task[] = allTasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) || [];

  const { todayTasks, selectedDayTasks, completedTasks, taskDates } = useMemo(() => {
    const today = new Date();
    const todayTasks: Task[] = [];
    const selectedDayTasks: Task[] = [];
    const completedTasks: Task[] = [];
     const taskDates: Date[] = [];

    allTasks.forEach(task => {
      const taskDate = task.date ? (task.date instanceof Timestamp ? task.date.toDate() : new Date(task.date)) : null;

      if (taskDate) {
        taskDates.push(taskDate);
        if (task.completed) {
          completedTasks.push(task);
        } else {
           if (isSameDay(taskDate, today)) {
             todayTasks.push(task);
           }
           if (selectedDate && isSameDay(taskDate, selectedDate)) {
             selectedDayTasks.push(task);
           }
        }
      } else if (task.completed) {
         completedTasks.push(task);
      }
    });

    return { todayTasks, selectedDayTasks, completedTasks: completedTasks.reverse(), taskDates };
  }, [allTasks, selectedDate]);
  
  const modifiers = { hasTask: taskDates };
  const modifiersClassNames = { hasTask: 'has-task' };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    if (!tasksCollection) return;
    setIsAdding(true);
    try {
      await addDoc(tasksCollection, {
        ...taskData,
        completed: false,
        createdAt: new Date(),
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
                عرض وإدارة المهام المجدولة لهذا اليوم.
            </p>
        </div>
        <AddTaskDialog onAddTask={handleAddTask} isAdding={isAdding} />
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
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

             {/* Completed Tasks */}
            <Card>
                <CardHeader>
                <CardTitle>سجل المهام المنجزة ({completedTasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskList tasks={completedTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} showDate={true} />
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
             {/* Upcoming Tasks for Today */}
            <Card>
                <CardHeader>
                <CardTitle>المهام القادمة لهذا اليوم ({todayTasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskList tasks={todayTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />
                </CardContent>
            </Card>
            
            {/* Tasks for Selected Day */}
            <Card>
                <CardHeader>
                <CardTitle>مهام لليوم المحدد ({selectedDayTasks.length})</CardTitle>
                 <CardDescription>
                    {selectedDate ? format(selectedDate, 'eeee, d MMMM', {locale: ar}) : ''}
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <TaskList tasks={selectedDayTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />
                </CardContent>
            </Card>
        </div>

      </div>
      )}
    </div>
  );
}
