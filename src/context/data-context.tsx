
"use client";
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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

const DataContext = createContext<DataContextType>({
  allSales: [],
  allExpenses: [],
  allDebts: [],
  allWorkers: [],
  topics: [],
  loading: true,
});

const mapTimestampsToDates = (data: any): any => {
    if (!data) return data;
    if (data instanceof Timestamp) return data.toDate();
    if (Array.isArray(data)) return data.map(item => mapTimestampsToDates(item));
    if (typeof data === 'object' && !(data instanceof Date)) {
        return Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = mapTimestampsToDates(value);
            return acc;
        }, {} as { [key: string]: any });
    }
    return data;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [allSales, setAllSales] = useState<SalesItem[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there is no user, reset everything to empty and not loading.
    if (!user?.uid) {
      setAllSales([]);
      setAllExpenses([]);
      setAllDebts([]);
      setAllWorkers([]);
      setTopics([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.uid;

    const collectionsToWatch = [
      { name: 'sales', setter: setAllSales },
      { name: 'expenses', setter: setAllExpenses },
      { name: 'debts', setter: setAllDebts },
      { name: 'workers', setter: setAllWorkers },
      { name: 'data', setter: setTopics, isPublic: true },
    ];
    
    let pendingSubscriptions = collectionsToWatch.length;

    const unsubscribers = collectionsToWatch.map(({ name, setter, isPublic }) => {
      const q = isPublic 
        ? query(collection(db, name))
        : query(collection(db, name), where("ownerId", "==", userId));
      
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...mapTimestampsToDates(doc.data()) 
        })) as any[];
        setter(items);
        
        pendingSubscriptions--;
        if (pendingSubscriptions === 0) {
          setLoading(false);
        }
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
        setter([]);
        pendingSubscriptions--;
        if (pendingSubscriptions === 0) {
          setLoading(false);
        }
      });
    });

    // Cleanup function to unsubscribe from all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };

  }, [user?.uid]);

  const value = { allSales, allExpenses, allDebts, allWorkers, topics, loading };

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
