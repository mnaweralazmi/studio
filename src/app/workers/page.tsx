
"use client"

import * as React from 'react';
import { WorkersContent } from '@/components/workers-content';

export default function WorkersPage() {
    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <WorkersContent />
            </div>
        </main>
    );
}
