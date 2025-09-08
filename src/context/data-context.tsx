
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
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

const mapTimestampsToDates = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(item => mapTimestampsToDates(item));
    }
    if (data && typeof data === 'object' && !React.isValidElement(data)) {
        const mappedObject: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                mappedObject[key] = mapTimestampsToDates(data[key]);
            }
        }
        return mappedObject;
    }
    return data;
};


const useCollectionSubscription = <T extends DocumentData>(
    collectionNames: string[],
    userId: string | undefined
): [T[], boolean] => {
    const [data, setData] = useState<Record<string, T[]>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(collectionNames.map(name => [name, true]))
    );

    useEffect(() => {
        if (!userId) {
            setData({});
            setLoadingStates(Object.fromEntries(collectionNames.map(name => [name, false])));
            return;
        }

        const unsubscribers = collectionNames.map(collectionName => {
            const dataQuery = query(collection(db, 'users', userId, collectionName));
            
            return onSnapshot(dataQuery, (snapshot) => {
                const fetchedItems = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    const mappedData = mapTimestampsToDates(docData);
                    return { id: doc.id, ...mappedData } as T;
                });
                
                setData(prevData => ({
                    ...prevData,
                    [collectionName]: fetchedItems,
                }));
                 setLoadingStates(prev => ({ ...prev, [collectionName]: false }));
            }, error => {
                console.error(`Error fetching collection ${collectionName}:`, error);
                setData(prevData => ({
                    ...prevData,
                    [collectionName]: [],
                }));
                 setLoadingStates(prev => ({ ...prev, [collectionName]: false }));
            });
        });

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, JSON.stringify(collectionNames)]);

    const flattenedData = useMemo(() => Object.values(data).flat(), [data]);
    const isLoading = useMemo(() => Object.values(loadingStates).some(s => s), [loadingStates]);

    return [flattenedData, isLoading];
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    
    const departments = ['agriculture', 'livestock', 'poultry', 'fish'];
    const salesCollections = useMemo(() => departments.map(d => `${d}_sales`), []);
    const expensesCollections = useMemo(() => departments.map(d => `${d}_expenses`), []);
    const debtsCollections = useMemo(() => departments.map(d => `${d}_debts`), []);
    const workerCollections = useMemo(() => ['workers'], []);

    const [allSales, salesLoading] = useCollectionSubscription<SalesItem>(salesCollections, user?.uid);
    const [allExpenses, expensesLoading] = useCollectionSubscription<ExpenseItem>(expensesCollections, user?.uid);
    const [allDebts, debtsLoading] = useCollectionSubscription<DebtItem>(debtsCollections, user?.uid);
    const [allWorkers, workersLoading] = useCollectionSubscription<Worker>(workerCollections, user?.uid);
    
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
