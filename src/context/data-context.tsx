
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, query, DocumentData, Timestamp, Query } from 'firebase/firestore';
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

const useCollectionSubscription = <T extends DocumentData>(
    collectionNames: string[],
    enabled: boolean,
    userId: string | undefined
): [T[], boolean] => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const mapTimestampsToDates = useCallback((docData: DocumentData) => {
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
            }
        }
        return mapped;
    }, []);

    useEffect(() => {
        if (!enabled || !userId) {
            setLoading(false);
            setData([]);
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

                setData(prevData => {
                    const otherData = prevData.filter(item => (item as any).departmentId !== (fetchedItems[0] as any)?.departmentId);
                    return [...otherData, ...fetchedItems];
                });
            }, error => {
                console.error(`Error fetching collection ${collectionName}:`, error);
            });
        });

        setLoading(false); // Set loading to false after setting up listeners
        return () => unsubscribers.forEach(unsub => unsub());

    }, [collectionNames.join(','), enabled, userId, mapTimestampsToDates]); // Dependency on joined names to re-run if they change

    return [data, loading];
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
    // Workers are not departmentalized in the same way, kept as a single collection
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
