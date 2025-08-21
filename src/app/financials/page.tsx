
"use client";

import * as React from 'react';
import { useLanguage } from '@/context/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetContent } from '@/components/budget-content';
import { ExpensesContent } from '@/components/expenses-content';
import { DebtsContent } from '@/components/debts-content';
import { WorkersContent } from '@/components/workers-content';
import { Wallet, CreditCard, Landmark, Users } from 'lucide-react';

export default function FinancialsPage() {
    const { t } = useLanguage();
    const [activeDepartment, setActiveDepartment] = React.useState('agriculture');

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <Tabs defaultValue="sales" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="sales"><Wallet className="mr-2 h-4 w-4" />{t('sales')}</TabsTrigger>
                        <TabsTrigger value="expenses"><CreditCard className="mr-2 h-4 w-4" />{t('expenses')}</TabsTrigger>
                        <TabsTrigger value="debts"><Landmark className="mr-2 h-4 w-4" />{t('debts')}</TabsTrigger>
                        <TabsTrigger value="workers"><Users className="mr-2 h-4 w-4" />{t('workers')}</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6 space-y-6">
                        <TabsContent value="sales">
                            <BudgetContent departmentId={activeDepartment} />
                        </TabsContent>
                        <TabsContent value="expenses">
                            <ExpensesContent departmentId={activeDepartment} />
                        </TabsContent>
                        <TabsContent value="debts">
                            <DebtsContent departmentId={activeDepartment} />
                        </TabsContent>
                        <TabsContent value="workers">
                            <WorkersContent departmentId={activeDepartment} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </main>
    );
}
