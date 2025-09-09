
"use client";

import * as React from 'react';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TroubleshootPage() {
    const { 
        allWorkers, 
        allSales, 
        allExpenses, 
        allDebts, 
        tasks,
        loading 
    } = useData();
    const { user, loading: authLoading } = useAuth();

    if (loading || authLoading) {
        return <div>Loading data...</div>;
    }

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Troubleshooting Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold">Auth User</h2>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm overflow-auto">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Workers Data (`allWorkers`)</h2>
                            <p className="text-sm text-muted-foreground">Count: {allWorkers.length}</p>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm overflow-auto">
                                {JSON.stringify(allWorkers, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Sales Data (`allSales`)</h2>
                             <p className="text-sm text-muted-foreground">Count: {allSales.length}</p>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm overflow-auto">
                                {JSON.stringify(allSales, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Expenses Data (`allExpenses`)</h2>
                             <p className="text-sm text-muted-foreground">Count: {allExpenses.length}</p>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm overflow-auto">
                                {JSON.stringify(allExpenses, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Debts Data (`allDebts`)</h2>
                             <p className="text-sm text-muted-foreground">Count: {allDebts.length}</p>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm overflow-auto">
                                {JSON.stringify(allDebts, null, 2)}
                            </pre>
                        </div>
                         <div>
                            <h2 className="text-xl font-semibold">Tasks Data (`tasks`)</h2>
                             <p className="text-sm text-muted-foreground">Count: {tasks.length}</p>
                            <pre className="mt-2 rounded-md bg-muted p-4 text-sm overflow-auto">
                                {JSON.stringify(tasks, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
