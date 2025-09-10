'use client';

import { Plus, Circle, CircleCheck } from "lucide-react";
import { useEffect, useState } from 'react';


export default function TasksPage() {
  const [dateInfo, setDateInfo] = useState({ day: '', month: ''});

  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('ar-SA', { month: 'long' });
    setDateInfo({ day: String(day), month });
  }, []);


  const tasks = [
    { time: "٠٨:٠٠ ص", title: "ري قسم البطاطس", completed: true },
    { time: "١١:٠٠ ص", title: "تسميد أشجار الليمون", completed: false },
    { time: "٠٢:٠٠ م", title: "فحص الفخاخ الحشرية", completed: false },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التقويم والمهام</h1>
          <p className="mt-1 text-muted-foreground">جدول مهامك اليومية والأسبوعية.</p>
        </div>
        <button className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95">
          <Plus className="h-6 w-6" />
        </button>
      </header>

      <div className="bg-card p-4 rounded-xl shadow-md flex items-center space-x-4 rtl:space-x-reverse">
        <div className="flex flex-col items-center justify-center bg-primary/20 text-primary p-4 rounded-lg">
          <span className="text-3xl font-bold">{dateInfo.day || '...'}</span>
          <span className="font-medium">{dateInfo.month || '...'}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-card-foreground">مهام اليوم</h2>
          <p className="text-muted-foreground">{tasks.filter(t => !t.completed).length} مهام متبقية</p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={index}
            className={`flex items-center p-4 rounded-lg transition-all cursor-pointer ${
              task.completed
                ? "bg-muted hover:bg-muted/80"
                : "bg-card shadow-sm hover:bg-secondary"
            }`}
          >
            {task.completed ? (
              <CircleCheck className="h-6 w-6 text-green-500 ml-4" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground ml-4" />
            )}
            <div className="flex flex-col">
              <p
                className={`font-medium ${
                  task.completed
                    ? "text-muted-foreground line-through"
                    : "text-card-foreground"
                }`}
              >
                {task.title}
              </p>
              <span
                className={`text-sm ${
                  task.completed ? "text-muted-foreground" : "text-primary"
                }`}
              >
                {task.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
