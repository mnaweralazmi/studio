import { AppLayout } from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  return (
    <AppLayout>
      <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar />
                        التقويم والمهام
                    </CardTitle>
                    <CardDescription>
                        هنا يمكنك إدارة مهامك ومواعيدك الزراعية.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>سيتم بناء محتوى صفحة التقويم والمهام هنا.</p>
                </CardContent>
            </Card>
        </div>
      </main>
    </AppLayout>
  );
}
