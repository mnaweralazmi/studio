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
  Timestamp,
  DocumentSnapshot,
  getDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // تأكد أن auth و db مصدّران صحيحان

// --- استخدم أنواعك الحقيقية إن وُجدت ---
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

// لو ليس لديك أنواع معينة، استبدل بأي (any) مؤقتاً:
type FinancialItem = any;
type NoteItem = any;
type DeptItem = any;

interface UserProfile {
  name?: string;
  role?: "admin" | "user";
  points?: number;
  level?: number;
  badges?: string[];
  photoURL?: string;
  // أي حقول أخرى مخزنة داخل مستند المستخدم في Firestore
  [key: string]: any;
}
export interface User extends FirebaseUser, UserProfile {}

interface AppContextType {
  user: User | null;
  loading: boolean;

  // البيانات
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
  depts: DeptItem[];

  // دوال CRUD كمثال
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
    // تحويل Timestamp إلى Date إن وُجد
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
  const [depts, setDepts] = useState<DeptItem[]>([]);

  // لتخزين كل unsubscribe handlers
  const unsubRef = useRef<Record<string, Unsubscribe | null>>({});

  // استماع على مستند المستخدم نفسه (users/{uid}) لقراءة الحقول مثل badges, name, photoURL...
  function listenUserDoc(uid: string) {
    const key = "userDoc";
    if (unsubRef.current[key]) {
      unsubRef.current[key]!();
    }
    const userDocRef = doc(db, "users", uid);
    const unsub = onSnapshot(userDocRef, (snap: DocumentSnapshot<DocumentData>) => {
      if (snap.exists()) {
        const data = normalizeDocData<Record<string, any>>(snap.data() as DocumentData);
        // دمج حقول المستند داخل كائن المستخدم (مع الحفاظ على خصائص auth)
        setUser(prev => {
          const base = prev ? { ...prev } : ({} as any);
          return { ...base, ...data } as User;
        });
      } else {
        // لا يوجد مستند؛ لا نغير auth info لكن يمكن إفراغ الحقول الخاصة إذا أردت
      }
    }, err => {
      console.error("listenUserDoc error:", err);
    });
    unsubRef.current[key] = unsub;
  }

  // دالة عامة للاستماع على collections تحت users/{uid}/{collectionName}
  function listenCollection<T = any>(uid: string, collectionName: string, setter: (items: T[]) => void, orderField?: string) {
    try {
      const colRef = collection(db, "users", uid, collectionName) as CollectionReference<DocumentData>;
      const q = orderField ? query(colRef, orderBy(orderField, "desc")) : query(colRef);
      // إلغاء أي مستمع سابق لنفس الاسم
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

  // EFFECT: مراقبة حالة المصادقة
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        // المستخدم فعلياً مسجّل الدخول
        setUser(firebaseUser as User);
        setLoading(true);

        const uid = firebaseUser.uid;

        // استمع لمستند المستخدم لقراءة الحقول الشخصية (مثلاً badges)
        listenUserDoc(uid);

        // استمع للمجلدات الفرعية الموجودة في الصورة + مجموعات شائعة أخرى
        listenCollection<Task>(uid, "tasks", setTasks, "dueDate");
        listenCollection<ArchivedTask>(uid, "completedTasks", setCompletedTasks, "completedAt");
        listenCollection<SalesItem>(uid, "sales", setAllSales, "date");
        listenCollection<ArchivedSale>(uid, "archivedSales", setArchivedSales, "date");
        listenCollection<ExpenseItem>(uid, "expenses", setAllExpenses, "date");   // حسب الصورة
        listenCollection<ArchivedExpense>(uid, "archivedExpenses", setArchivedExpenses, "date");
        listenCollection<DebtItem>(uid, "debts", setAllDebts, "dueDate");
        listenCollection<ArchivedDebt>(uid, "archivedDebts", setArchivedDebts, "dueDate");
        listenCollection<Worker>(uid, "workers", setAllWorkers, "name");         // حسب الصورة
        listenCollection<AgriculturalSection>(uid, "topics", setTopics, "title");
        // إضافات: financials, notes, depts (depts ظهرت في الصورة)
        listenCollection<FinancialItem>(uid, "financials", setFinancials, "date");
        listenCollection<NoteItem>(uid, "notes", setNotes, "updatedAt");
        listenCollection<DeptItem>(uid, "depts", setDepts, "name");

        setLoading(false);
      } else {
        // لم يعد هناك مستخدم -> تنظيف وإفراغ الحالة
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
        setDepts([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      clearAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** --- CRUD helper functions (أمثلة) --- */
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
    depts,
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
    notes,
    depts
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
