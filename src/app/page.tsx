import { AppLayout } from '@/components/app-layout';
import { WateringScheduleGenerator } from '@/components/watering-schedule-generator';
import { Leaf } from 'lucide-react';

export default function Home() {
  return (
    <AppLayout>
      <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-headline text-lg font-semibold text-primary-foreground">بلانتاسي</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
              معلومات وبيانات عن الزراعة
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
              كل ما تحتاجه من معلومات حول الزراعة، الري، الآفات، والتقليم في مكان واحد.
            </p>
          </header>

          <WateringScheduleGenerator />

          <footer className="text-center mt-12 text-sm text-muted-foreground font-body">
              <p>&copy; {new Date().getFullYear()} بلانتاسي. صُنع بحب لكل ما هو أخضر.</p>
          </footer>
        </div>
      </main>
    </AppLayout>
  );
}
