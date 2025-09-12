'use client';

import { Circle, CircleCheck, Bell, CalendarDays, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { useAdmin } from '@/lib/hooks/useAdmin';

export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date?: string | Date | Timestamp;
  reminder?: string;
  createdAt: string | Date | Timestamp;
};

const formatDate = (date: any) => {
  if (!date) return null;
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  // Example: أغسطس 24, 2025
  return format(d, 'd MMMM, yyyy', { locale: ar });
};

const formatTime = (timeStr: string) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    // Example: 12:00 ص
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
             <div className="flex-1 flex items-start gap-4">
                {/* Right side: Checkbox */}
                <div
                    className="pt-1 cursor-pointer"
                    onClick={() => onToggleTask && onToggleTask(task.id, !task.completed)}
                    >
                    {task.completed ? (
                        <CircleCheck className="h-5 w-5 text-green-500" />
                    ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>

                {/* Middle: Title, Description */}
                <div className="flex-1">
                    <div className="flex items-center">
                        <p
                            className={`font-medium ${
                            task.completed
                                ? 'text-muted-foreground line-through'
                                : 'text-card-foreground'
                            }`}
                        >
                            {task.title}
                        </p>
                        {isAdmin && onDeleteTask && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 mr-auto opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                </div>
            </div>

            {/* Left side: Date and Time */}
             <div className="flex flex-col items-end text-xs text-muted-foreground gap-1 pl-1 pt-1">
                {formattedTime && (
                    <div className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      <span>{formattedTime}</span>
                    </div>
                  )}
               {(showDate || task.date) && formattedDate && (
                 <div className="flex items-center gap-1">
                   <CalendarDays className="h-3 w-3" />
                   <span>{formattedDate}</span>
                 </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
