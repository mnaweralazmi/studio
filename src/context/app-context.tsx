
"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
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
const createUserSubscription = <T,>(
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
        console.error(`Error fetching user-specific ${collectionName}:`, error);
        setData([]);
    });
};

// Helper to create a public (non-user-specific) subscription for public data like topics
const createPublicSubscription = <T,>(
    collectionName: string,
    setData: React.Dispatch<React.SetStateAction<T[]>>,
    transform: (doc: DocumentData) => T
): Unsubscribe => {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => transform({ id: doc.id, ...doc.data() }));
        setData(items);
    }, (error) => {
        console.error(`Error fetching public ${collectionName}:`, error);
        setData([]);
    });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // All data states
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<ArchivedTask[]>([]);
    const [allSales, setAllSales] = useState<SalesItem[]>([]);
    const [archivedSales, setArchivedSales] = useState<ArchivedSale[]>([]);
    const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
    const [archivedExpenses, setArchivedExpenses] = useState<ArchivedExpense[]>([]);
    const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
    const [archivedDebts, setArchivedDebt] = useState<ArchivedDebt[]>([]);
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
        setArchivedDebt([]);
        setAllWorkers([]);
    };

    useEffect(() => {
        // Public data subscription (always active, does not depend on user)
        const topicsUnsubscribe = createPublicSubscription<AgriculturalSection>(
            'data', setTopics, (d) => ({
                ...d,
                subTopics: d.subTopics || [],
                videos: d.videos || [],
            }) as AgriculturalSection
        );

        const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                
                const userDocUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        const combinedUser: User = { 
                            ...firebaseUser, 
                            ...userData,
                            name: userData.name || firebaseUser.displayName,
                            photoURL: userData.photoURL || firebaseUser.photoURL,
                         };
                        setUser(combinedUser);
                    } else {
                        setUser(firebaseUser);
                    }
                     setLoading(false);
                });

                return () => {
                    userDocUnsubscribe();
                };

            } else {
                setUser(null);
                clearAllData();
                setLoading(false);
            }
        });
        
        return () => {
            authUnsubscribe();
            topicsUnsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user) {
            clearAllData();
            return;
        };

        const subscriptions = [
            createUserSubscription<Task>('tasks', user.uid, setTasks, d => ({...d, dueDate: d.dueDate.toDate()}) as Task),
            createUserSubscription<ArchivedTask>('completed_tasks', user.uid, setCompletedTasks, d => ({...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate()}) as ArchivedTask),
            createUserSubscription<SalesItem>('sales', user.uid, setAllSales, d => ({...d, date: d.date.toDate()}) as SalesItem),
            createUserSubscription<ArchivedSale>('archive_sales', user.uid, setArchivedSales, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedSale),
            createUserSubscription<ExpenseItem>('expenses', user.uid, setAllExpenses, d => ({...d, date: d.date.toDate()}) as ExpenseItem),
            createUserSubscription<ArchivedExpense>('archive_expenses', user.uid, setArchivedExpenses, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedExpense),
            createUserSubscription<DebtItem>('debts', user.uid, setAllDebts, d => ({...d, dueDate: d.dueDate?.toDate(), payments: (d.payments || []).map((p: any) => ({...p, date: p.date.toDate()})) }) as DebtItem),
            createUserSubscription<ArchivedDebt>('archive_debts', user.uid, setArchivedDebt, d => ({...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate?.toDate() }) as ArchivedDebt),
            createUserSubscription<Worker>('workers', user.uid, setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker)
        ];

        return () => {
            subscriptions.forEach(unsub => unsub());
        }

    }, [user])


    const value = {
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
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
