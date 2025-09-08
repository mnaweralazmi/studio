
"use client";

import * as React from 'react';
import { useLanguage } from '@/context/language-context';
import { BudgetSummary } from '@/components/budget/budget-summary';
import { BarChart } from 'lucide-react';

export default function SummaryPage() {
    const { t } = useLanguage();

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <div className="w-full">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BarChart className="h-8 w-8" />
                        {t('financialSummary')}
                    </h1>
                    <p className="text-muted-foreground">{t('allDepartmentsSummaryDesc', {
                        departments: t('allDepartments')
                    })}</p>
                </div>
                <BudgetSummary />
            </div>
        </main>
    );
}
