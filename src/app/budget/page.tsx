import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function BudgetPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
          <Card className="w-full">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <ClipboardList />
                      الميزانية
                  </CardTitle>
                  <CardDescription>
                      هنا يمكنك تتبع ميزانية الكراتين والأسعار.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <p>سيتم بناء محتوى صفحة الميزانية هنا.</p>
              </CardContent>
          </Card>
      </div>
    </main>
  );
}
