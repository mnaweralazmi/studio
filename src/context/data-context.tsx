
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

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // States for live data
  const [allSales, setAllSales] = useState<SalesItem[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  
  // States for archived data
  const [archivedSales, setArchivedSales] = useState<ArchivedSale[]>([]);
  const [archivedExpenses, setArchivedExpenses] = useState<ArchivedExpense[]>([]);
  const [archivedDebts, setArchivedDebts] = useState<ArchivedDebt[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ArchivedTask[]>([]);

  useEffect(() => {
    const userId = user?.uid;

    if (!userId) {
      setLoading(false);
      // Reset all states to empty when user logs out
      setAllSales([]);
      setAllExpenses([]);
      setAllDebts([]);
      setAllWorkers([]);
      setTasks([]);
      setTopics([]);
      setArchivedSales([]);
      setArchivedExpenses([]);
      setArchivedDebts([]);
      setCompletedTasks([]);
      return;
    }
    
    setLoading(true);

    const collectionsToWatch = [
      // Live data
      { name: 'sales', setter: setAllSales, owner: true },
      { name: 'expenses', setter: setAllExpenses, owner: true },
      { name: 'debts', setter: setAllDebts, owner: true },
      { name: 'workers', setter: setAllWorkers, owner: true },
      { name: 'tasks', setter: setTasks, owner: true },
      // Archived data
      { name: 'archive_sales', setter: setArchivedSales, owner: true },
      { name: 'archive_expenses', setter: setArchivedExpenses, owner: true },
      { name: 'archive_debts', setter: setArchivedDebts, owner: true },
      { name: 'completed_tasks', setter: setCompletedTasks, owner: true },
      // Public data
      { name: 'data', setter: setTopics, owner: false }, // 'data' collection stores public topics
    ];
    
    let activeListeners = collectionsToWatch.length;
    
    const onDataLoaded = () => {
        activeListeners--;
        if (activeListeners === 0) {
            setLoading(false);
        }
    };

    const unsubscribers = collectionsToWatch.map(({ name, setter, owner }) => {
      const collectionRef = collection(db, name);
      // Public data like 'data' does not need to be filtered by ownerId
      const q = owner 
        ? query(collectionRef, where("ownerId", "==", userId))
        : query(collectionRef);

      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) })) as any[];
        setter(items);
        if(activeListeners > 0) onDataLoaded();
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
        setter([]); // Clear data on error
        if(activeListeners > 0) onDataLoaded();
      });
    });

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user?.uid]);

  const value = { 
    allSales, allExpenses, allDebts, allWorkers, tasks, topics, 
    archivedSales, archivedExpenses, archivedDebts, completedTasks,
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
