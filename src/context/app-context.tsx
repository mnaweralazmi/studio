
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

// The final user object that merges Firebase Auth info with Firestore profile data
interface User extends FirebaseUser, UserProfile {}

interface AppContextType {
    user: User | null;
    loading: boolean; // True while authenticating and loading initial data
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

// Helper to create a user-specific data subscription
const createUserSubscription = <T extends { id: string }>(
    collectionName: string,
    uid: string,
    setData: React.Dispatch<React.SetStateAction<T[]>>,
    transform: (data: DocumentData) => T
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

// Helper for public data
const createPublicSubscription = <T extends { id: string }>(
    collectionName: string,
    setData: React.Dispatch<React.SetStateAction<T[]>>,
    transform: (data: DocumentData) => T
): Unsubscribe => {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => transform({ id: doc.id, ...doc.data() }));
        setData(items);
    }, (error) => console.error(`Error fetching public ${collectionName}:`, error));
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

    useEffect(() => {
        // This is the primary listener for authentication state.
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in. Now, listen for their profile document.
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        // Profile found, merge auth and profile data.
                        const userProfileData = docSnap.data() as UserProfile;
                        setUser({ ...firebaseUser, ...userProfileData });
                    } else {
                        // Profile not found (e.g., new user), use basic auth data.
                        // The user creation logic in register/login pages should handle creating the doc.
                        setUser(firebaseUser);
                    }
                    setLoading(false); // Auth and profile check is complete.
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    setUser(firebaseUser); // Fallback to auth data on error
                    setLoading(false);
                });
                return () => unsubscribeProfile(); // Cleanup profile listener on auth change.
            } else {
                // No user is signed in.
                setUser(null);
                clearAllData();
                setLoading(false); // Auth check is complete.
            }
        });

        // This is the main cleanup function for the auth state listener.
        return () => unsubscribeAuth();
    }, []); // This effect runs only once on mount.


    useEffect(() => {
        // This effect is responsible for setting up all data subscriptions
        // and it ONLY runs when the `user` object changes.
        
        // Always subscribe to public data regardless of user state
        const topicsUnsubscribe = createPublicSubscription<AgriculturalSection>('data', setTopics, d => ({
            ...d,
            subTopics: d.subTopics || [],
            videos: d.videos || [],
        }) as AgriculturalSection);

        if (user) {
            // User is logged in, set up their specific data listeners.
            const userSubscriptions = [
                createUserSubscription<Task>('tasks', user.uid, setTasks, d => ({ ...d, dueDate: d.dueDate.toDate() }) as Task),
                createUserSubscription<ArchivedTask>('completed_tasks', user.uid, setCompletedTasks, d => ({ ...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate() }) as ArchivedTask),
                createUserSubscription<SalesItem>('sales', user.uid, setAllSales, d => ({ ...d, date: d.date.toDate() }) as SalesItem),
                createUserSubscription<ArchivedSale>('archive_sales', user.uid, setArchivedSales, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedSale),
                createUserSubscription<ExpenseItem>('expenses', user.uid, setAllExpenses, d => ({ ...d, date: d.date.toDate() }) as ExpenseItem),
                createUserSubscription<ArchivedExpense>('archive_expenses', user.uid, setArchivedExpenses, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedExpense),
                createUserSubscription<DebtItem>('debts', user.uid, setAllDebts, d => ({ ...d, dueDate: d.dueDate ? d.dueDate.toDate() : null, payments: (d.payments || []).map((p: any) => ({ ...p, date: p.date.toDate() })) }) as DebtItem),
                createUserSubscription<ArchivedDebt>('archive_debts', user.uid, setArchivedDebts, d => ({ ...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate ? d.dueDate.toDate() : null }) as ArchivedDebt),
                createUserSubscription<Worker>('workers', user.uid, setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker)
            ];
            
            // Return a cleanup function that unsubscribes from everything.
            return () => {
                userSubscriptions.forEach(unsub => unsub());
                topicsUnsubscribe();
            };
        }
        
        // If there's no user, we still need to clean up the public data listener.
        return () => topicsUnsubscribe();

    }, [user]); // This dependency array is key: it re-runs everything when user logs in/out.


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
