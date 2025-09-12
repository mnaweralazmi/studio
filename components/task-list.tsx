'use client';

import { Circle, CircleCheck, Bell, CalendarDays, Trash2 } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { useAdmin } from '@/lib/hooks/useAdmin';

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  date?: string | Date | Timestamp;
  reminder?: string;
  createdAt: string | Date | Timestamp;
};

const formatDate = (date: any) => {
  if (!date) return null;
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return format(d, 'd MMMM, yyyy', { locale: ar });
};

const formatTime = (timeStr: string) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a', { locale: ar });
}


export function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  showDate = false
}: {
  tasks: Task[];
  onToggleTask?: (id: string, completed: boolean) => void;
  onDeleteTask?: (id: string) => void;
  showDate?: boolean;
}) {
  const { isAdmin } = useAdmin();

  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        لا توجد مهام لعرضها.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const taskDate = task.date ? (task.date instanceof Timestamp ? task.date.toDate() : new Date(task.date)) : null;
        const formattedDate = taskDate ? formatDate(taskDate) : null;
        const formattedTime = task.reminder ? formatTime(task.reminder) : null;

        return (
          <div
            key={task.id}
            className={`flex items-start p-3 rounded-lg transition-all group ${
              task.completed
                ? 'bg-muted/30'
                : 'bg-card/70 hover:bg-secondary/50'
            }`}
          >
             {/* Right side: Checkbox and Title */}
            <div
              className="flex-1 flex items-start cursor-pointer"
              onClick={() => onToggleTask && onToggleTask(task.id, !task.completed)}
            >
              <div className="pl-3 mt-1">
                {task.completed ? (
                  <CircleCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p
                  className={`font-medium ${
                    task.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-card-foreground'
                  }`}
                >
                  {task.title}
                </p>
                 <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                   {showDate && formattedDate && (
                     <div className="flex items-center gap-1">
                       <CalendarDays className="h-3 w-3" />
                       <span>{formattedDate}</span>
                     </div>
                    )}
                  {task.reminder && (
                    <div className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      <span>{formattedTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Left side: Delete button for admin */}
             {isAdmin && onDeleteTask && (
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
