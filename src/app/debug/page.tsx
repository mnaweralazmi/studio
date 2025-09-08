
"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import useCollectionSubscription from "@/hooks/use-collection-subscription";
import { type SalesItem } from "@/components/budget-content";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DebugPage() {
  const { user, loading: authLoading } = useAuth();
  const [sales, salesLoading] = useCollectionSubscription<SalesItem>('sales', user?.uid);
  const [expenses, expensesLoading] = useCollectionSubscription<SalesItem>('expenses', user?.uid);
  const [debts, debtsLoading] = useCollectionSubscription<SalesItem>('debts', user?.uid);
  const [workers, workersLoading] = useCollectionSubscription<SalesItem>('workers', user?.uid);

  const isLoading = authLoading || salesLoading || expensesLoading || debtsLoading || workersLoading;

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-bold">Data Fetching Debug Page</h1>
          <p className="text-muted-foreground">
            This page tests the data fetching from Firestore collections.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            {authLoading ? (
              <Skeleton className="h-6 w-1/2" />
            ) : (
              <div>
                <p><strong>Status:</strong> {user ? "Logged In" : "Not Logged In"}</p>
                <p><strong>User ID (UID):</strong> {user?.uid ?? "N/A"}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Collections Data</CardTitle>
            <CardDescription>
              Checks the number of documents fetched from each top-level collection for the logged-in user.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <h3 className="font-semibold">Sales</h3>
                {salesLoading ? <Skeleton className="h-5 w-24" /> : <p>Documents found: <strong>{sales.length}</strong></p>}
             </div>
             <hr />
              <div>
                <h3 className="font-semibold">Expenses</h3>
                {expensesLoading ? <Skeleton className="h-5 w-24" /> : <p>Documents found: <strong>{expenses.length}</strong></p>}
             </div>
             <hr />
              <div>
                <h3 className="font-semibold">Debts</h3>
                {debtsLoading ? <Skeleton className="h-5 w-24" /> : <p>Documents found: <strong>{debts.length}</strong></p>}
             </div>
             <hr />
             <div>
                <h3 className="font-semibold">Workers</h3>
                {workersLoading ? <Skeleton className="h-5 w-24" /> : <p>Documents found: <strong>{workers.length}</strong></p>}
             </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>If you are logged in but the document counts are all zero, it strongly suggests a Firestore Security Rules issue. Please check your Firestore rules to ensure that authenticated users are allowed to read from the 'sales', 'expenses', 'debts', and 'workers' collections where the document's 'ownerId' matches their UID.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
