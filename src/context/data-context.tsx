
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
    if (data && typeof data === 'object' && !React.isValidElement(data) && Object.prototype.toString.call(data) !== '[object Date]') {
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
    collectionName: string,
    userId: string | undefined
): [T[], boolean] => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!userId) {
            setData([]);
            setLoading(false);
            return;
        }

        const dataQuery = query(collection(db, 'users', userId, collectionName));
        
        const unsubscribe = onSnapshot(dataQuery, (snapshot) => {
            const fetchedItems = snapshot.docs.map(doc => {
                const docData = doc.data();
                const mappedData = mapTimestampsToDates(docData);
                return { id: doc.id, ...mappedData } as T;
            });
            setData(fetchedItems);
            setLoading(false);
        }, error => {
            console.error(`Error fetching collection ${collectionName}:`, error);
            setData([]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, collectionName]);

    return [data, loading];
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    
    const [allSales, salesLoading] = useCollectionSubscription<SalesItem>('sales', user?.uid);
    const [allExpenses, expensesLoading] = useCollectionSubscription<ExpenseItem>('expenses', user?.uid);
    const [allDebts, debtsLoading] = useCollectionSubscription<DebtItem>('debts', user?.uid);
    const [allWorkers, workersLoading] = useCollectionSubscription<Worker>('workers', user?.uid);
    
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
