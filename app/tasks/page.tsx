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
import { TaskList } from '@/components/task-list';
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

// --- Data ---
const upcomingTasks = [
  { time: '١١:٠٠ ص', title: 'تسميد أشجار الليمون', completed: false },
  { time: '٠٢:٠٠ م', title: 'فحص الفخاخ الحشرية', completed: false },
];

const pastTasks = [
  { time: '٠٨:٠٠ ص', title: 'ري قسم البطاطس', completed: true },
];

// --- Sub-page Components ---

function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
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
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AddTaskView() {
  const [date, setDate] = useState<Date | undefined>();
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
            <Input id="task-title" placeholder="مثال: ري قسم البطاطس" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-reminder">تذكير قبل</Label>
            <Select>
              <SelectTrigger id="task-reminder">
                <SelectValue placeholder="اختر مدة التذكير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-day">يوم واحد</SelectItem>
                <SelectItem value="2-days">يومان</SelectItem>
                <SelectItem value="3-days">ثلاثة أيام</SelectItem>
              </SelectContent>
            </Select>
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
          <Button className="w-full">
            <Plus className="h-4 w-4 ml-2" />
            إضافة المهمة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UpcomingTasksView() {
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
          <TaskList tasks={upcomingTasks} />
        </CardContent>
      </Card>
    </div>
  );
}

function PastTasksView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground sr-only">المهام السابقة</h1>
      <Card>
        <CardHeader>
          <CardTitle>سابقة</CardTitle>
          <CardDescription>مهامك التي تم إنجازها.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList tasks={pastTasks} />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page Component ---

type TaskViewId = 'calendar' | 'add' | 'upcoming' | 'past';

export default function TasksPage() {
  const [activeView, setActiveView] = useState<TaskViewId>('calendar');

  const views: { id: TaskViewId; component: ReactNode }[] = [
    { id: 'calendar', component: <CalendarView /> },
    { id: 'add', component: <AddTaskView /> },
    { id: 'upcoming', component: <UpcomingTasksView /> },
    { id: 'past', component: <PastTasksView /> },
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
    { id: 'back', label: 'رجوع', icon: ArrowLeft, href: '/' },
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
