'use client';

import {
  CalendarIcon,
  Plus,
  ArrowLeft,
  ListTodo,
  History,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
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

// --- Initial Data ---
const initialUpcomingTasks: Task[] = [
  { id: 'task-1', title: 'تسميد أشجار الليمون', completed: false, reminder: 'قبل يوم', date: '2024/07/28' },
  { id: 'task-2', title: 'فحص الفخاخ الحشرية', completed: false, date: '2024/07/29' },
];

const initialPastTasks: Task[] = [
  { id: 'task-3', title: 'ري قسم البطاطس', completed: true, date: '2024/07/20' },
];

// --- Sub-page Components ---

function CalendarView({ tasks }: { tasks: Task[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const taskDates = tasks
    .map(task => task.date ? new Date(task.date.replace(/\//g, '-')) : null)
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
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AddTaskView({ onAddTask }: { onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [reminder, setReminder] = useState('');

  const handleAddTask = () => {
    if (!title || !date) return; // Basic validation
    onAddTask({ title, date: format(date, 'yyyy/MM/dd'), reminder });
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
          <Button className="w-full" onClick={handleAddTask}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة المهمة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UpcomingTasksView({ tasks, onToggleTask }: { tasks: Task[], onToggleTask: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground sr-only">المهام القادمة</h1>
      <Card>
        <CardHeader>
          <CardTitle>قادمة</CardTitle>
          <CardDescription>
            مهامك التي لم يتم إنجازها بعد.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks} onToggleTask={onToggleTask} />
        </CardContent>
      </Card>
    </div>
  );
}

function PastTasksView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground sr-only">المهام السابقة</h1>
      <Card>
        <CardHeader>
          <CardTitle>سابقة</CardTitle>
          <CardDescription>مهامك التي تم إنجازها.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page Component ---

type TaskViewId = 'calendar' | 'add' | 'upcoming' | 'past';

export default function TasksPage() {
  const [activeView, setActiveView] = useState<TaskViewId>('upcoming');
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>(initialUpcomingTasks);
  const [pastTasks, setPastTasks] = useState<Task[]>(initialPastTasks);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      completed: false,
    };
    setUpcomingTasks([newTask, ...upcomingTasks].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()));
    setActiveView('upcoming'); // Switch to upcoming tasks view after adding
  };
  
  const handleToggleTask = (taskId: string) => {
    const taskToMove = upcomingTasks.find((task) => task.id === taskId);
    if (taskToMove) {
      setUpcomingTasks(upcomingTasks.filter((task) => task.id !== taskId));
      setPastTasks([{ ...taskToMove, completed: true }, ...pastTasks]);
    }
  };

  const views: { id: TaskViewId; component: ReactNode }[] = [
    { id: 'calendar', component: <CalendarView tasks={[...upcomingTasks, ...pastTasks]} /> },
    { id: 'add', component: <AddTaskView onAddTask={handleAddTask} /> },
    { id: 'upcoming', component: <UpcomingTasksView tasks={upcomingTasks} onToggleTask={handleToggleTask} /> },
    { id: 'past', component: <PastTasksView tasks={pastTasks} /> },
  ];

  const navItems: {
    id: TaskViewId | 'back';
    label: string;
    icon: React.ElementType;
    href?: string;
  }[] = [
    { id: 'calendar', label: 'التقويم', icon: CalendarIcon },
    { id: 'add', label: 'إضافة', icon: Plus },
    { id: 'upcoming', label: 'قادمة', icon: ListTodo },
    { id: 'past', label: 'سابقة', icon: History },
    { id: 'back', label: 'رجوع', icon: ArrowLeft, href: '/tasks' },
  ];

  const activeComponent = views.find((v) => v.id === activeView)?.component;

  const NavLink = ({
    item,
  }: {
    item: (typeof navItems)[0];
  }) => {
    const isActive = activeView === item.id;
    const content = (
       <div
        className={cn(
          'flex flex-col items-center justify-center text-muted-foreground hover:text-primary w-full h-full group transition-all duration-300 hover:-translate-y-2',
          isActive && 'text-primary'
        )}
        onClick={() => item.id !== 'back' && setActiveView(item.id as TaskViewId)}
      >
        <item.icon className="h-7 w-7" />
        <span className="text-xs mt-1 font-medium">{item.label}</span>
      </div>
    );
    
    if (item.href) {
        return <Link href={item.href} className="w-full h-full">{content}</Link>
    }
    
    return <div className="w-full h-full cursor-pointer">{content}</div>;
  };

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-foreground sr-only">التقويم والمهام</h1>
        <p className="mt-1 text-muted-foreground sr-only">
          جدول مهامك اليومية والأسبوعية.
        </p>
      </header>

      <div className="mt-6">{activeComponent}</div>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong z-50">
        <nav className="flex justify-around items-center h-20">
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>
      </footer>
    </div>
  );
}
