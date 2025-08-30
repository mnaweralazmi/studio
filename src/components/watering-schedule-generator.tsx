
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Droplets, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlantLoader } from '@/components/plant-loader';
import { getWateringSchedule } from '@/app/actions';

const formSchema = z.object({
  plantType: z.string().min(2, { message: 'يجب أن يكون نوع النبات من حرفين على الأقل.' }),
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
      const errorMessage = 'error' in result ? (result.error ?? 'حدث خطأ غير معروف.') : 'حدث خطأ غير معروف.'
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء الجدول',
        description: errorMessage,
      });
    }

    setIsLoading(false);
  }

  const handleCopy = () => {
    if (schedule?.wateringSchedule) {
      navigator.clipboard.writeText(schedule.wateringSchedule);
      toast({
        title: 'تم النسخ إلى الحافظة!',
        description: 'يمكنك الآن لصق الجدول في أي مكان.',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          مولد جدول الري
        </CardTitle>
        <CardDescription className="font-body">
          املأ تفاصيل نبتتك للحصول على جدول ري مخصص ومدعوم بالذكاء الاصطناعي.
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
                  <FormLabel>نوع النبات</FormLabel>
                  <FormControl>
                    <Input placeholder="على سبيل المثال، صبار، تين ورقي..." {...field} />
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
                    <FormLabel>الموسم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موسماً" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Spring">الربيع</SelectItem>
                        <SelectItem value="Summer">الصيف</SelectItem>
                        <SelectItem value="Autumn">الخريف</SelectItem>
                        <SelectItem value="Winter">الشتاء</SelectItem>
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
                    <FormLabel>الموقع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موقعاً" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Indoor">داخلي</SelectItem>
                        <SelectItem value="Outdoor">خارجي</SelectItem>
                        <SelectItem value="Greenhouse">دفيئة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Droplets className="mr-2 h-4 w-4" />
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء الجدول'}
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
                        <CardTitle className="font-headline text-xl">جدولك المخصص</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className=" -mt-2 -mr-2 text-primary-foreground">
                        <Copy className="h-5 w-5" />
                        <span className="sr-only">نسخ الجدول</span>
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

    