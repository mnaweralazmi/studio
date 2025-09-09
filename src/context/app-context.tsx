
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, DocumentData, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Task, ArchivedTask, SalesItem, ArchivedSale, ExpenseItem, ArchivedExpense, DebtItem, ArchivedDebt, Worker, AgriculturalSection } from '@/lib/types';

interface User extends FirebaseUser {
    name?: string;
    role?: 'admin' | 'user';
    points?: number;
    level?: number;
    badges?: string[];
    photoURL?: string;
}

interface AppContextType {
    user: User | null;
    loading: boolean;
    // Tasks
    tasks: Task[];
    completedTasks: ArchivedTask[];
    // Financials
    allSales: SalesItem[];
    allExpenses: ExpenseItem[];
    allDebts: DebtItem[];
    allWorkers: Worker[];
    // Archives
    archivedSales: ArchivedSale[];
    archivedExpenses: ArchivedExpense[];
    archivedDebts: ArchivedDebt[];
    // Content
    topics: AgriculturalSection[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to create a user-specific subscription
const createSubscription = <T,>(
    collectionName: string,
    uid: string,
    setData: React.Dispatch<React.SetStateAction<T[]>>,
    transform: (doc: DocumentData) => T
): Unsubscribe => {
    const q = query(collection(db, collectionName), where("ownerId", "==", uid));
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

    // Data states
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
    
    const clearAllData = () => {
        setTasks([]);
        setCompletedTasks([]);
        setAllSales([]);
        setArchivedSales([]);
        setAllExpenses([]);
        setArchivedExpenses([]);
        setAllDebts([]);
        setArchivedDebts([]);
        setAllWorkers([]);
    };

    // Effect for handling auth state changes and user document loading
    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUser({
                            ...firebaseUser,
                            ...userData,
                            name: userData.name || firebaseUser.displayName,
                            photoURL: userData.photoURL || firebaseUser.photoURL,
                        });
                    } else {
                        setUser(firebaseUser); // Fallback to basic user info if doc doesn't exist
                    }
                    setLoading(false); // Auth state confirmed, user data (or lack thereof) loaded
                });
                return () => userDocUnsubscribe(); // Cleanup user doc listener
            } else {
                setUser(null);
                clearAllData();
                setLoading(false); // Auth state confirmed (logged out)
            }
        });

        return () => authUnsubscribe(); // Cleanup auth listener
    }, []);

    // Effect for fetching app-wide data (like topics)
    useEffect(() => {
        const topicsQuery = query(collection(db, 'data'));
        const topicsUnsubscribe = onSnapshot(topicsQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                subTopics: doc.data().subTopics || [],
                videos: doc.data().videos || [],
            }) as AgriculturalSection);
            setTopics(items);
        }, (error) => {
            console.error("Error fetching topics:", error);
            setTopics([]);
        });

        return () => topicsUnsubscribe();
    }, []);

    // Effect for setting up user-specific data subscriptions
    useEffect(() => {
        if (!user) {
            clearAllData();
            return;
        }

        const subscriptions = [
            createSubscription<Task>('tasks', user.uid, setTasks, d => ({...d, dueDate: d.dueDate.toDate()}) as Task),
            createSubscription<ArchivedTask>('completed_tasks', user.uid, setCompletedTasks, d => ({...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate()}) as ArchivedTask),
            createSubscription<SalesItem>('sales', user.uid, setAllSales, d => ({...d, date: d.date.toDate()}) as SalesItem),
            createSubscription<ArchivedSale>('archive_sales', user.uid, setArchivedSales, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedSale),
            createSubscription<ExpenseItem>('expenses', user.uid, setAllExpenses, d => ({...d, date: d.date.toDate()}) as ExpenseItem),
            createSubscription<ArchivedExpense>('archive_expenses', user.uid, setArchivedExpenses, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedExpense),
            createSubscription<DebtItem>('debts', user.uid, setAllDebts, d => ({...d, dueDate: d.dueDate?.toDate(), payments: (d.payments || []).map((p: any) => ({...p, date: p.date.toDate()})) }) as DebtItem),
            createSubscription<ArchivedDebt>('archive_debts', user.uid, setArchivedDebts, d => ({...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate?.toDate() }) as ArchivedDebt),
            createSubscription<Worker>('workers', user.uid, setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker)
        ];

        return () => {
            subscriptions.forEach(unsub => unsub());
        };
    }, [user]);

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
