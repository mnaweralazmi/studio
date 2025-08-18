
"use client"

import * as React from 'react';
import { BudgetContent } from '@/components/budget-content';

export default function SalesPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <BudgetContent />
      </div>
    </main>
  );
}
