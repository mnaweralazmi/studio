
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, query, DocumentData, Timestamp, Query } from 'firebase/firestore';
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

const useCollectionSubscription = <T extends DocumentData>(
  collectionName: string,
  enabled: boolean,
  userId: string | undefined
): [T[], boolean] => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const mapTimestampsToDates = useCallback((docData: DocumentData) => {
    const mapped: any = { ...docData };
    for (const key in mapped) {
      if (mapped[key] instanceof Timestamp) {
        mapped[key] = mapped[key].toDate();
      } else if (Array.isArray(mapped[key])) {
        // Recursively check arrays for objects with Timestamps
        mapped[key] = mapped[key].map((item: any) => {
          if (item && typeof item === 'object' && !(item instanceof Date)) {
            return mapTimestampsToDates(item);
          }
          return item;
        });
      }
    }
    return mapped;
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      setData([]);
      return () => {};
    }

    setLoading(true);
    const dataQuery: Query<DocumentData> = query(collection(db, 'users', userId, collectionName));
    
    const unsubscribe = onSnapshot(dataQuery, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...mapTimestampsToDates(docData),
        } as T;
      });
      setData(fetchedItems);
      setLoading(false);
    }, error => {
      console.error(`Error fetching collection ${collectionName}:`, error);
      setLoading(false);
      setData([]);
    });

    return () => unsubscribe();
  }, [collectionName, enabled, userId, mapTimestampsToDates]);

  return [data, loading];
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const isEnabled = !authLoading && !!user;

    const [allSales, salesLoading] = useCollectionSubscription<SalesItem>('sales', isEnabled, user?.uid);
    const [allExpenses, expensesLoading] = useCollectionSubscription<ExpenseItem>('expenses', isEnabled, user?.uid);
    const [allDebts, debtsLoading] = useCollectionSubscription<DebtItem>('debts', isEnabled, user?.uid);
    const [allWorkers, workersLoading] = useCollectionSubscription<Worker>('workers', isEnabled, user?.uid);

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
