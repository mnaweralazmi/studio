
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, DocumentData, Unsubscribe } from 'firebase/firestore';
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

// Helper function to create a data subscription for a specific user
const createUserSubscription = <T extends { id: string }>(
    collectionName: string,
    uid: string,
    setData: React.Dispatch<React.SetStateAction<T[]>>,
    transform: (data: DocumentData) => T,
    sortFn?: (a: T, b: T) => number
): Unsubscribe => {
    // Query without server-side ordering to avoid composite index requirement
    const q = query(collection(db, collectionName), where("ownerId", "==", uid));
    return onSnapshot(q, (snapshot) => {
        let items = snapshot.docs.map(doc => transform({ id: doc.id, ...doc.data() }));
        // Sort on the client-side
        if (sortFn) {
            items = items.sort(sortFn);
        }
        setData(items);
    }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        setData([]);
    });
};

// Helper function for public data that doesn't have an ownerId
const createPublicSubscription = <T extends { id: string }>(
    collectionName: string,
    setData: React.Dispatch<React.SetStateAction<T[]>>,
    transform: (data: DocumentData) => T,
    sortFn?: (a: T, b: T) => number
): Unsubscribe => {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
        let items = snapshot.docs.map(doc => transform({ id: doc.id, ...doc.data() }));
        if (sortFn) {
            items = items.sort(sortFn);
        }
        setData(items);
    }, (error) => {
        console.error(`Error fetching public ${collectionName}:`, error);
        setData([]);
    });
}


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

    // Effect for auth state and user profile
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userProfileData = docSnap.data() as UserProfile;
                        setUser({ ...firebaseUser, ...userProfileData });
                    } else {
                        setUser(firebaseUser); // Fallback to basic user info
                    }
                    setLoading(false);
                });
                 return () => userDocUnsubscribe();
            } else {
                setUser(null);
                setLoading(false);
                clearAllData();
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect for data subscriptions
    useEffect(() => {
        // Public data subscription (does not depend on user)
        const topicsUnsubscribe = createPublicSubscription<AgriculturalSection>('data', setTopics, d => ({
            ...d,
            subTopics: d.subTopics || [],
            videos: d.videos || [],
        }) as AgriculturalSection);

        // User-specific data subscriptions
        if (user) {
            const userSubscriptions = [
                createUserSubscription<Task>('tasks', user.uid, setTasks, d => ({ ...d, dueDate: d.dueDate.toDate() }) as Task, (a, b) => b.dueDate.getTime() - a.dueDate.getTime()),
                createUserSubscription<ArchivedTask>('completed_tasks', user.uid, setCompletedTasks, d => ({ ...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate() }) as ArchivedTask, (a,b) => b.completedAt.getTime() - a.completedAt.getTime()),
                createUserSubscription<SalesItem>('sales', user.uid, setAllSales, d => ({ ...d, date: d.date.toDate() }) as SalesItem, (a, b) => b.date.getTime() - a.date.getTime()),
                createUserSubscription<ArchivedSale>('archive_sales', user.uid, setArchivedSales, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedSale, (a, b) => b.archivedAt.getTime() - a.archivedAt.getTime()),
                createUserSubscription<ExpenseItem>('expenses', user.uid, setAllExpenses, d => ({ ...d, date: d.date.toDate() }) as ExpenseItem, (a, b) => b.date.getTime() - a.date.getTime()),
                createUserSubscription<ArchivedExpense>('archive_expenses', user.uid, setArchivedExpenses, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedExpense, (a, b) => b.archivedAt.getTime() - a.archivedAt.getTime()),
                createUserSubscription<DebtItem>('debts', user.uid, setAllDebts, d => ({ ...d, dueDate: d.dueDate ? d.dueDate.toDate() : undefined, payments: (d.payments || []).map((p: any) => ({ ...p, date: p.date.toDate() })) }) as DebtItem, (a, b) => (b.dueDate?.getTime() || 0) - (a.dueDate?.getTime() || 0)),
                createUserSubscription<ArchivedDebt>('archive_debts', user.uid, setArchivedDebts, d => ({ ...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate ? d.dueDate.toDate() : undefined }) as ArchivedDebt, (a, b) => b.archivedAt.getTime() - a.archivedAt.getTime()),
                createUserSubscription<Worker>('workers', user.uid, setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker)
            ];
            
            return () => {
                userSubscriptions.forEach(unsub => unsub());
                topicsUnsubscribe();
            };
        }
        
        // Cleanup public subscription if user is not logged in
        return () => topicsUnsubscribe();

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

    