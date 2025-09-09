
"use client";

import * as React from 'react';
import { useLanguage } from '@/context/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive as ArchiveIcon, CheckCircle, Wallet, CreditCard, Landmark } from 'lucide-react';

import { ArchivedTasks } from '@/components/archive/archived-tasks';
import { ArchivedSales } from '@/components/archive/archived-sales';
import { ArchivedExpenses } from '@/components/archive/archived-expenses';
import { ArchivedDebts } from '@/components/archive/archived-debts';

export default function ArchivePage() {
    const { t } = useLanguage();

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <div className="w-full">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ArchiveIcon className="h-8 w-8"/>
                        {t('archivePageTitle')}
                    </h1>
                    <p className="text-muted-foreground">{t('archivePageDesc')}</p>
                </div>
                
                <Tabs defaultValue="completed-tasks" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                        <TabsTrigger value="completed-tasks"><CheckCircle className="mr-2 h-4 w-4" />{t('completedTasksLog')}</TabsTrigger>
                        <TabsTrigger value="sales"><Wallet className="mr-2 h-4 w-4" />{t('archivedSales')}</TabsTrigger>
                        <TabsTrigger value="expenses"><CreditCard className="mr-2 h-4 w-4" />{t('archivedExpenses')}</TabsTrigger>
                        <TabsTrigger value="debts"><Landmark className="mr-2 h-4 w-4" />{t('archivedDebts')}</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6">
                        <TabsContent value="completed-tasks">
                           <ArchivedTasks />
                        </TabsContent>
                        <TabsContent value="sales">
                            <ArchivedSales />
                        </TabsContent>
                        <TabsContent value="expenses">
                           <ArchivedExpenses />
                        </TabsContent>
                        <TabsContent value="debts">
                           <ArchivedDebts />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </main>
    );
}
