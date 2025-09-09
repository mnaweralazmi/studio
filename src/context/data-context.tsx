
"use client";
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, where, DocumentData, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesItem, ExpenseItem, DebtItem, Worker, AgriculturalSection, ArchivedSale, ArchivedExpense, ArchivedDebt, ArchivedTask, Task } from '@/lib/types';

interface DataContextType {
  allSales: SalesItem[];
  allExpenses: ExpenseItem[];
  allDebts: DebtItem[];
  allWorkers: Worker[];
  tasks: Task[];
  topics: AgriculturalSection[];
  archivedSales: ArchivedSale[];
  archivedExpenses: ArchivedExpense[];
  archivedDebts: ArchivedDebt[];
  completedTasks: ArchivedTask[];
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
  allSales: [],
  allExpenses: [],
  allDebts: [],
  allWorkers: [],
  tasks: [],
  topics: [],
  archivedSales: [],
  archivedExpenses: [],
  archivedDebts: [],
  completedTasks: [],
  loading: true,
});

const mapTimestampsToDates = (data: any): any => {
    if (!data) return data;
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(item => mapTimestampsToDates(item));
    }
    if (typeof data === 'object' && !(data instanceof Date)) {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = mapTimestampsToDates(data[key]);
            }
        }
        return newObj;
    }
    return data;
};

// Definitions for all collections
const collectionsConfig = {
  userSpecific: [
    { name: 'sales', stateKey: 'allSales' },
    { name: 'expenses', stateKey: 'allExpenses' },
    { name: 'debts', stateKey: 'allDebts' },
    { name: 'workers', stateKey: 'allWorkers' },
    { name: 'tasks', stateKey: 'tasks' },
    { name: 'archive_sales', stateKey: 'archivedSales' },
    { name: 'archive_expenses', stateKey: 'archivedExpenses' },
    { name: 'archive_debts', stateKey: 'archivedDebts' },
    { name: 'completed_tasks', stateKey: 'completedTasks' },
  ],
  public: [
    { name: 'data', stateKey: 'topics' },
  ]
} as const;


// Helper to generate initial state
const getInitialState = () => {
    const initialState: { [key: string]: any } = {};
    [...collectionsConfig.userSpecific, ...collectionsConfig.public].forEach(({ stateKey }) => {
        initialState[stateKey] = [];
    });
    return initialState;
}

const getInitialLoadingState = () => {
    const loadingState: { [key: string]: boolean } = {};
    [...collectionsConfig.userSpecific, ...collectionsConfig.public].forEach(({ name }) => {
        loadingState[name] = true;
    });
    return loadingState;
}


export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  
  const [data, setData] = useState(getInitialState);
  const [loadingStates, setLoadingStates] = useState(getInitialLoadingState);

  // Effect for public data that doesn't depend on user auth
  useEffect(() => {
    const unsubscribers = collectionsConfig.public.map(({ name, stateKey }) => {
        const q = query(collection(db, name));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) }));
            setData(prevData => ({ ...prevData, [stateKey]: items }));
            setLoadingStates(prev => ({ ...prev, [name]: false }));
        }, (error) => {
            console.error(`Error fetching public collection ${name}:`, error);
            setLoadingStates(prev => ({ ...prev, [name]: false }));
        });
    });
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // Effect for user-specific data, triggers when user's auth state changes
  useEffect(() => {
    // Reset user-specific data and loading states when user logs out
    if (!user) {
      const resetData: { [key: string]: any[] } = {};
      const resetLoading: { [key: string]: boolean } = {};
      collectionsConfig.userSpecific.forEach(({ stateKey, name }) => {
          resetData[stateKey] = [];
          resetLoading[name] = true; // Reset to loading for next user
      });
      setData(prevData => ({ ...prevData, ...resetData }));
      setLoadingStates(prev => ({ ...prev, ...resetLoading }));
      return;
    }

    // Set up listeners for user-specific collections
    const unsubscribers = collectionsConfig.userSpecific.map(({ name, stateKey }) => {
      const q = query(collection(db, name), where("ownerId", "==", user.uid));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) }));
        setData(prevData => ({ ...prevData, [stateKey]: items }));
        setLoadingStates(prev => ({ ...prev, [name]: false }));
      }, (error) => {
        console.error(`Error fetching ${name} for user ${user.uid}:`, error);
        setLoadingStates(prev => ({ ...prev, [name]: false }));
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);
  
  const isDataLoading = Object.values(loadingStates).some(status => status === true);

  const value = { 
    ...data,
    loading: authLoading || isDataLoading,
  };

  return (
    <DataContext.Provider value={value as DataContextType}>
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
