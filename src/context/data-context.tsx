"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { collection, onSnapshot, query, DocumentData, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { type SalesItem } from '@/components/budget-content';
import { type ExpenseItem } from '@/components/expenses-content';
import { type DebtItem } from '@/components/debts-content';
import { type Worker } from '@/components/workers/types';

interface DataContextType {
  allSales: (SalesItem & { id: string })[];
  allExpenses: (ExpenseItem & { id: string })[];
  allDebts: (DebtItem & { id: string })[];
  allWorkers: (Worker & { id: string })[];
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
  allSales: [],
  allExpenses: [],
  allDebts: [],
  allWorkers: [],
  loading: true,
});

const mapTimestampsToDates = (data: any): any => {
  if (data instanceof Timestamp) return data.toDate();
  if (Array.isArray(data)) return data.map(item => mapTimestampsToDates(item));
  if (data && typeof data === 'object' && !React.isValidElement(data) && Object.prototype.toString.call(data) !== '[object Date]') {
    const mapped: { [k: string]: any } = {};
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) mapped[k] = mapTimestampsToDates(data[k]);
    }
    return mapped;
  }
  return data;
};

const useCollectionSubscription = <T extends DocumentData>(
  collectionName: string,
  userId: string | undefined
): [Array<T & { id: string }>, boolean] => {
  const [data, setData] = useState<Array<T & { id: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // إعادة تعيين عند تغيير userId أو collectionName
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true); // مهم: نعيد true عند بدء الاشتراك

    const q = query(collection(db, 'users', userId, collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const docData = doc.data();
        const mapped = mapTimestampsToDates(docData);
        return { id: doc.id, ...mapped } as T & { id: string };
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setData([]);
      setLoading(false);
    });

    return () => {
      try { unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, [userId, collectionName]);

  return [data, loading];
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  const [allSales, salesLoading] = useCollectionSubscription<SalesItem>('sales', user?.uid);
  const [allExpenses, expensesLoading] = useCollectionSubscription<ExpenseItem>('expenses', user?.uid);
  const [allDebts, debtsLoading] = useCollectionSubscription<DebtItem>('debts', user?.uid);
  const [allWorkers, workersLoading] = useCollectionSubscription<Worker>('workers', user?.uid);

  const loading = authLoading || salesLoading || expensesLoading || debtsLoading || workersLoading;

  const value = useMemo(() => ({
    allSales,
    allExpenses,
    allDebts,
    allWorkers,
    loading
  }), [allSales, allExpenses, allDebts, allWorkers, loading]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
