
"use client";

import * as React from 'react';
import { useLanguage } from '@/context/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetContent } from '@/components/budget-content';
import { ExpensesContent } from '@/components/expenses-content';
import { DebtsContent } from '@/components/debts-content';
import { WorkersContent } from '@/components/workers-content';
import { Wallet, CreditCard, Landmark, Users, Leaf, PawPrint, Bird, Fish, Building } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export type Department = 'agriculture' | 'livestock' | 'poultry' | 'fish';

export default function FinancialsPage() {
    const { t } = useLanguage();
    const [activeDepartment, setActiveDepartment] = React.useState<Department>('agriculture');

    const departmentIcons: Record<Department, React.ElementType> = {
        agriculture: Leaf,
        livestock: PawPrint,
        poultry: Bird,
        fish: Fish,
    };
    
    const departmentTitles: Record<Department, string> = {
        agriculture: t('topicSoil'),
        livestock: t('livestockSales'),
        poultry: t('poultrySales'),
        fish: t('fishSales'),
    };


    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <div className="w-full">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Building className="h-8 w-8"/>
                        {t('departmentalManagement')}
                    </h1>
                    <p className="text-muted-foreground">{t('selectDepartmentToManage')}</p>
                </div>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('selectDepartment')}</CardTitle>
                        <CardDescription>{t('selectDepartmentToManage')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeDepartment} onValueChange={(value) => setActiveDepartment(value as Department)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                                {(Object.keys(departmentIcons) as Department[]).map(dept => {
                                    const Icon = departmentIcons[dept];
                                    return (
                                        <TabsTrigger key={dept} value={dept} className="flex-col h-16 gap-1">
                                            <Icon className="h-5 w-5" />
                                            <span>{departmentTitles[dept]}</span>
                                        </TabsTrigger>
                                    )
                                })}
                            </TabsList>
                        </Tabs>
                    </CardContent>
                </Card>

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
