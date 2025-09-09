
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, onSnapshot, doc, DocumentData, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Task, ArchivedTask, SalesItem, ArchivedSale, ExpenseItem, ArchivedExpense, DebtItem, ArchivedDebt, Worker, AgriculturalSection } from '@/lib/types';

interface UserProfile {
    name?: string;
    role?: 'admin' | 'user';
    points?: number;
    level?: number;
    badges?: string[];
    photoURL?: string;
}

interface User extends FirebaseUser, UserProfile {}

interface AppContextType {
    user: User | null;
    loading: boolean;
    tasks: Task[];
    completedTasks: ArchivedTask[];
    allSales: SalesItem[];
    allExpenses: ExpenseItem[];
    allDebts: DebtItem[];
    allWorkers: Worker[];
    archivedSales: ArchivedSale[];
    archivedExpenses: ArchivedExpense[];
    archivedDebts: ArchivedDebt[];
    topics: AgriculturalSection[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const createCollectionSubscription = <T extends { id: string }>(
    collectionName: string,
    setData: React.Dispatch<React.SetStateAction<T[]>>,
    transform: (data: DocumentData) => T
): Unsubscribe => {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => transform({ id: doc.id, ...doc.data() }));
        setData(items);
    }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        setData([]);
    });
};

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<ArchivedTask[]>([]);
    const [allSales, setAllSales] = useState<SalesItem[]>([]);
    const [archivedSales, setArchivedSales] = useState<ArchivedSale[]>([]);
    const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
    const [archivedExpenses, setArchivedExpenses] = useState<ArchivedExpense[]>([]);
    const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
    const [archivedDebts, setArchivedDebts] = useState<ArchivedDebt[]>([]);
    const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
    const [topics, setTopics] = useState<AgriculturalSection[]>([]);
    
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
                    const profileData = docSnap.data() as UserProfile;
                    setUser({ ...firebaseUser, ...profileData });
                    setLoading(false);
                });
                return () => unsubProfile();
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const subscriptions = [
            createCollectionSubscription<Task>('tasks', setTasks, d => ({ ...d, dueDate: d.dueDate.toDate() }) as Task),
            createCollectionSubscription<ArchivedTask>('completed_tasks', setCompletedTasks, d => ({ ...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate() }) as ArchivedTask),
            createCollectionSubscription<SalesItem>('sales', setAllSales, d => ({ ...d, date: d.date.toDate() }) as SalesItem),
            createCollectionSubscription<ArchivedSale>('archive_sales', setArchivedSales, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedSale),
            createCollectionSubscription<ExpenseItem>('expenses', setAllExpenses, d => ({ ...d, date: d.date.toDate() }) as ExpenseItem),
            createCollectionSubscription<ArchivedExpense>('archive_expenses', setArchivedExpenses, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedExpense),
            createCollectionSubscription<DebtItem>('debts', setAllDebts, d => ({ ...d, dueDate: d.dueDate ? d.dueDate.toDate() : null, payments: (d.payments || []).map((p: any) => ({ ...p, date: p.date.toDate() })) }) as DebtItem),
            createCollectionSubscription<ArchivedDebt>('archive_debts', setArchivedDebts, d => ({ ...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate ? d.dueDate.toDate() : null }) as ArchivedDebt),
            createCollectionSubscription<Worker>('workers', setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker),
            createCollectionSubscription<AgriculturalSection>('data', setTopics, d => d as AgriculturalSection)
        ];

        return () => {
            subscriptions.forEach(unsub => unsub());
        };
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        tasks,
        completedTasks,
        allSales,
        archivedSales,
        allExpenses,
        archivedExpenses,
        allDebts,
        archivedDebts,
        allWorkers,
        topics,
    }), [user, loading, tasks, completedTasks, allSales, archivedSales, allExpenses, archivedExpenses, allDebts, archivedDebts, allWorkers, topics]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
