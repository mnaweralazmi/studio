
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, query, DocumentData, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { type SalesItem } from '@/components/budget-content';
import { type ExpenseItem } from '@/components/expenses-content';
import { type DebtItem } from '@/components/debts-content';
import { type Worker } from '@/components/workers/types';

interface DataContextType {
    allSales: SalesItem[];
    allExpenses: ExpenseItem[];
    allDebts: DebtItem[];
    allWorkers: Worker[];
    loading: boolean;
}

const DataContext = createContext<DataContextType>({
    allSales: [],
    allExpenses: [],
    allDebts: [],
    allWorkers: [],
    loading: true,
});

const useCollectionForUser = <T extends DocumentData>(
  collectionName: string,
  enabled: boolean
): [T[], boolean] => {
  const { user } = useAuth();
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!enabled || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const dataQuery = query(collection(db, 'users', user.uid, collectionName));
    
    const unsubscribe = onSnapshot(dataQuery, (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => {
             const docData = doc.data();
             const mappedData: any = { id: doc.id, ...docData };
             // Convert Timestamps to Dates for relevant fields
             if (docData.date) mappedData.date = (docData.date as Timestamp).toDate();
             if (docData.dueDate) mappedData.dueDate = (docData.dueDate as Timestamp).toDate();
             if (docData.payments) mappedData.payments = (docData.payments || []).map((p: any) => ({...p, date: (p.date as Timestamp).toDate()}));
             if (docData.transactions) mappedData.transactions = (docData.transactions || []).map((t: any) => ({...t, date: (t.date as Timestamp).toDate()}));
             return mappedData as T;
        });
        setData(fetchedItems);
        setLoading(false);
    }, error => {
        console.error(`Error fetching collection ${collectionName}:`, error);
        setLoading(false);
    });

    return () => unsubscribe();

  }, [user, collectionName, enabled]);

  return [data, loading];
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const isEnabled = !authLoading && !!user;

    const [allSales, salesLoading] = useCollectionForUser<SalesItem>('sales', isEnabled);
    const [allExpenses, expensesLoading] = useCollectionForUser<ExpenseItem>('expenses', isEnabled);
    const [allDebts, debtsLoading] = useCollectionForUser<DebtItem>('debts', isEnabled);
    const [allWorkers, workersLoading] = useCollectionForUser<Worker>('workers', isEnabled);

    const loading = authLoading || salesLoading || expensesLoading || debtsLoading || workersLoading;

    const value = {
        allSales,
        allExpenses,
        allDebts,
        allWorkers,
        loading
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
