
"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDoc, doc, DocumentData, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Task, ArchivedTask, SalesItem, ArchivedSale, ExpenseItem, ArchivedExpense, DebtItem, ArchivedDebt, Worker, AgriculturalSection } from '@/lib/types';

interface User extends FirebaseUser {
    name?: string;
    role?: 'admin' | 'user';
    points?: number;
    level?: number;
    badges?: string[];
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

// Helper to create a public (non-user-specific) subscription
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

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                setUser({ ...firebaseUser, ...userData });
                // Data fetching for logged-in user is handled by the next useEffect
            } else {
                setUser(null);
                clearAllData();
                setLoading(false); // No user, so stop loading
            }
        });
        return () => authUnsubscribe();
    }, []);

    useEffect(() => {
        // Public data subscription (always active)
        const topicsUnsubscribe = createPublicSubscription<AgriculturalSection>(
            'data', setTopics, (d) => ({
                ...d,
                subTopics: d.subTopics || [],
                videos: d.videos || [],
            }) as AgriculturalSection
        );

        // If there's no user, we just need public data.
        if (!user) {
            // Loading is already handled by the auth state change.
            return () => topicsUnsubscribe();
        }

        // --- User is logged in, set up all their data subscriptions ---
        setLoading(true); // Start loading user-specific data
        const uid = user.uid;
        
        const subscriptions = [
            createSubscription<Task>( 'tasks', uid, setTasks, d => ({...d, dueDate: d.dueDate.toDate()}) as Task),
            createSubscription<ArchivedTask>( 'completed_tasks', uid, setCompletedTasks, d => ({...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate()}) as ArchivedTask),
            createSubscription<SalesItem>( 'sales', uid, setAllSales, d => ({...d, date: d.date.toDate()}) as SalesItem),
            createSubscription<ArchivedSale>( 'archive_sales', uid, setArchivedSales, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedSale),
            createSubscription<ExpenseItem>( 'expenses', uid, setAllExpenses, d => ({...d, date: d.date.toDate()}) as ExpenseItem),
            createSubscription<ArchivedExpense>( 'archive_expenses', uid, setArchivedExpenses, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedExpense),
            createSubscription<DebtItem>( 'debts', uid, setAllDebts, d => ({...d, dueDate: d.dueDate?.toDate(), payments: (d.payments || []).map((p: any) => ({...p, date: p.date.toDate()})) }) as DebtItem),
            createSubscription<ArchivedDebt>( 'archive_debts', uid, setArchivedDebts, d => ({...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate?.toDate() }) as ArchivedDebt),
            createSubscription<Worker>( 'workers', uid, setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker)
        ];
        
        // After setting up all listeners, we can mark loading as false.
        // The onSnapshot will populate the data asynchronously.
        // The key is that the app shows the loading screen UNTIL listeners are attached.
        setLoading(false);

        // Cleanup function for when user logs out or component unmounts
        return () => {
            subscriptions.forEach(unsub => unsub());
            topicsUnsubscribe();
            clearAllData();
        };

    }, [user]); // This effect re-runs when the user object changes (login/logout)

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
