
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, onSnapshot, doc, DocumentData, Unsubscribe, where } from 'firebase/firestore';
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

// Helper function to create a subscription for a collection owned by the user
const createUserCollectionSubscription = <T extends { id: string }>(
    uid: string,
    collectionName: string,
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

// Helper for public collections that don't have ownerId
const createPublicCollectionSubscription = <T extends { id: string }>(
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
        setLoading(true);
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
                    const profileData = docSnap.data() as UserProfile;
                    // Combine auth data with profile data
                    setUser({ ...firebaseUser, ...profileData });
                    // Only set loading to false after user profile is fetched
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    setUser(firebaseUser); // Fallback to auth data
                    setLoading(false);
                });

                return () => {
                    unsubProfile();
                };
            } else {
                setUser(null);
                setLoading(false); // No user, so loading is done
            }
        });

        return () => unsubscribeAuth();
    }, []);


    useEffect(() => {
        // This effect runs when the user object is available or changes.
        // It sets up all data subscriptions.
        if (user) {
            const uid = user.uid;
            
            const subscriptions = [
                createUserCollectionSubscription<Task>(uid, 'tasks', setTasks, d => ({ ...d, dueDate: d.dueDate.toDate() }) as Task),
                createUserCollectionSubscription<ArchivedTask>(uid, 'completed_tasks', setCompletedTasks, d => ({ ...d, dueDate: d.dueDate.toDate(), completedAt: d.completedAt.toDate() }) as ArchivedTask),
                createUserCollectionSubscription<SalesItem>(uid, 'sales', setAllSales, d => ({ ...d, date: d.date.toDate() }) as SalesItem),
                createUserCollectionSubscription<ArchivedSale>(uid, 'archive_sales', setArchivedSales, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedSale),
                createUserCollectionSubscription<ExpenseItem>(uid, 'expenses', setAllExpenses, d => ({ ...d, date: d.date.toDate() }) as ExpenseItem),
                createUserCollectionSubscription<ArchivedExpense>(uid, 'archive_expenses', setArchivedExpenses, d => ({ ...d, date: d.date.toDate(), archivedAt: d.archivedAt.toDate() }) as ArchivedExpense),
                createUserCollectionSubscription<DebtItem>(uid, 'debts', setAllDebts, d => ({ ...d, dueDate: d.dueDate ? d.dueDate.toDate() : null, payments: (d.payments || []).map((p: any) => ({ ...p, date: p.date.toDate() })) }) as DebtItem),
                createUserCollectionSubscription<ArchivedDebt>(uid, 'archive_debts', setArchivedDebts, d => ({ ...d, archivedAt: d.archivedAt.toDate(), dueDate: d.dueDate ? d.dueDate.toDate() : null }) as ArchivedDebt),
                createUserCollectionSubscription<Worker>(uid, 'workers', setAllWorkers, d => ({...d, transactions: (d.transactions || []).map((t: any) => ({...t, date: t.date.toDate()}))}) as Worker),
                
                // Public data subscription (no ownerId needed)
                createPublicCollectionSubscription<AgriculturalSection>('data', setTopics, d => d as AgriculturalSection)
            ];

            // Cleanup function to unsubscribe from all listeners when user logs out
            return () => {
                subscriptions.forEach(unsub => unsub());
            };
        } else {
             // If there is no user, clear all private data
             setTasks([]);
             setCompletedTasks([]);
             setAllSales([]);
             setArchivedSales([]);
             setAllExpenses([]);
             setArchivedExpenses([]);
             setAllDebts([]);
             setArchivedDebts([]);
             setAllWorkers([]);
             // We can keep public data like topics if we want
        }
    }, [user]); // This effect depends only on the user object

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
