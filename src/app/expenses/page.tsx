
"use client"

import * as React from 'react';
import { ExpensesContent } from '@/components/expenses-content';

export default function ExpensesPage() {
    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <ExpensesContent />
            </div>
        </main>
    );
}
