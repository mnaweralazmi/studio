
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clipboard, Copy, Bot, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlantLoader } from '@/components/plant-loader';
import { getPlantingPlan } from '@/app/actions';
import { useLanguage } from '@/context/language-context';

const getFormSchema = (t: (key: any) => string) => z.object({
  landArea: z.coerce.number().min(1, { message: t('landAreaMin') }),
  budget: z.coerce.number().min(1, { message: t('budgetMin') }),
  plantTypes: z.string().min(5, { message: t('plantTypesMin') }),
});

type PlantingPlan = {
  plantingSchedule: string;
  costEstimation: string;
  cropForecast: string;
};

export function PlantingPlanGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PlantingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const formSchema = getFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      landArea: 100,
      budget: 500,
      plantTypes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setPlan(null);
    setError(null);

    const result = await getPlantingPlan(values);

    if (result.success && result.data) {
      setPlan(result.data);
    } else {
      const errorMessage = result.error || t('unknownError');
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('planCreationError'),
        description: errorMessage,
      });
    }

    setIsLoading(false);
  }

  const handleCopy = () => {
    if (plan) {
      const fullPlanText = `
        ${t('plantingSchedule')}:\n${plan.plantingSchedule}\n\n
        ${t('costEstimation')}:\n${plan.costEstimation}\n\n
        ${t('cropForecast')}:\n${plan.cropForecast}
      `;
      navigator.clipboard.writeText(fullPlanText.trim());
      toast({
        title: t('copiedToClipboard'),
        description: t('planCopySuccess'),
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          {t('customPlantingPlanGenerator')}
        </CardTitle>
        <CardDescription className="font-body">
          {t('customPlantingPlanDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormField
                    control={form.control}
                    name="landArea"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('landAreaSqM')}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 100" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('budgetInKwd')}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 500" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="plantTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('desiredPlants')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('desiredPlantsPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading} size="lg" className="w-full">
              <Bot className="mr-2 h-5 w-5" />
              {isLoading ? t('generatingPlan') : t('generatePlan')}
            </Button>
          </form>
        </Form>

        <div className="mt-8 min-h-[15rem] flex items-center justify-center">
            {isLoading && <PlantLoader />}

            {error && !isLoading && (
                 <div className="rounded-lg border border-destructive bg-destructive/10 p-4 w-full text-center">
                    <p className="font-medium text-destructive">{error}</p>
                </div>
            )}

            {plan && !isLoading && (
              <Card className="w-full bg-primary/5">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div>
                        <CardTitle className="font-headline text-xl flex items-center gap-2">
                            <Bot className="h-6 w-6 text-primary" />
                            {t('yourCustomPlan')}
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="-mt-2 -mr-2 text-primary-foreground">
                        <Copy className="h-5 w-5" />
                        <span className="sr-only">{t('copyPlan')}</span>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-bold mb-2">{t('plantingSchedule')}</h3>
                    <p className="whitespace-pre-wrap font-body text-foreground/90">{plan.plantingSchedule}</p>
                  </div>
                   <div>
                    <h3 className="font-bold mb-2">{t('costEstimation')}</h3>
                    <p className="whitespace-pre-wrap font-body text-foreground/90">{plan.costEstimation}</p>
                  </div>
                   <div>
                    <h3 className="font-bold mb-2">{t('cropForecast')}</h3>
                    <p className="whitespace-pre-wrap font-body text-foreground/90">{plan.cropForecast}</p>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
