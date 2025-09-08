
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

// This function recursively searches for Firestore Timestamps and converts them to JS Date objects.
const mapTimestampsToDates = (data: any): any => {
  if (!data) {
    return data;
  }
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  if (Array.isArray(data)) {
    return data.map(item => mapTimestampsToDates(item));
  }
  // Check if it's an object (and not a Date, which is also an object)
  if (typeof data === 'object' && data !== null && !(data instanceof Date)) {
    const res: { [key: string]: any } = {};
    for (const key in data) {
      // Use hasOwnProperty to ensure it's not a property from the prototype chain
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        res[key] = mapTimestampsToDates(data[key]);
      }
    }
    return res;
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
  const [loading, setLoading] = useState(true);

  const [allSales, setAllSales] = useState<SalesItem[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  
  useEffect(() => {
    // If no user, do nothing and ensure state is cleared.
    if (!user?.uid) {
      setLoading(false);
      setAllSales([]);
      setAllExpenses([]);
      setAllDebts([]);
      setAllWorkers([]);
      // Topics are public, so they might still be loaded, but we reset others.
      return;
    }

    // Set loading to true when we start fetching data for a new user
    setLoading(true);

    const collectionsToSubscribe = [
        { name: 'sales', setter: setAllSales },
        { name: 'expenses', setter: setAllExpenses },
        { name: 'debts', setter: setAllDebts },
        { name: 'workers', setter: setAllWorkers },
    ];
    
    let activeSubscriptions = collectionsToSubscribe.length + 1; // +1 for topics
    
    const onDataLoad = () => {
        activeSubscriptions--;
        if (activeSubscriptions === 0) {
            setLoading(false);
        }
    };
    
    const unsubscribers = collectionsToSubscribe.map(({ name, setter }) => {
      const q = query(collection(db, name), where("ownerId", "==", user.uid));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) } as any));
        setter(items);
        onDataLoad();
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
        setter([]);
        onDataLoad();
      });
    });

    // Subscribe to public topics
    const topicsQuery = query(collection(db, "data"));
    const topicsUnsubscriber = onSnapshot(topicsQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) } as any));
        setTopics(items);
        onDataLoad();
    }, (error) => {
        console.error(`Error fetching topics:`, error);
        setTopics([]);
        onDataLoad();
    });
    
    unsubscribers.push(topicsUnsubscriber);

    // Cleanup function to unsubscribe from all listeners on component unmount or when user changes.
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };

  }, [user?.uid]); // Dependency array ensures this effect re-runs when the user's UID changes.

  const value = {
    allSales,
    allExpenses,
    allDebts,
    allWorkers,
    topics,
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
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
