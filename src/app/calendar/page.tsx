"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
          <Card className="w-full flex justify-center">
            <div className="flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <CalendarIcon />
                      التقويم والمهام
                  </CardTitle>
                  <CardDescription>
                      هنا يمكنك إدارة مهامك ومواعيدك الزراعية.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </div>
          </Card>
      </div>
    </main>
  );
}
