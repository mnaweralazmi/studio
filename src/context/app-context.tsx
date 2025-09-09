
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Task, ArchivedTask, SalesItem, ArchivedSale, ExpenseItem, ArchivedExpense, DebtItem, ArchivedDebt, Worker, AgriculturalSection } from '@/lib/types';
import { initialAgriculturalSections } from '@/lib/initial-data';

// --- DUMMY DATA ---

const dummyUser: User = {
    uid: 'dummy-user-id-123',
    email: 'user@example.com',
    displayName: 'المستخدم الافتراضي',
    name: 'المستخدم الافتراضي',
    role: 'user',
    points: 75,
    level: 1,
    badges: ['explorer', 'planner'],
    photoURL: `https://i.pravatar.cc/150?u=dummy-user-id-123`,
    // FirebaseUser properties
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerId: 'password',
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
};

const dummyTasks: Task[] = [
    { id: 'task-1', ownerId: dummyUser.uid, title: 'سقي الطماطم', dueDate: new Date(), isCompleted: false, isRecurring: true, reminderDays: 1, description: 'تأكد من ري الطماطم في الصباح الباكر.' },
    { id: 'task-2', ownerId: dummyUser.uid, title: 'تسميد الخيار', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), isCompleted: false, isRecurring: false, reminderDays: 2 },
];

const dummyCompletedTasks: ArchivedTask[] = [
    { id: 'task-3', ownerId: dummyUser.uid, title: 'تقليم أشجار الليمون', dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), isCompleted: true, isRecurring: false, completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
];

const dummySales: SalesItem[] = [
    { id: 'sale-1', ownerId: dummyUser.uid, departmentId: 'agriculture', product: 'خيار', quantity: 10, price: 1.5, total: 15, date: new Date() },
    { id: 'sale-2', ownerId: dummyUser.uid, departmentId: 'livestock', product: 'خروف', quantity: 2, price: 80, total: 160, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
];

const dummyExpenses: ExpenseItem[] = [
    { id: 'exp-1', ownerId: dummyUser.uid, departmentId: 'agriculture', type: 'variable', category: 'مستلزمات زراعية', item: 'أسمدة', amount: 25, date: new Date() },
    { id: 'exp-2', ownerId: dummyUser.uid, departmentId: 'poultry', type: 'fixed', category: 'تغذية', item: 'أعلاف', amount: 120, date: new Date() },
];

const dummyDebts: DebtItem[] = [
    { id: 'debt-1', ownerId: dummyUser.uid, departmentId: 'agriculture', creditor: 'شركة الأسمدة المتحدة', amount: 200, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'partially-paid', payments: [{ amount: 100, date: new Date() }] },
];

const dummyWorkers: Worker[] = [
    { id: 'worker-1', ownerId: dummyUser.uid, departmentId: 'agriculture', name: 'عامل المزرعة ١', baseSalary: 150, paidMonths: [{year: new Date().getFullYear(), month: new Date().getMonth()}], transactions: [] },
];


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

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking auth state and fetching data
        const timer = setTimeout(() => {
            setUser(dummyUser);
            setLoading(false);
        }, 1500); // 1.5 second delay to simulate loading

        return () => clearTimeout(timer);
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        tasks: dummyTasks,
        completedTasks: dummyCompletedTasks,
        allSales: dummySales,
        archivedSales: [],
        allExpenses: dummyExpenses,
        archivedExpenses: [],
        allDebts: dummyDebts,
        archivedDebts: [],
        allWorkers: dummyWorkers,
        topics: initialAgriculturalSections,
    }), [user, loading]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
