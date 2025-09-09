
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  doc,
  DocumentSnapshot,
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

type UserProfile = {
  name?: string;
  role?: "admin" | "user";
  points?: number;
  level?: number;
  badges?: string[];
  photoURL?: string;
  [key: string]: any;
};

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

  const unsubRef = useRef<Record<string, Unsubscribe | null>>({});

  const listenToCollection = <T,>(
    collectionName: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    uid?: string
  ) => {
    const key = uid ? `${collectionName}-${uid}` : collectionName;
    if (unsubRef.current[key]) {
      unsubRef.current[key]!();
    }

    const colRef = collection(db, collectionName) as CollectionReference<DocumentData>;
    const q = uid ? query(colRef, where("ownerId", "==", uid)) : query(colRef);

    const unsub = onSnapshot(q, (snapshot) => {
      const data = mapSnapshot<T>(snapshot);
      setter(data);
    }, (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
      setter([]);
    });
    unsubRef.current[key] = unsub;
  };

  const clearAllListeners = () => {
    Object.values(unsubRef.current).forEach((unsub) => {
      if (unsub) unsub();
    });
    unsubRef.current = {};
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      clearAllListeners();
      if (firebaseUser) {
        setLoading(true);

        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userProfile = userDocSnap.exists() ? (userDocSnap.data() as UserProfile) : {};
        const currentUser = { ...firebaseUser, ...userProfile } as User;
        setUser(currentUser);

        // Listen to user-specific collections
        listenToCollection<Task>('tasks', setTasks, firebaseUser.uid);
        listenToCollection<ArchivedTask>('completed_tasks', setCompletedTasks, firebaseUser.uid);
        listenToCollection<SalesItem>('sales', setAllSales, firebaseUser.uid);
        listenToCollection<ArchivedSale>('archive_sales', setArchivedSales, firebaseUser.uid);
        listenToCollection<ExpenseItem>('expenses', setAllExpenses, firebaseUser.uid);
        listenToCollection<ArchivedExpense>('archive_expenses', setArchivedExpenses, firebaseUser.uid);
        listenToCollection<DebtItem>('debts', setAllDebts, firebaseUser.uid);
        listenToCollection<ArchivedDebt>('archive_debts', setArchivedDebts, firebaseUser.uid);
        listenToCollection<Worker>('workers', setAllWorkers, firebaseUser.uid);
        
        // Listen to public collections (no UID filter)
        listenToCollection<AgriculturalSection>('data', setTopics);

        // Listen for user profile updates
        const unsubUser = onSnapshot(userDocRef, (docSnap: DocumentSnapshot<DocumentData>) => {
          if (docSnap.exists()) {
            setUser(prevUser => ({ ...prevUser, ...firebaseUser, ...docSnap.data() } as User));
          }
        });
        unsubRef.current['userDoc'] = unsubUser;

        setLoading(false);
      } else {
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
        setTopics([]); // Clear public data too on logout
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
    topics,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
};
