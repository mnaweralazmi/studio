
"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDoc, doc, DocumentData, Query, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Task, ArchivedTask, SalesItem, ArchivedSale, ExpenseItem, ArchivedExpense, DebtItem, ArchivedDebt, Worker, AgriculturalSection, Department } from '@/lib/types';

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
        // We don't clear public topics data
    };

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                setUser({ ...firebaseUser, ...userData });
            } else {
                setUser(null);
                clearAllData();
                setLoading(false); 
            }
        });
        return () => authUnsubscribe();
    }, []);

    useEffect(() => {
        // Setup public data subscription (always on)
        const topicsUnsubscribe = createPublicSubscription<AgriculturalSection>(
            'data', setTopics, (d) => ({
            ...d,
            subTopics: d.subTopics || [],
            videos: d.videos || [],
            }) as AgriculturalSection
        );

        return () => topicsUnsubscribe();
    }, []);
    
    
     useEffect(() => {
        if (!user) {
             if (!auth.currentUser) { // Ensures we don't prematurely stop loading on initial load
                setLoading(false);
            }
            return;
        }

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
        
        // All subscriptions are set up, so we can stop loading.
        setLoading(false);

        // Cleanup function to unsubscribe from all listeners when component unmounts or user changes
        return () => {
            subscriptions.forEach(unsub => unsub());
            clearAllData();
        };

    }, [user]);


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
