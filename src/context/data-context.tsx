
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, query, DocumentData, Timestamp } from 'firebase/firestore';
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


const mapTimestampsToDates = (docData: DocumentData): any => {
    const mapped: any = { ...docData };
    for (const key in mapped) {
        if (mapped[key] instanceof Timestamp) {
            mapped[key] = mapped[key].toDate();
        } else if (Array.isArray(mapped[key])) {
            mapped[key] = mapped[key].map((item: any) => {
                if (item && typeof item === 'object' && !(item instanceof Date)) {
                    return mapTimestampsToDates(item);
                }
                return item;
            });
        } else if (mapped[key] && typeof mapped[key] === 'object' && !(mapped[key] instanceof Date)) {
             mapped[key] = mapTimestampsToDates(mapped[key]);
        }
    }
    return mapped;
};


const useCollectionSubscription = <T extends DocumentData>(
    collectionNames: string[],
    enabled: boolean,
    userId: string | undefined
): [T[], boolean] => {
    const [data, setData] = useState<Record<string, T[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!enabled || !userId) {
            setData({});
            setLoading(false);
            return () => {};
        }

        setLoading(true);
        const unsubscribers = collectionNames.map(collectionName => {
            const dataQuery = query(collection(db, 'users', userId, collectionName));
            
            return onSnapshot(dataQuery, (snapshot) => {
                const fetchedItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...mapTimestampsToDates(doc.data()),
                } as T));

                setData(prevData => ({
                    ...prevData,
                    [collectionName]: fetchedItems,
                }));
                 setLoading(false);
            }, error => {
                console.error(`Error fetching collection ${collectionName}:`, error);
                setLoading(false);
            });
        });

        // Initial loading is done after setting up listeners
        const timer = setTimeout(() => setLoading(false), 1500); // Failsafe timeout

        return () => {
            clearTimeout(timer);
            unsubscribers.forEach(unsub => unsub());
        };
    }, [collectionNames.join(','), enabled, userId]);

    const flattenedData = React.useMemo(() => Object.values(data).flat(), [data]);

    return [flattenedData, loading];
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const isEnabled = !authLoading && !!user;
    
    const departments = ['agriculture', 'livestock', 'poultry', 'fish'];
    const salesCollections = departments.map(d => `${d}_sales`);
    const expensesCollections = departments.map(d => `${d}_expenses`);
    const debtsCollections = departments.map(d => `${d}_debts`);

    const [allSales, salesLoading] = useCollectionSubscription<SalesItem>(salesCollections, isEnabled, user?.uid);
    const [allExpenses, expensesLoading] = useCollectionSubscription<ExpenseItem>(expensesCollections, isEnabled, user?.uid);
    const [allDebts, debtsLoading] = useCollectionSubscription<DebtItem>(debtsCollections, isEnabled, user?.uid);
    const [allWorkers, workersLoading] = useCollectionSubscription<Worker>(['workers'], isEnabled, user?.uid);

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
