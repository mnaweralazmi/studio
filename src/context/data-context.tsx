
"use client";
import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, where, DocumentData, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesItem, ExpenseItem, DebtItem, Worker, AgriculturalSection } from '@/lib/types';


interface DataContextType {
  allSales: SalesItem[];
  allExpenses: ExpenseItem[];
  allDebts: DebtItem[];
  allWorkers: Worker[];
  topics: AgriculturalSection[];
  loading: boolean;
}

const mapTimestampsToDates = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  if (Array.isArray(data)) {
    return data.map(mapTimestampsToDates);
  }
  if (data && typeof data === "object" && Object.prototype.toString.call(data) !== "[object Date]") {
    const out: { [key: string]: any } = {};
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        out[k] = mapTimestampsToDates(data[k]);
      }
    }
    return out;
  }
  return data;
};


const DataContext = createContext<DataContextType>({
  allSales: [],
  allExpenses: [],
  allDebts: [],
  allWorkers: [],
  topics: [],
  loading: true,
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  const [allSales, setAllSales] = useState<SalesItem[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(true);

  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);

  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  
  const userId = user?.uid;

  useEffect(() => {
    if (!userId) {
      // If user logs out, clear all data and set loading to false.
      setAllSales([]);
      setAllExpenses([]);
      setAllDebts([]);
      setAllWorkers([]);
      setSalesLoading(false);
      setExpensesLoading(false);
      setDebtsLoading(false);
      setWorkersLoading(false);
      return;
    }

    // Reset loading states when user changes
    setSalesLoading(true);
    setExpensesLoading(true);
    setDebtsLoading(true);
    setWorkersLoading(true);

    const collectionsToSubscribe = [
        { name: 'sales', setter: setAllSales, setLoading: setSalesLoading },
        { name: 'expenses', setter: setAllExpenses, setLoading: setExpensesLoading },
        { name: 'debts', setter: setAllDebts, setLoading: setDebtsLoading },
        { name: 'workers', setter: setAllWorkers, setLoading: setWorkersLoading },
    ];

    const unsubscribers = collectionsToSubscribe.map(({ name, setter, setLoading }) => {
      const q = query(collection(db, name), where("ownerId", "==", userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) } as any));
        setter(items);
        setLoading(false);
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
        setter([]);
        setLoading(false);
      });
      return unsubscribe;
    });

    // Cleanup function to unsubscribe from all listeners on component unmount or when userId changes
    return () => unsubscribers.forEach(unsub => unsub());

  }, [userId]); // This effect re-runs whenever the userId changes (login/logout)

  useEffect(() => {
    setTopicsLoading(true);
    const q = query(collection(db, "data"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) } as any));
        setTopics(items);
        setTopicsLoading(false);
    }, (error) => {
        console.error(`Error fetching topics:`, error);
        setTopics([]);
        setTopicsLoading(false);
    });
     return () => unsubscribe();
  }, []); // This effect runs once to fetch public topic data


  const loading = salesLoading || expensesLoading || debtsLoading || workersLoading || topicsLoading;

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
