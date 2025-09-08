
"use client";
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import useCollectionSubscription from '@/hooks/use-collection-subscription';
import type { SalesItem, ExpenseItem, DebtItem, Worker, AgriculturalSection } from '@/lib/types';


interface DataContextType {
  allSales: SalesItem[];
  allExpenses: ExpenseItem[];
  allDebts: DebtItem[];
  allWorkers: Worker[];
  topics: AgriculturalSection[];
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
  allSales: [],
  allExpenses: [],
  allDebts: [],
  allWorkers: [],
  topics: [],
  loading: true,
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  const [allSales, salesLoading] = useCollectionSubscription<SalesItem>('sales', user?.uid);
  const [allExpenses, expensesLoading] = useCollectionSubscription<ExpenseItem>('expenses', user?.uid);
  const [allDebts, debtsLoading] = useCollectionSubscription<DebtItem>('debts', user?.uid);
  const [allWorkers, workersLoading] = useCollectionSubscription<Worker>('workers', user?.uid);
  const [topics, topicsLoading] = useCollectionSubscription<AgriculturalSection>('data'); // Public data, no user?.uid needed

  const loading = authLoading || salesLoading || expensesLoading || debtsLoading || workersLoading || topicsLoading;

  const value = useMemo(() => ({
    allSales,
    allExpenses,
    allDebts,
    allWorkers,
    topics,
    loading
  }), [allSales, allExpenses, allDebts, allWorkers, topics, loading]);

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
