
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
  getDoc,
  getDocs
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AnyObj = Record<string, any>;

interface AppContextType {
  user: (FirebaseUser & AnyObj) | null;
  loading: boolean;
  // minimal data for debug
  tasks: AnyObj[];
  expenses: AnyObj[];
  notes: AnyObj[];
  // debug helpers
  debugFetchUserDocOnce: () => Promise<void>;
  debugFetchCollectionOnce: (collectionName: string) => Promise<void>;
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
  const [user, setUser] = useState<(FirebaseUser & AnyObj) | null>(null);
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<AnyObj[]>([]);
  const [expenses, setExpenses] = useState<AnyObj[]>([]);
  const [notes, setNotes] = useState<AnyObj[]>([]);

  const unsubRef = useRef<Record<string, Unsubscribe | null>>({});

  // Listen user doc for merging profile fields
  function listenUserDoc(uid: string) {
    const key = "userDoc";
    if (unsubRef.current[key]) unsubRef.current[key]!();
    try {
      const userDocRef = doc(db, "users", uid);
      const unsub = onSnapshot(userDocRef, snap => {
        if (snap.exists()) {
          const data = normalizeDocData<AnyObj>(snap.data() as DocumentData);
          console.debug("[AppProvider] userDoc snapshot:", uid, data);
          setUser(prev => ({ ...(prev ?? {}), ...data }));
        } else {
          console.debug("[AppProvider] userDoc: document does NOT exist for uid:", uid);
        }
      }, err => {
        console.error("[AppProvider] userDoc onSnapshot error:", err);
      });
      unsubRef.current[key] = unsub;
    } catch (e) {
      console.error("[AppProvider] listenUserDoc setup error:", e);
    }
  }

  function listenCollection<T = any>(uid: string, collectionName: string, setter: (items: T[]) => void, orderField?: string) {
    try {
      const key = `col:${collectionName}`;
      if (unsubRef.current[key]) unsubRef.current[key]!();
      const colRef = collection(db, "users", uid, collectionName) as CollectionReference<DocumentData>;
      const q = orderField ? query(colRef, orderBy(orderField, "desc")) : query(colRef);
      const unsub = onSnapshot(q, snap => {
        console.debug(`[AppProvider] snapshot ${collectionName} size=${snap.size}`);
        setter(mapSnapshot<T>(snap));
      }, err => {
        console.error(`[AppProvider] onSnapshot error for ${collectionName}:`, err);
        setter([]);
      });
      unsubRef.current[key] = unsub;
    } catch (err) {
      console.error("[AppProvider] listenCollection setup error:", err);
    }
  }

  function clearAllListeners() {
    Object.keys(unsubRef.current).forEach(k => {
      const u = unsubRef.current[k];
      if (typeof u === "function") {
        try { u(); } catch (e) { /* ignore */ }
      }
      unsubRef.current[k] = null;
    });
  }

  useEffect(() => {
    console.debug("[AppProvider] mounting - setting auth listener");
    const unsubAuth = onAuthStateChanged(auth, async firebaseUser => {
      console.debug("[AppProvider] onAuthStateChanged fired. firebaseUser:", firebaseUser);
      if (firebaseUser) {
        setUser(firebaseUser as any);
        setLoading(true);
        const uid = firebaseUser.uid;

        // Listen user doc and some example collections
        listenUserDoc(uid);
        listenCollection(uid, "tasks", setTasks, "dueDate");
        listenCollection(uid, "expenses", setExpenses, "date");
        listenCollection(uid, "notes", setNotes, "updatedAt");

        setLoading(false);
      } else {
        console.debug("[AppProvider] no user - clearing state");
        setUser(null);
        clearAllListeners();
        setTasks([]);
        setExpenses([]);
        setNotes([]);
        setLoading(false);
      }
    });

    return () => {
      console.debug("[AppProvider] unmounting - cleanup");
      unsubAuth();
      clearAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug helpers you can call from UI (console) via window
  async function debugFetchUserDocOnce() {
    if (!user) {
      console.warn("[debugFetchUserDocOnce] no user (not authenticated)");
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      console.debug("[debugFetchUserDocOnce] doc.exists:", snap.exists(), "data:", snap.exists() ? snap.data() : null);
    } catch (e) {
      console.error("[debugFetchUserDocOnce] error:", e);
    }
  }

  async function debugFetchCollectionOnce(collectionName: string) {
    if (!user) {
      console.warn("[debugFetchCollectionOnce] no user (not authenticated)");
      return;
    }
    try {
      const colRef = collection(db, "users", user.uid, collectionName);
      const snaps = await getDocs(colRef);
      console.debug(`[debugFetchCollectionOnce] ${collectionName} size=${snaps.size}`);
      snaps.forEach(d => console.debug(" doc:", d.id, normalizeDocData(d.data())));
    } catch (e) {
      console.error("[debugFetchCollectionOnce] error:", e);
    }
  }

  // Expose debug helpers to window for quick manual testing (optional)
  useEffect(() => {
    (window as any).__appCtxDebug = {
      debugFetchUserDocOnce,
      debugFetchCollectionOnce,
      getAuthCurrentUser: () => auth.currentUser
    };
    console.debug("[AppProvider] debug helpers installed: window.__appCtxDebug");
    return () => {
      delete (window as any).__appCtxDebug;
    };
  }, [user]);

  const value = useMemo<AppContextType>(() => ({
    user,
    loading,
    tasks,
    expenses,
    notes,
    debugFetchUserDocOnce,
    debugFetchCollectionOnce
  }), [user, loading, tasks, expenses, notes]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
