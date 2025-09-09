
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
        setLoading(true);
        // Public data subscription (always active)
        const topicsUnsubscribe = createPublicSubscription<AgriculturalSection>(
            'data', setTopics, (d) => ({
                ...d,
                subTopics: d.subTopics || [],
                videos: d.videos || [],
            }) as AgriculturalSection
        );

        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                
                // Set up a listener for the user document itself
                const userDocUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
                    const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                    const combinedUser: User = { 
                        ...firebaseUser, 
                        ...userData,
                        name: userData.name || firebaseUser.displayName,
                        photoURL: userData.photoURL || firebaseUser.photoURL,
                     };
                    setUser(combinedUser);
                });

                // Data fetching for logged-in user is now triggered by user state change in a separate useEffect
                return () => {
                    userDocUnsubscribe();
                }
            } else {
                setUser(null);
                clearAllData();
                setLoading(false); // No user, so stop loading (public data is already being fetched)
            }
        });
        
        return () => {
            authUnsubscribe();
            topicsUnsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user) {
            // User is logged out, clear their specific data
            clearAllData();
            // Loading is false because auth state is determined
            setLoading(false);
            return;
        }

        // --- User is logged in, set up all their data subscriptions ---
        setLoading(true); // Start loading user-specific data
        const uid = user.uid;
        
        const subscriptions = [
            createUserSubscription<Task>( 'tasks', uid, setTasks, d => ({...d, dueDate: d.dueDate.toDate()}) as Task),
            createUserSubscription<ArchivedTask>( 'completed_tasks', uid, setCompletedTasks, d => ({...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate()}) as ArchivedTask),
            createUserSubscription<SalesItem>( 'sales', uid, setAllSales, d => ({...d, date: d.date.toDate()}) as SalesItem),
            createUserSubscription<ArchivedSale>( 'archive_sales', uid, setArchivedSales, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedSale),
            createUserSubscription<ExpenseItem>( 'expenses', uid, setAllExpenses, d => ({...d, date: d.date.toDate()}) as ExpenseItem),
            createUserSubscription<ArchivedExpense>( 'archive_expenses', uid, setArchivedExpenses, d => ({...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate()}) as ArchivedExpense),
            createUserSubscription<DebtItem>( 'debts', uid, setAllDebts, d => ({...d, dueDate: d.dueDate?.toDate(), payments: (d.payments || []).map((p: any) => ({...p, date: p.date.toDate()})) }) as DebtItem),
            createUserSubscription<ArchivedDebt>( 'archive_debts', uid, setArchivedDebt, d => ({...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate?.toDate() }) as ArchivedDebt),
            createUserSubscription<Worker>( 'workers', uid, setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker)
        ];
        
        // This is a bit of a simplification. In a real-world app, you might use Promise.all
        // with initial fetches to know exactly when all data is loaded. For onSnapshot,
        // we assume data is "loaded" once the listeners are attached.
        setLoading(false);

        // Cleanup function for when user logs out or component unmounts
        return () => {
            subscriptions.forEach(unsub => unsub());
            clearAllData();
        };

    }, [user?.uid]); // Re-run ONLY when user ID changes to avoid re-subscribing on other user data changes

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
