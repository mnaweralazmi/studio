'use client';

import { Circle, CircleCheck, Bell, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';


export type Task = {
  id: string;
  title: string;
  completed: boolean;
  date?: string | Date | Timestamp;
  reminder?: string;
  createdAt: string | Date | Timestamp;
};

// Helper to convert Firestore Timestamp or Date string to a readable format
const formatDate = (date: any) => {
  if (!date) return null;
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'd MMMM', { locale: ar });
  }
  // Handle ISO strings or Date objects
  return format(new Date(date), 'd MMMM', { locale: ar });
};


export function TaskList({ tasks, onToggleTask }: { tasks: Task[], onToggleTask?: (id: string) => void }) {
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-center pt-4">
        لا توجد مهام لعرضها.
      </p>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {tasks.map((task) => {
        const formattedDate = formatDate(task.date);
        return (
          <div
            key={task.id}
            onClick={() => onToggleTask && !task.completed && onToggleTask(task.id)}
            className={`flex items-start p-3 rounded-lg transition-all ${
              task.completed
                ? 'bg-muted/50 hover:bg-muted'
                : 'bg-card hover:bg-secondary/50 cursor-pointer'
            }`}
          >
            <div className="p-1 border rounded-full ml-3 mt-1">
              {task.completed ? (
                <CircleCheck className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium text-sm ${
                  task.completed
                    ? 'text-muted-foreground line-through'
                    : 'text-card-foreground'
                }`}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-4 mt-1">
                 {formattedDate && (
                   <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <CalendarDays className="h-3 w-3" />
                     <span>
                        {formattedDate}
                     </span>
                   </div>
                  )}
                {task.reminder && !task.completed && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bell className="h-3 w-3" />
                    <span>{task.reminder}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
