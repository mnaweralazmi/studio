"use client";

import React, { createContext, useState, useContext, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  getDoc,
  doc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import type {
  Task,
  ArchivedTask,
  SalesItem,
  ArchivedSale,
  ExpenseItem,
  ArchivedExpense,
  DebtItem,
  ArchivedDebt,
  Worker,
  AgriculturalSection
} from "@/lib/types";
import { initialAgriculturalSections } from "@/lib/initial-data";

/** --- Types --- */
interface UserProfile {
  name?: string;
  role?: "admin" | "user";
  points?: number;
  level?: number;
  badges?: string[];
  photoURL?: string;
}
export interface User extends FirebaseUser, UserProfile {}

interface AppContextType {
  user: User | null;
  loading: boolean;
  tasks: Task[];
  completedTasks: ArchivedTask[];
  allSales: SalesItem[];
  archivedSales: ArchivedSale[];
  allExpenses: ExpenseItem[];
  archivedExpenses: ArchivedExpense[];
  allDebts: DebtItem[];
  archivedDebts: ArchivedDebt[];
  allWorkers: Worker[];
  topics: AgriculturalSection[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** --- Helpers --- */
function normalizeDocData<T = any>(docData: DocumentData): T {
  const out: any = {};
  for (const k of Object.keys(docData)) {
    const v = docData[k];
    if (v && typeof v === "object" && typeof (v as any).toDate === "function") {
      out[k] = (v as any).toDate();
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function mapSnapshot<T>(snap: QuerySnapshot<DocumentData>) {
  return snap.docs.map(d => ({ id: d.id, ...normalizeDocData(d.data()) })) as T[];
}

/** --- Provider --- */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ArchivedTask[]>([]);
  const [allSales, setAllSales] = useState<SalesItem[]>([]);
  const [archivedSales, setArchivedSales] = useState<ArchivedSale[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [archivedExpenses, setArchivedExpenses] = useState<ArchivedExpense[]>([]);
  const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
  const [archivedDebts, setArchivedDebts] = useState<ArchivedDebt[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [topics, setTopics] = useState<AgriculturalSection[]>(initialAgriculturalSections);

  const unsubRef = useRef<Record<string, Unsubscribe | null>>({});

  const createSubscription = <T>(
    collectionName: string, 
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    uid?: string
    ) => {
    const colRef = collection(db, collectionName);
    let q;
    if (uid) {
        // This is a private collection, filter by ownerId
        q = query(colRef, where("ownerId", "==", uid));
    } else {
        // This is a public collection (like 'data')
        q = query(colRef);
    }
    
    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const data = mapSnapshot<T>(snapshot);
            setter(data);
        },
        (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
            setter([]);
        }
    );
    return unsubscribe;
  };
  
  const clearAllListeners = () => {
    Object.values(unsubRef.current).forEach(unsub => unsub && unsub());
    unsubRef.current = {};
  };


  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      clearAllListeners();
      setLoading(true);

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let userData: User;
        if (userDocSnap.exists()) {
            const userProfileData = userDocSnap.data() as UserProfile;
            userData = { ...firebaseUser, ...userProfileData };
        } else {
            userData = firebaseUser as User;
        }
        setUser(userData);
        
        const uid = firebaseUser.uid;
        const subscriptions: { [key: string]: Unsubscribe } = {};

        subscriptions.tasks = createSubscription<Task>('tasks', setTasks, uid);
        subscriptions.completed_tasks = createSubscription<ArchivedTask>('completed_tasks', setCompletedTasks, uid);
        subscriptions.sales = createSubscription<SalesItem>('sales', setAllSales, uid);
        subscriptions.archive_sales = createSubscription<ArchivedSale>('archive_sales', setArchivedSales, uid);
        subscriptions.expenses = createSubscription<ExpenseItem>('expenses', setAllExpenses, uid);
        subscriptions.archive_expenses = createSubscription<ArchivedExpense>('archive_expenses', setArchivedExpenses, uid);
        subscriptions.debts = createSubscription<DebtItem>('debts', setAllDebts, uid);
        subscriptions.archive_debts = createSubscription<ArchivedDebt>('archive_debts', setArchivedDebts, uid);
        subscriptions.workers = createSubscription<Worker>('workers', setAllWorkers, uid);
        subscriptions.data = createSubscription<AgriculturalSection>('data', setTopics);

        unsubRef.current = subscriptions;
        setLoading(false);

      } else {
        // User is signed out
        setUser(null);
        setTasks([]);
        setCompletedTasks([]);
        setAllSales([]);
        setArchivedSales([]);
        setAllExpenses([]);
        setArchivedExpenses([]);
        setAllDebts([]);
        setArchivedDebts([]);
        setAllWorkers([]);
        setTopics(initialAgriculturalSections);
        setLoading(false);
      }
    });

    return () => {
        unsubAuth();
        clearAllListeners();
    };
  }, []);
  
  const value = useMemo<AppContextType>(() => ({
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
  }), [
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
    topics
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
