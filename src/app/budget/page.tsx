
"use client"

import * as React from 'react';
import { BudgetSummary } from '@/components/budget/budget-summary';

export default function BudgetPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        <BudgetSummary />
      </div>
    </main>
  );
}
