
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

// List of collections that depend on the user's ID
const userSpecificCollections = [
  { name: 'sales', setter: 'setAllSales' },
  { name: 'expenses', setter: 'setAllExpenses' },
  { name: 'debts', setter: 'setAllDebts' },
  { name: 'workers', setter: 'setAllWorkers' },
  { name: 'tasks', setter: 'setTasks' },
  { name: 'archive_sales', setter: 'setArchivedSales' },
  { name: 'archive_expenses', setter: 'setArchivedExpenses' },
  { name: 'archive_debts', setter: 'setArchivedDebts' },
  { name: 'completed_tasks', setter: 'setCompletedTasks' },
] as const;


export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [allSales, setAllSales] = useState<SalesItem[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedSales, setArchivedSales] = useState<ArchivedSale[]>([]);
  const [archivedExpenses, setArchivedExpenses] = useState<ArchivedExpense[]>([]);
  const [archivedDebts, setArchivedDebts] = useState<ArchivedDebt[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ArchivedTask[]>([]);
  
  const stateSetters = { setTopics, setAllSales, setAllExpenses, setAllDebts, setAllWorkers, setTasks, setArchivedSales, setArchivedExpenses, setArchivedDebts, setCompletedTasks };

  const [topicsLoading, setTopicsLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(true);

  // Effect for public data (topics) that doesn't depend on user auth
  useEffect(() => {
    setTopicsLoading(true);
    const q = query(collection(db, 'data'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) })) as AgriculturalSection[];
        setTopics(items);
        setTopicsLoading(false);
    }, (error) => {
        console.error("Error fetching public topics:", error);
        setTopics([]);
        setTopicsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Effect for user-specific data, triggers when user's auth state changes
  useEffect(() => {
    if (!user) {
      // If user logs out, clear their data and set loading to false
      userSpecificCollections.forEach(({ setter }) => stateSetters[setter]([]));
      setUserDataLoading(false);
      return;
    }

    setUserDataLoading(true);
    const unsubscribers = userSpecificCollections.map(({ name, setter }) => {
      const q = query(collection(db, name), where("ownerId", "==", user.uid));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) })) as any[];
        stateSetters[setter](items);
      }, (error) => {
        console.error(`Error fetching ${name} for user ${user.uid}:`, error);
        stateSetters[setter]([]); // Clear data on error
      });
    });

    // We can consider userDataLoading to be false once listeners are attached.
    // The UI will update reactively as data arrives.
    setUserDataLoading(false);

    // Cleanup function to unsubscribe from all listeners when user changes or component unmounts
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  const value = { 
    allSales, allExpenses, allDebts, allWorkers, tasks, topics, 
    archivedSales, archivedExpenses, archivedDebts, completedTasks,
    loading: authLoading || topicsLoading || userDataLoading,
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
