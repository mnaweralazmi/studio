
"use client";

import * as React from 'react';
import { useLanguage } from '@/context/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetContent } from '@/components/budget-content';
import { ExpensesContent } from '@/components/expenses-content';
import { DebtsContent } from '@/components/debts-content';
import { WorkersContent } from '@/components/workers-content';
import { Wallet, CreditCard, Landmark, Users, Car, Fish, Bird, Beef } from 'lucide-react';

type Department = 'agriculture' | 'livestock' | 'poultry' | 'fish';

export default function FinancialsPage() {
    const { t } = useLanguage();
    const [activeDepartment, setActiveDepartment] = React.useState<Department>('agriculture');

    React.useEffect(() => {
        // Persist the last selected department for the budget summary page
        localStorage.setItem('selectedDepartment', activeDepartment);
    }, [activeDepartment]);

    const departments: { id: Department; name: string; icon: React.ElementType }[] = [
        { id: 'agriculture', name: "الزراعة", icon: Car },
        { id: 'livestock', name: "المواشي", icon: Beef },
        { id: 'poultry', name: "الدواجن", icon: Bird },
        { id: 'fish', name: "الأسماك", icon: Fish },
    ];

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <Tabs defaultValue="agriculture" onValueChange={(value) => setActiveDepartment(value as Department)}>
                    <TabsList className="grid w-full grid-cols-4">
                        {departments.map(dept => (
                            <TabsTrigger key={dept.id} value={dept.id}>
                                <dept.icon className="mr-2 h-4 w-4" />
                                {dept.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {departments.map(dept => (
                        <TabsContent key={dept.id} value={dept.id} className="mt-6">
                            <Tabs defaultValue="sales" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="sales"><Wallet className="mr-2 h-4 w-4" />{t('sales')}</TabsTrigger>
                                    <TabsTrigger value="expenses"><CreditCard className="mr-2 h-4 w-4" />{t('expenses')}</TabsTrigger>
                                    <TabsTrigger value="debts"><Landmark className="mr-2 h-4 w-4" />{t('debts')}</TabsTrigger>
                                    <TabsTrigger value="workers"><Users className="mr-2 h-4 w-4" />{t('workers')}</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="sales" className="mt-6">
                                    <BudgetContent departmentId={dept.id} />
                                </TabsContent>
                                <TabsContent value="expenses" className="mt-6">
                                    <ExpensesContent departmentId={dept.id} />
                                </TabsContent>
                                <TabsContent value="debts" className="mt-6">
                                    <DebtsContent departmentId={dept.id} />
                                </TabsContent>
                                <TabsContent value="workers" className="mt-6">
                                    <WorkersContent departmentId={dept.id} />
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </main>
    );
}
