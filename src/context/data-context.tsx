"use client";
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { type SalesItem } from '@/components/budget-content';
import { type ExpenseItem } from '@/components/expenses-content';
import { type DebtItem } from '@/components/debts-content';
import { type Worker } from '@/components/workers/types';
import useCollectionSubscription from '@/hooks/use-collection-subscription';

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
