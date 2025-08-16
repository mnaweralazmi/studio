'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Droplets, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlantLoader } from '@/components/plant-loader';
import { getWateringSchedule } from '@/app/actions';

const formSchema = z.object({
  plantType: z.string().min(2, { message: 'Plant type must be at least 2 characters.' }),
  season: z.enum(['Spring', 'Summer', 'Autumn', 'Winter']),
  location: z.enum(['Indoor', 'Outdoor', 'Greenhouse']),
});

type WateringSchedule = {
  wateringSchedule: string;
};

export function WateringScheduleGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<WateringSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plantType: '',
      season: 'Summer',
      location: 'Indoor',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSchedule(null);
    setError(null);

    const result = await getWateringSchedule(values);

    if (result.success && result.data) {
      setSchedule(result.data);
    } else {
      const errorMessage = result.error || 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error Generating Schedule',
        description: errorMessage,
      });
    }

    setIsLoading(false);
  }

  const handleCopy = () => {
    if (schedule?.wateringSchedule) {
      navigator.clipboard.writeText(schedule.wateringSchedule);
      toast({
        title: 'Copied to clipboard!',
        description: 'You can now paste the schedule anywhere.',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Leaf className="text-primary" />
          Watering Schedule Generator
        </CardTitle>
        <CardDescription className="font-body">
          Fill in your plant's details to get a custom, AI-powered watering schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="plantType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plant Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fiddle Leaf Fig, Succulent..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a season" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Spring">Spring</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                        <SelectItem value="Autumn">Autumn</SelectItem>
                        <SelectItem value="Winter">Winter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Indoor">Indoor</SelectItem>
                        <SelectItem value="Outdoor">Outdoor</SelectItem>
                        <SelectItem value="Greenhouse">Greenhouse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Droplets className="mr-2 h-4 w-4" />
              {isLoading ? 'Nurturing...' : 'Generate Schedule'}
            </Button>
          </form>
        </Form>

        <div className="mt-8 min-h-[10rem] flex items-center justify-center">
            {isLoading && <PlantLoader />}

            {error && !isLoading && (
                 <div className="rounded-lg border border-destructive bg-destructive/10 p-4 w-full">
                    <p className="text-center font-medium text-destructive">{error}</p>
                </div>
            )}

            {schedule && !isLoading && (
              <Card className="w-full bg-primary/10 border-primary/50">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div>
                        <CardTitle className="font-headline text-xl">Your Custom Schedule</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className=" -mt-2 -mr-2 text-primary-foreground">
                        <Copy className="h-5 w-5" />
                        <span className="sr-only">Copy schedule</span>
                    </Button>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap font-body text-foreground/90">{schedule.wateringSchedule}</p>
                </CardContent>
              </Card>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
