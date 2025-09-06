"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onSnapshot, collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

type Topic = {
  id: string;
  title?: string;
  [k: string]: any;
};

type TopicsContextType = {
  topics: Topic[];
  loading: boolean;
  error: string | null;
  addTopic: (data: Omit<Topic, "id">) => Promise<string>;
  deleteTopic: (id: string) => Promise<void>;
};

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // لا نفعل شيئاً حتى تنتهي حالة المصادقة أو يوجد مستخدم
    if (authLoading) {
      setLoading(true);
      return;
    }

    // إذا لا يوجد مستخدم: نفرّغ البيانات ونوقف الانتظار
    if (!user) {
      setTopics([]);
      setLoading(false);
      setError(null);
      return;
    }

    // الآن المستخدم موجود — استمع للمجموعة الفرعية الخاصة بالمستخدم
    const colRef = collection(db, "users", user.uid, "topics");
    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const items: Topic[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setTopics(items);
        setLoading(false);
      },
      (err) => {
        console.error("topics onSnapshot error:", err);
        setError(err?.message ?? "خطأ جلب المواضيع");
        setTopics([]);
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [user, authLoading]);

  async function addTopic(data: Omit<Topic, "id">) {
    if (!user) throw new Error("Not signed in");
    const colRef = collection(db, "users", user.uid, "topics");
    const docRef = await addDoc(colRef, { ...data, ownerId: user.uid, createdAt: serverTimestamp() });
    return docRef.id;
  }

  async function deleteTopic(id: string) {
    if (!user) throw new Error("Not signed in");
    await deleteDoc(doc(db, "users", user.uid, "topics", id));
  }

  return (
    <TopicsContext.Provider value={{ topics, loading, error, addTopic, deleteTopic }}>
      {children}
    </TopicsContext.Provider>
  );
};

export function useTopics() {
  const ctx = useContext(TopicsContext);
  if (!ctx) throw new Error("useTopics must be used within TopicsProvider");
  return ctx;
}
