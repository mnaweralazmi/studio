
"use client";

import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  onSnapshot,
  Unsubscribe,
  collection,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { 
    AgriculturalSection, 
    ArchivedDebt, 
    ArchivedExpense, 
    ArchivedSale, 
    ArchivedTask, 
    DebtItem, 
    ExpenseItem, 
    SalesItem, 
    Task, 
    Worker 
} from "@/lib/types";

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
  topics: AgriculturalSection[];
  allSales: SalesItem[];
  allExpenses: ExpenseItem[];
  allDebts: DebtItem[];
  allWorkers: Worker[];
  archivedSales: ArchivedSale[];
  archivedExpenses: ArchivedExpense[];
  archivedDebts: ArchivedDebt[];
}

const AppContext = createContext<AppContextType>({
  user: null,
  loading: true,
  tasks: [],
  completedTasks: [],
  topics: [],
  allSales: [],
  allExpenses: [],
  allDebts: [],
  allWorkers: [],
  archivedSales: [],
  archivedExpenses: [],
  archivedDebts: [],
});

const parseDoc = (doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...Object.fromEntries(
        Object.entries(data).map(([key, value]) =>
          value instanceof Timestamp ? [key, value.toDate()] : [key, value]
        )
      ),
    } as any;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Omit<AppContextType, 'user' | 'loading'>>({
      tasks: [],
      completedTasks: [],
      topics: [],
      allSales: [],
      allExpenses: [],
      allDebts: [],
      allWorkers: [],
      archivedSales: [],
      archivedExpenses: [],
      archivedDebts: [],
  });

  const dataUnsubscribersRef = useRef<Unsubscribe[]>([]);

  useEffect(() => {
    let userProfileUnsubscribe: Unsubscribe | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      
      // Cleanup previous user's data listeners
      dataUnsubscribersRef.current.forEach(unsub => unsub());
      dataUnsubscribersRef.current = [];

      if (userProfileUnsubscribe) {
        userProfileUnsubscribe();
      }

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        userProfileUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
          const userProfile = userDocSnap.exists() ? (userDocSnap.data() as UserProfile) : {};
          const fullUser: User = { ...firebaseUser, ...userProfile };
          setUser(fullUser);

          // Now that we have the user, fetch their data
          const collectionsToWatch = [
            { name: 'tasks', stateKey: 'tasks' },
            { name: 'completed_tasks', stateKey: 'completedTasks' },
            { name: 'sales', stateKey: 'allSales' },
            { name: 'expenses', stateKey: 'allExpenses' },
            { name: 'debts', stateKey: 'allDebts' },
            { name: 'workers', stateKey: 'allWorkers' },
            { name: 'archive_sales', stateKey: 'archivedSales' },
            { name: 'archive_expenses', stateKey: 'archivedExpenses' },
            { name: 'archive_debts', stateKey: 'archivedDebts' },
            { name: 'topics', stateKey: 'topics' }, // Also fetch public topics
          ];

          const unsubscribers: Unsubscribe[] = [];

          collectionsToWatch.forEach(({ name, stateKey }) => {
              const q = name === 'topics' 
                ? query(collection(db, name)) 
                : query(collection(db, name), where("ownerId", "==", fullUser.uid));

              const unsubscribe = onSnapshot(q, (snapshot) => {
                  const items = snapshot.docs.map(parseDoc);
                  setData(prevData => ({ ...prevData, [stateKey]: items }));
              }, (error) => {
                  console.error(`Error fetching ${name}:`, error);
              });
              unsubscribers.push(unsubscribe);
          });
          
          dataUnsubscribersRef.current = unsubscribers;
          setLoading(false);

        }, (error) => {
            console.error("Error listening to user document:", error);
            setUser(firebaseUser as User); 
            setLoading(false);
        });

      } else {
        setUser(null);
        setData({
            tasks: [], completedTasks: [], topics: [], allSales: [], allExpenses: [],
            allDebts: [], allWorkers: [], archivedSales: [], archivedExpenses: [], archivedDebts: []
        });
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (userProfileUnsubscribe) userProfileUnsubscribe();
      dataUnsubscribersRef.current.forEach(unsub => unsub());
    };
  }, []);


  return (
    <AppContext.Provider value={{ user, loading, ...data }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  return useContext(AppContext);
};
