"use client";

import React, { createContext, useState, useContext, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  addDoc,
  deleteDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // تأكد من أن هذه التصديرات موجودة

// إذا لديك أنواع (types) خاصة مثل FinancialItem أو NoteItem ضع تعريفها في "@/lib/types"
// وإلا سنستخدم أي لتجنب أخطاء التجميع.
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

/** --- Additional local fallback types (use your real types if موجودة) --- */
type FinancialItem = any;
type NoteItem = any;

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

  // data
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
  financials: FinancialItem[];
  notes: NoteItem[];

  // CRUD examples:
  addTask: (payload: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addSale: (payload: Partial<SalesItem>) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;

  addFinancial: (payload: Partial<FinancialItem>) => Promise<void>;
  deleteFinancial: (id: string) => Promise<void>;

  addNote: (payload: Partial<NoteItem>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
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
  const [financials, setFinancials] = useState<FinancialItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const unsubRef = useRef<Record<string, Unsubscribe | null>>({});

  function listenCollection<T = any>(uid: string, collectionName: string, setter: (items: T[]) => void, orderField?: string) {
    try {
      const colRef = collection(db, "users", uid, collectionName) as CollectionReference<DocumentData>;
      const q = orderField ? query(colRef, orderBy(orderField, "desc")) : query(colRef);
      if (unsubRef.current[collectionName]) {
        unsubRef.current[collectionName]!();
      }
      const unsub = onSnapshot(q, snap => {
        setter(mapSnapshot<T>(snap));
      }, err => {
        console.error(`listenCollection(${collectionName}) error:`, err);
        setter([]);
      });
      unsubRef.current[collectionName] = unsub;
    } catch (err) {
      console.error("listenCollection setup error:", err);
    }
  }

  function clearAllListeners() {
    for (const k of Object.keys(unsubRef.current)) {
      const u = unsubRef.current[k];
      if (typeof u === "function") {
        try { u(); } catch (e) { /* ignore */ }
      }
      unsubRef.current[k] = null;
    }
  }

  // Auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser as User);
        setLoading(true);

        const uid = firebaseUser.uid;

        // استمع لكل مجموعات المستخدم — عدّل الأسماء هنا إذا بنية قاعدة بياناتك مختلفة
        listenCollection<Task>(uid, "tasks", setTasks, "dueDate");
        listenCollection<ArchivedTask>(uid, "completedTasks", setCompletedTasks, "completedAt");
        listenCollection<SalesItem>(uid, "sales", setAllSales, "date");
        listenCollection<ArchivedSale>(uid, "archivedSales", setArchivedSales, "date");
        listenCollection<ExpenseItem>(uid, "expenses", setAllExpenses, "date");
        listenCollection<ArchivedExpense>(uid, "archivedExpenses", setArchivedExpenses, "date");
        listenCollection<DebtItem>(uid, "debts", setAllDebts, "dueDate");
        listenCollection<ArchivedDebt>(uid, "archivedDebts", setArchivedDebts, "dueDate");
        listenCollection<Worker>(uid, "workers", setAllWorkers, "name");
        listenCollection<AgriculturalSection>(uid, "topics", setTopics, "title");

        // المجموعات الإضافية التي طلبتها:
        listenCollection<FinancialItem>(uid, "financials", setFinancials, "date"); // أو field مناسب
        listenCollection<NoteItem>(uid, "notes", setNotes, "updatedAt");

        setLoading(false);
      } else {
        setUser(null);
        clearAllListeners();
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
        setFinancials([]);
        setNotes([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      clearAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** --- CRUD helpers --- */
  async function addTask(payload: Partial<Task>) {
    if (!user) throw new Error("Not authenticated");
    await addDoc(collection(db, "users", user.uid, "tasks"), {
      ...payload,
      ownerId: user.uid,
      createdAt: Timestamp.now()
    });
  }
  async function deleteTask(taskId: string) {
    if (!user) throw new Error("Not authenticated");
    await deleteDoc(doc(db, "users", user.uid, "tasks", taskId));
  }

  async function addSale(payload: Partial<SalesItem>) {
    if (!user) throw new Error("Not authenticated");
    await addDoc(collection(db, "users", user.uid, "sales"), {
      ...payload,
      ownerId: user.uid,
      date: payload.date ? payload.date : Timestamp.now()
    });
  }
  async function deleteSale(saleId: string) {
    if (!user) throw new Error("Not authenticated");
    await deleteDoc(doc(db, "users", user.uid, "sales", saleId));
  }

  // Financials CRUD
  async function addFinancial(payload: Partial<FinancialItem>) {
    if (!user) throw new Error("Not authenticated");
    await addDoc(collection(db, "users", user.uid, "financials"), {
      ...payload,
      ownerId: user.uid,
      date: payload.date ? payload.date : Timestamp.now()
    });
  }
  async function deleteFinancial(id: string) {
    if (!user) throw new Error("Not authenticated");
    await deleteDoc(doc(db, "users", user.uid, "financials", id));
  }

  // Notes CRUD
  async function addNote(payload: Partial<NoteItem>) {
    if (!user) throw new Error("Not authenticated");
    await addDoc(collection(db, "users", user.uid, "notes"), {
      ...payload,
      ownerId: user.uid,
      updatedAt: payload.updatedAt ? payload.updatedAt : Timestamp.now()
    });
  }
  async function deleteNote(id: string) {
    if (!user) throw new Error("Not authenticated");
    await deleteDoc(doc(db, "users", user.uid, "notes", id));
  }

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
    financials,
    notes,
    addTask,
    deleteTask,
    addSale,
    deleteSale,
    addFinancial,
    deleteFinancial,
    addNote,
    deleteNote
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
    financials,
    notes
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
