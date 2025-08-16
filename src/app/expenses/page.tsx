import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { CreditCard, Landmark } from 'lucide-react';

function ExpensesContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>صفحة المصروفات</CardTitle>
                <CardDescription>
                    هنا يمكنك تتبع وإدارة جميع مصروفاتك.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>سيتم بناء محتوى صفحة المصروفات هنا.</p>
            </CardContent>
        </Card>
    );
}

function DebtsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>صفحة الديون</CardTitle>
                <CardDescription>
                    هنا يمكنك تتبع وإدارة جميع ديونك.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>سيتم بناء محتوى صفحة الديون هنا.</p>
            </CardContent>
        </Card>
    );
}

export default function ExpensesPage({ searchParams }: { searchParams: { tab: string } }) {
  const activeTab = searchParams.tab === 'debts' ? 'debts' : 'expenses';

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <Tabs defaultValue={activeTab} className="w-full">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
               <TabsTrigger value="expenses" asChild>
                  <NextLink href="/expenses" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    المصروفات
                  </NextLink>
               </TabsTrigger>
               <TabsTrigger value="debts" asChild>
                  <NextLink href="/expenses?tab=debts" className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    الديون
                  </NextLink>
               </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="expenses" className="mt-6">
            <ExpensesContent />
          </TabsContent>
          <TabsContent value="debts" className="mt-6">
            <DebtsContent />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
