'use client';

import { Circle, CircleCheck, Bell } from 'lucide-react';

export type Task = {
  id: string;
  time: string;
  title: string;
  completed: boolean;
  date?: string;
  reminder?: string;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-center pt-4">
        لا توجد مهام لعرضها.
      </p>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-center p-3 rounded-lg transition-all cursor-pointer ${
            task.completed
              ? 'bg-muted/50 hover:bg-muted'
              : 'bg-card hover:bg-secondary/50'
          }`}
        >
          <div className="p-1 border rounded-full ml-3">
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
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${
                  task.completed ? 'text-muted-foreground' : 'text-primary'
                }`}
              >
                {task.time}
              </span>
              {task.reminder && !task.completed && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bell className="h-3 w-3" />
                  <span>{task.reminder}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
