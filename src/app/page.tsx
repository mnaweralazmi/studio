import { Leaf } from 'lucide-react';
import { WateringScheduleGenerator } from '@/components/watering-schedule-generator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary-foreground">Plantastic</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            Keep Your Plants Thriving
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            Never guess about watering again. Get a personalized, AI-generated watering schedule for any plant, in any season.
          </p>
        </header>

        <WateringScheduleGenerator />

        <footer className="text-center mt-12 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} Plantastic. Built with love for all things green.</p>
        </footer>
      </div>
    </main>
  );
}
